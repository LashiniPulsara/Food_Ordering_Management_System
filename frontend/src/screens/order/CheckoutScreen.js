import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList
} from 'react-native';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

// ─── Time Helpers ────────────────────────────────────────────────────────────
const parseOpeningHours = (hoursStr) => {
  if (!hoursStr) return { startH: 8, startM: 0, endH: 22, endM: 0 };
  try {
    const parts = hoursStr.split('-').map(s => s.trim());
    const parseTime = (str) => {
      const m = str.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
      if (!m) return null;
      let h = parseInt(m[1]), min = parseInt(m[2] || '0');
      const ap = m[3]?.toUpperCase();
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return { h, min };
    };
    const s = parseTime(parts[0]), e = parseTime(parts[1]);
    return { startH: s?.h ?? 8, startM: s?.min ?? 0, endH: e?.h ?? 22, endM: e?.min ?? 0 };
  } catch { return { startH: 8, startM: 0, endH: 22, endM: 0 }; }
};

const generateTimeSlots = (startH, startM, endH, endM, interval = 30) => {
  const slots = [];
  let h = startH, m = startM;
  while (h < endH || (h === endH && m <= endM)) {
    const hh = h % 12 === 0 ? 12 : h % 12;
    const ap = h < 12 ? 'AM' : 'PM';
    slots.push(`${hh}:${String(m).padStart(2, '0')} ${ap}`);
    m += interval;
    if (m >= 60) { m -= 60; h++; }
  }
  return slots;
};

// ─── TimePickerModal ──────────────────────────────────────────────────────────
const TimePickerModal = ({ visible, onClose, onSelect, slots, title, selected }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={tpStyles.overlay}>
      <View style={tpStyles.sheet}>
        <View style={tpStyles.header}>
          <Text style={tpStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
        </View>
        <FlatList
          data={slots}
          keyExtractor={item => item}
          numColumns={3}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isActive = item === selected;
            return (
              <TouchableOpacity
                style={[tpStyles.slot, isActive && tpStyles.slotActive]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.8}
              >
                <Text style={[tpStyles.slotText, isActive && tpStyles.slotTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  </Modal>
);

const tpStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 18, fontWeight: '700', color: '#000' },
  slot: { flex: 1, margin: 5, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#f6f6f6', borderWidth: 1.5, borderColor: '#f0f0f0' },
  slotActive: { backgroundColor: '#000', borderColor: '#000' },
  slotText: { fontSize: 14, fontWeight: '600', color: '#34495e' },
  slotTextActive: { color: '#fff' },
});

// ─── CheckoutScreen ───────────────────────────────────────────────────────────
const CheckoutScreen = ({ navigation }) => {
  const { cartItems, getCartTotal, clearCart, cartRestaurantId } = useContext(CartContext);
  const { userToken, userInfo } = useContext(AuthContext);
  const [isOrdering, setIsOrdering] = useState(false);

  const [orderType, setOrderType] = useState('Delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState(userInfo?.phone || '');
  const [tableNumber, setTableNumber] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  const [numberOfTables, setNumberOfTables] = useState(0);
  const [openingHours, setOpeningHours] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Card modal state
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardProcessing, setCardProcessing] = useState(false);

  useEffect(() => {
    if (cartRestaurantId) {
      api.get(`/restaurants/${cartRestaurantId}`)
        .then(res => {
          const data = res.data.data;
          setNumberOfTables(data.numberOfTables || 0);
          const hrs = data.openingHours || '';
          setOpeningHours(hrs);
          const { startH, startM, endH, endM } = parseOpeningHours(hrs);
          setTimeSlots(generateTimeSlots(startH, startM, endH, endM));
        })
        .catch(err => console.log('Failed to fetch restaurant', err));
    }
  }, [cartRestaurantId]);

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    setCardNumber(cleaned.match(/.{1,4}/g)?.join(' ') || cleaned);
  };

  const validateCard = () => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.length !== 16) { Alert.alert('Invalid Card', 'Card number must be exactly 16 digits.'); return false; }
    if (!cardHolder.trim()) { Alert.alert('Invalid Card', 'Please enter the cardholder name.'); return false; }
    const month = parseInt(expMonth, 10), year = parseInt(expYear, 10);
    const curYear = new Date().getFullYear() % 100, curMonth = new Date().getMonth() + 1;
    if (!expMonth || month < 1 || month > 12) { Alert.alert('Invalid Card', 'Expiry month must be between 01 and 12.'); return false; }
    if (!expYear || expYear.length !== 2) { Alert.alert('Invalid Card', 'Enter last 2 digits of expiry year (e.g. 27).'); return false; }
    if (year < curYear || (year === curYear && month < curMonth)) { Alert.alert('Invalid Card', 'This card has expired.'); return false; }
    if (cvv.length < 3 || cvv.length > 4) { Alert.alert('Invalid Card', 'CVV must be 3 or 4 digits.'); return false; }
    return true;
  };

  const handleCardPayment = async () => {
    if (!validateCard()) return;
    setCardProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setCardProcessing(false);
    setShowCardModal(false);
    await placeOrder('Card');
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) { Alert.alert('Cart empty', 'Your cart is empty.'); return navigation.goBack(); }
    if (orderType === 'Delivery') {
      if (!deliveryAddress.trim()) return Alert.alert('Missing Info', 'Please enter your delivery address.');
      if (!deliveryPhone.trim()) return Alert.alert('Missing Info', 'Please enter a contact phone number.');
    }
    if (orderType === 'Dine-in') {
      if (!arrivalTime) return Alert.alert('Missing Info', 'Please select your arrival time.');
      if (!tableNumber) return Alert.alert('Missing Info', 'Please select a table.');
    }
    if (paymentMethod === 'Card') { setShowCardModal(true); }
    else { await placeOrder('Cash on Delivery'); }
  };

  const placeOrder = async (method) => {
    setIsOrdering(true);
    try {
      const items = cartItems.map(item => ({ menuItem: item._id, quantity: item.quantity, price: item.price }));
      const finalTotal = orderType === 'Delivery' ? getCartTotal() + 300 : getCartTotal();
      const payload = {
        restaurantId: cartRestaurantId, items,
        totalAmount: finalTotal, orderType,
        deliveryAddress: orderType === 'Delivery' ? deliveryAddress : undefined,
        deliveryPhone: orderType === 'Delivery' ? deliveryPhone : undefined,
        tableNumber: orderType === 'Dine-in' ? Number(tableNumber) : undefined,
        arrivalTime: orderType === 'Dine-in' ? arrivalTime : undefined,
        paymentMethod: method
      };
      const orderRes = await api.post('/orders', payload, { headers: { Authorization: `Bearer ${userToken}` } });
      await api.post('/payments', {
        orderId: orderRes.data.data._id,
        paymentMethod: method,
        amount: finalTotal,
        paymentStatus: method === 'Card' ? 'completed' : 'pending'
      }, { headers: { Authorization: `Bearer ${userToken}` } });
      clearCart();
      Alert.alert('🎉 Order Placed!', `Payment: ${method}`, [
        { text: 'View Orders', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }, { name: 'Orders' }] }) }
      ]);
    } catch (error) {
      Alert.alert('Checkout Failed', error.response?.data?.message || error.message);
    } finally { setIsOrdering(false); }
  };

  const totalAmount = orderType === 'Delivery' ? getCartTotal() + 300 : getCartTotal();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <Text style={styles.title}>Checkout</Text>
          <Text style={styles.subtitle}>Complete your order details below</Text>
        </View>

        {/* Order Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dining Preference</Text>
          <View style={styles.typeToggleContainer}>
            {['Delivery', 'Dine-in'].map(type => (
              <TouchableOpacity key={type} style={[styles.typeBtn, orderType === type && styles.typeBtnActive]}
                onPress={() => setOrderType(type)} activeOpacity={0.8}>
                <Text style={[styles.typeBtnText, orderType === type && styles.typeBtnTextActive]}>
                  {type === 'Delivery' ? '🛵 Delivery' : '🍽️ Dine-in'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          {orderType === 'Delivery' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Delivery Details</Text>
              <Text style={styles.label}>Address</Text>
              <TextInput style={styles.inputArea} placeholder="Enter full delivery address..." placeholderTextColor="#a4b0be"
                value={deliveryAddress} onChangeText={setDeliveryAddress} multiline numberOfLines={3} />
              <Text style={[styles.label, { marginTop: 12 }]}>Phone Number</Text>
              <TextInput style={styles.inputField} placeholder="0712345678" placeholderTextColor="#a4b0be"
                value={deliveryPhone} onChangeText={setDeliveryPhone} keyboardType="phone-pad" />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dine-in Details</Text>

              {/* Opening Hours Info */}
              {openingHours ? (
                <View style={styles.hoursInfo}>
                  <Ionicons name="time-outline" size={14} color="#3498db" />
                  <Text style={styles.hoursInfoText}>Open: {openingHours}</Text>
                </View>
              ) : null}

              {/* Arrival Time Picker */}
              <Text style={styles.label}>Arrival Time</Text>
              <TouchableOpacity
                style={[styles.pickerBtn, !arrivalTime && styles.pickerBtnEmpty]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={18} color={arrivalTime ? '#000' : '#aaa'} />
                <Text style={[styles.pickerBtnText, !arrivalTime && styles.pickerBtnTextEmpty]}>
                  {arrivalTime || 'Select arrival time...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#aaa" />
              </TouchableOpacity>
              {timeSlots.length > 0 && (
                <Text style={styles.note}>Only showing times within opening hours</Text>
              )}

              {/* Table Selector */}
              <Text style={[styles.label, { marginTop: 16 }]}>Available Tables</Text>
              {numberOfTables > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Array.from({ length: numberOfTables }).map((_, i) => {
                    const tNum = i + 1, isSel = tableNumber === tNum;
                    return (
                      <TouchableOpacity key={tNum}
                        style={[styles.tableBlock, isSel && styles.tableBlockSelected]}
                        onPress={() => setTableNumber(tNum)}>
                        <Text style={[styles.tableText, isSel && styles.tableTextSelected]}>Table {tNum}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : <Text style={styles.note}>No tables configured for this restaurant.</Text>}
              <Text style={styles.note}>Please sit at your selected table to receive your order.</Text>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {[
              { key: 'Cash on Delivery', icon: 'cash-outline', sub: orderType === 'Dine-in' ? 'Pay at restaurant' : 'Pay on arrival' },
              { key: 'Card', icon: 'card-outline', sub: 'Visa / Mastercard' }
            ].map(opt => (
              <TouchableOpacity key={opt.key}
                style={[styles.paymentOption, paymentMethod === opt.key && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod(opt.key)} activeOpacity={0.8}>
                <Ionicons name={opt.icon} size={22} color={paymentMethod === opt.key ? COLORS.primary : COLORS.textMedium} />
                <Text style={[styles.paymentOptionText, paymentMethod === opt.key && styles.paymentOptionTextActive]}>{opt.key}</Text>
                <Text style={[styles.paymentOptionSub, paymentMethod === opt.key && { color: '#ffffffaa' }]}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal ({cartItems.length} items)</Text><Text style={styles.summaryValue}>Rs. {getCartTotal().toFixed(2)}</Text></View>
            {orderType === 'Delivery' && (<View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery Fee</Text><Text style={styles.summaryValue}>Rs. 300.00</Text></View>)}
            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Total Amount</Text><Text style={styles.summaryTotalValue}>Rs. {totalAmount.toFixed(2)}</Text></View>
            <View style={[styles.summaryRow, { marginTop: 8 }]}>
              <Text style={styles.summaryLabel}>Payment</Text>
              <Text style={[styles.summaryValue, { color: paymentMethod === 'Card' ? '#27ae60' : '#e67e22' }]}>{paymentMethod}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {isOrdering ? <ActivityIndicator size="large" color="#000000" /> : (
          <TouchableOpacity style={styles.checkoutBtn} onPress={handlePlaceOrder} activeOpacity={0.85}>
            <Text style={styles.checkoutBtnText}>{paymentMethod === 'Card' ? '💳 Pay & Place Order' : 'Confirm & Place Order'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelect={setArrivalTime}
        slots={timeSlots}
        title={`Select Arrival Time${openingHours ? ` (${openingHours})` : ''}`}
        selected={arrivalTime}
      />

      {/* Card Payment Modal */}
      <Modal visible={showCardModal} transparent animationType="slide" onRequestClose={() => setShowCardModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Card Payment</Text>
                <TouchableOpacity onPress={() => setShowCardModal(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
              </View>
              <Text style={styles.modalAmount}>Rs. {totalAmount.toFixed(2)}</Text>
              <Text style={styles.fieldLabel}>Card Number</Text>
              <TextInput style={styles.cardInput} placeholder="0000 0000 0000 0000" placeholderTextColor="#aaa" value={cardNumber} onChangeText={formatCardNumber} keyboardType="number-pad" maxLength={19} />
              <Text style={styles.fieldLabel}>Cardholder Name</Text>
              <TextInput style={styles.cardInput} placeholder="Name on card" placeholderTextColor="#aaa" value={cardHolder} onChangeText={setCardHolder} autoCapitalize="words" />
              <View style={styles.cardRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Month (MM)</Text>
                  <TextInput style={styles.cardInput} placeholder="01–12" placeholderTextColor="#aaa" value={expMonth} onChangeText={t => setExpMonth(t.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" maxLength={2} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Year (YY)</Text>
                  <TextInput style={styles.cardInput} placeholder="e.g. 27" placeholderTextColor="#aaa" value={expYear} onChangeText={t => setExpYear(t.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" maxLength={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>CVV</Text>
                  <TextInput style={styles.cardInput} placeholder="•••" placeholderTextColor="#aaa" value={cvv} onChangeText={t => setCvv(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} secureTextEntry />
                </View>
              </View>
              <Text style={styles.mockNote}>🔒 Simulated payment — no real charge.</Text>
              {cardProcessing ? (
                <View style={styles.processingBox}><ActivityIndicator size="small" color="#fff" /><Text style={styles.processingText}>Processing...</Text></View>
              ) : (
                <TouchableOpacity style={styles.payNowBtn} onPress={handleCardPayment} activeOpacity={0.85}>
                  <Text style={styles.payNowText}>Pay Rs. {totalAmount.toFixed(2)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.textDark },
  subtitle: { fontSize: 14, color: COLORS.textMedium, marginTop: 5 },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 15 },
  typeToggleContainer: { flexDirection: 'row', backgroundColor: COLORS.secondary, borderRadius: 16, padding: 6 },
  typeBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  typeBtnActive: { backgroundColor: COLORS.surface, elevation: 4, shadowColor: COLORS.shadow, shadowOpacity: 1, shadowRadius: 8 },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textMedium },
  typeBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 15 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  hoursInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EBF5FB', padding: 10, borderRadius: 10, marginBottom: 16 },
  hoursInfoText: { fontSize: 13, color: '#2980b9', fontWeight: '600' },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f6f6f6', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  pickerBtnEmpty: { borderColor: '#E8E8E8' },
  pickerBtnText: { flex: 1, fontSize: 16, color: '#000', fontWeight: '500' },
  pickerBtnTextEmpty: { color: '#aaa', fontWeight: '400' },
  inputField: { backgroundColor: '#f6f6f6', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000' },
  inputArea: { backgroundColor: '#f6f6f6', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000', textAlignVertical: 'top', minHeight: 100 },
  tableBlock: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#f6f6f6', borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#E8E8E8' },
  tableBlockSelected: { backgroundColor: COLORS.secondary, borderColor: COLORS.primary },
  tableText: { fontSize: 16, color: COLORS.textDark, fontWeight: '600' },
  tableTextSelected: { color: COLORS.primary },
  note: { fontSize: 12, color: '#A0A0A0', marginTop: 10, fontStyle: 'italic' },
  paymentOptions: { flexDirection: 'row', gap: 12 },
  paymentOption: { flex: 1, backgroundColor: '#f6f6f6', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#E8E8E8' },
  paymentOptionActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.primary },
  paymentOptionText: { fontSize: 13, fontWeight: '700', color: '#000', marginTop: 8, textAlign: 'center' },
  paymentOptionTextActive: { color: COLORS.primary },
  paymentOptionSub: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 15 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 15, color: '#545454' },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#000000' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  summaryTotalLabel: { fontSize: 18, fontWeight: '700', color: '#000000' },
  summaryTotalValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, paddingVertical: 20, paddingHorizontal: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, elevation: 15, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: -8 }, shadowOpacity: 1, shadowRadius: 20 },
  checkoutBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  checkoutBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  modalAmount: { fontSize: 32, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginBottom: 24 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: 6, marginTop: 12 },
  cardInput: { backgroundColor: '#f6f6f6', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000' },
  cardRow: { flexDirection: 'row' },
  mockNote: { fontSize: 12, color: '#95a5a6', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  processingBox: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 8 },
  processingText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  payNowBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  payNowText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default CheckoutScreen;
