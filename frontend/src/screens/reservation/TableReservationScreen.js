import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView,
  Platform, Modal, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

// ─── Helpers ────────────────────────────────────────────────────────────────
const parseOpeningHours = (str) => {
  if (!str) return { startH: 8, startM: 0, endH: 22, endM: 0 };
  try {
    const parts = str.split('-').map(s => s.trim());
    const parse = (s) => {
      const m = s.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
      if (!m) return null;
      let h = parseInt(m[1]), min = parseInt(m[2] || '0');
      const ap = m[3]?.toUpperCase();
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return { h, min };
    };
    const s = parse(parts[0]), e = parse(parts[1]);
    return { startH: s?.h ?? 8, startM: s?.min ?? 0, endH: e?.h ?? 22, endM: e?.min ?? 0 };
  } catch { return { startH: 8, startM: 0, endH: 22, endM: 0 }; }
};

const generateSlots = (startH, startM, endH, endM, interval = 30) => {
  const slots = [];
  let h = startH, m = startM;
  while (h < endH || (h === endH && m <= endM)) {
    const hh = h % 12 === 0 ? 12 : h % 12;
    const ap = h < 12 ? 'AM' : 'PM';
    slots.push(`${hh}:${String(m).padStart(2, '0')} ${ap}`);
    m += interval; if (m >= 60) { m -= 60; h++; }
  }
  return slots;
};

const generateDays = (count = 60) => {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Picker Modals ──────────────────────────────────────────────────────────
const TimePickerModal = ({ visible, onClose, onSelect, slots, title, selected }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={pk.overlay}>
      <View style={pk.sheet}>
        <View style={pk.header}>
          <Text style={pk.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
        </View>
        <FlatList
          data={slots}
          keyExtractor={i => i}
          numColumns={3}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const active = item === selected;
            return (
              <TouchableOpacity style={[pk.slot, active && pk.slotOn]} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={[pk.slotTxt, active && pk.slotTxtOn]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  </Modal>
);

const DatePickerModal = ({ visible, onClose, onSelect, selected }) => {
  const days = generateDays(60);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pk.overlay}>
        <View style={pk.sheet}>
          <View style={pk.header}>
            <Text style={pk.title}>Select Date</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
          </View>
          <FlatList
            data={days}
            keyExtractor={d => d.toISOString()}
            numColumns={4}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item: d }) => {
              const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              const active = iso === selected;
              return (
                <TouchableOpacity style={[pk.dateSlot, active && pk.slotOn]} onPress={() => { onSelect(iso); onClose(); }}>
                  <Text style={[pk.dateDayName, active && { color: '#ffffffaa' }]}>{DAY_NAMES[d.getDay()]}</Text>
                  <Text style={[pk.dateNum, active && pk.slotTxtOn]}>{d.getDate()}</Text>
                  <Text style={[pk.dateMon, active && { color: '#ffffffaa' }]}>{MONTH_NAMES[d.getMonth()]}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const pk = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 18, fontWeight: '700', color: '#000' },
  slot: { flex: 1, margin: 5, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#f6f6f6', borderWidth: 1.5, borderColor: '#f0f0f0' },
  slotOn: { backgroundColor: '#000', borderColor: '#000' },
  slotTxt: { fontSize: 13, fontWeight: '600', color: '#34495e' },
  slotTxtOn: { color: '#fff' },
  dateSlot: { flex: 1, margin: 5, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#f6f6f6', borderWidth: 1.5, borderColor: '#f0f0f0' },
  dateDayName: { fontSize: 10, color: '#888', fontWeight: '600', marginBottom: 2 },
  dateNum: { fontSize: 18, fontWeight: '800', color: '#000' },
  dateMon: { fontSize: 10, color: '#888', marginTop: 2 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
const TableReservationScreen = ({ route, navigation }) => {
  const { restaurantId, restaurantName } = route.params;
  const { userToken, userInfo } = useContext(AuthContext);

  const [customerName, setCustomerName] = useState(userInfo?.name || '');
  const [customerPhone, setCustomerPhone] = useState(userInfo?.phone || '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [numTables, setNumTables] = useState('1');
  const [tableInfo, setTableInfo] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');

  const [loading, setLoading] = useState(false);
  const [capLoading, setCapLoading] = useState(true);
  const [capacityInfo, setCapacityInfo] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [openingHours, setOpeningHours] = useState('');

  const [showDate, setShowDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  // Card gateway state
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardProcessing, setCardProcessing] = useState(false);

  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const res = await api.get(`/restaurants/${restaurantId}`);
        if (res.data?.data) {
          const d = res.data.data;
          setCapacityInfo({ tables: d.numberOfTables || 0, chairs: d.chairsPerTable || 0 });
          const hrs = d.openingHours || '';
          setOpeningHours(hrs);
          const { startH, startM, endH, endM } = parseOpeningHours(hrs);
          setTimeSlots(generateSlots(startH, startM, endH, endM));
        }
      } catch (e) { console.log('Capacity fetch error', e); }
      finally { setCapLoading(false); }
    };
    fetchCapacity();
  }, [restaurantId]);

  const formatCardNumber = (t) => {
    const c = t.replace(/\D/g, '').slice(0, 16);
    setCardNumber(c.match(/.{1,4}/g)?.join(' ') || c);
  };

  const validateCard = () => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.length !== 16) { Alert.alert('Invalid Card', '16 digits required.'); return false; }
    if (!cardHolder.trim()) { Alert.alert('Invalid Card', 'Cardholder name required.'); return false; }
    const mo = parseInt(expMonth), yr = parseInt(expYear);
    const cy = new Date().getFullYear() % 100, cm = new Date().getMonth() + 1;
    if (!expMonth || mo < 1 || mo > 12) { Alert.alert('Invalid Card', 'Month must be 01–12.'); return false; }
    if (!expYear || expYear.length !== 2) { Alert.alert('Invalid Card', 'Enter 2-digit year (e.g. 27).'); return false; }
    if (yr < cy || (yr === cy && mo < cm)) { Alert.alert('Invalid Card', 'Card has expired.'); return false; }
    if (cvv.length < 3 || cvv.length > 4) { Alert.alert('Invalid Card', 'CVV must be 3–4 digits.'); return false; }
    return true;
  };

  const handleReserve = () => {
    if (!customerName || !customerPhone || !date || !startTime || !guests || !numTables) {
      return Alert.alert('Missing Details', 'Please fill in all required fields.');
    }
    const advance = Number(advancePayment);
    if (advance > 0) setShowCardModal(true);
    else submitReservation();
  };

  const handleCardPayment = async () => {
    if (!validateCard()) return;
    setCardProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setCardProcessing(false);
    setShowCardModal(false);
    submitReservation();
  };

  const submitReservation = async () => {
    setLoading(true);
    try {
      await api.post('/reservations', {
        restaurantId,
        reservationDate: date,
        reservationTime: startTime,
        reservationEndTime: endTime,
        numberOfTables: parseInt(numTables) || 1,
        guestCount: parseInt(guests, 10),
        tableNumber: tableInfo || 'Any',
        customerName,
        customerPhone,
        advancePayment: Number(advancePayment) || 0
      }, { headers: { Authorization: `Bearer ${userToken}` } });

      Alert.alert('🎉 Reservation Confirmed!', `Your table at ${restaurantName} is booked for ${date} at ${startTime}.`, [
        { text: 'Awesome!', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Booking Failed', e.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const advance = Number(advancePayment) || 0;

  const PickerButton = ({ value, placeholder, onPress, icon }) => (
    <TouchableOpacity style={s.pickerBtn} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={18} color={value ? '#000' : '#aaa'} />
      <Text style={[s.pickerBtnTxt, !value && s.pickerBtnPlaceholder]}>{value || placeholder}</Text>
      <Ionicons name="chevron-down" size={16} color="#aaa" />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.heroHeader}>
          <Text style={s.heroTitle}>Reserve a Table</Text>
          <Text style={s.heroSub}>{restaurantName}</Text>
          {openingHours ? (
            <View style={s.hoursBadge}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={s.hoursBadgeTxt}> Open: {openingHours}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.formWrap}>
          {!capLoading && capacityInfo && (capacityInfo.tables > 0) && (
            <View style={s.capacityBadge}>
              <Text style={s.capacityTxt}>
                ℹ️ <Text style={{ fontWeight: '700' }}>{capacityInfo.tables}</Text> tables available, <Text style={{ fontWeight: '700' }}>{capacityInfo.chairs}</Text> chairs per table
              </Text>
            </View>
          )}

          <View style={s.card}>
            <Text style={s.secTitle}>Customer Details</Text>
            <Text style={s.lbl}>Full Name</Text>
            <TextInput style={s.input} placeholder="John Doe" placeholderTextColor="#a4b0be" value={customerName} onChangeText={setCustomerName} />
            <Text style={s.lbl}>Phone Number</Text>
            <TextInput style={s.input} placeholder="0712345678" placeholderTextColor="#a4b0be" keyboardType="phone-pad" value={customerPhone} onChangeText={setCustomerPhone} />
          </View>

          <View style={s.card}>
            <Text style={s.secTitle}>Reservation Details</Text>

            <Text style={s.lbl}>Date *</Text>
            <PickerButton value={date} placeholder="Select date..." onPress={() => setShowDate(true)} icon="calendar-outline" />

            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.lbl}>Start Time *</Text>
                <PickerButton value={startTime} placeholder="From..." onPress={() => setShowStartTime(true)} icon="time-outline" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.lbl}>End Time</Text>
                <PickerButton value={endTime} placeholder="Until..." onPress={() => setShowEndTime(true)} icon="time-outline" />
              </View>
            </View>
            {openingHours ? <Text style={s.note}>Times within: {openingHours}</Text> : null}

            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.lbl}>No. of Tables *</Text>
                <TextInput style={s.input} placeholder="1" placeholderTextColor="#a4b0be" keyboardType="numeric" value={numTables} onChangeText={setNumTables} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.lbl}>No. of Guests *</Text>
                <TextInput style={s.input} placeholder="2" placeholderTextColor="#a4b0be" keyboardType="numeric" value={guests} onChangeText={setGuests} />
              </View>
            </View>

            <Text style={s.lbl}>Table Preference (optional)</Text>
            <TextInput style={s.input} placeholder="Window seat, near entrance..." placeholderTextColor="#a4b0be" value={tableInfo} onChangeText={setTableInfo} />
          </View>

          <View style={s.card}>
            <Text style={s.secTitle}>Advance Payment</Text>
            <Text style={s.lbl}>Amount (Rs.) — optional, 0 to skip</Text>
            <TextInput style={s.input} placeholder="e.g. 1000" placeholderTextColor="#a4b0be" keyboardType="numeric" value={advancePayment} onChangeText={setAdvancePayment} />
            {advance > 0 && (
              <View style={s.payNote}>
                <Ionicons name="card-outline" size={15} color="#3498db" />
                <Text style={s.payNoteText}>Rs. {advance} will be charged via card gateway</Text>
              </View>
            )}
            {loading ? (
              <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
            ) : (
              <TouchableOpacity style={s.btn} onPress={handleReserve} activeOpacity={0.85}>
                <Ionicons name={advance > 0 ? 'card-outline' : 'calendar-outline'} size={18} color="#fff" />
                <Text style={s.btnTxt}>
                  {advance > 0 ? `  Pay Rs. ${advance} & Reserve` : '  Confirm Reservation'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.infoBox}>
            <Text style={s.infoTitle}>Reservation Policy</Text>
            <Text style={s.infoText}>Please arrive 10 minutes before your scheduled time. Your table will be held for 15 minutes past the reservation time.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker */}
      <DatePickerModal visible={showDate} onClose={() => setShowDate(false)} onSelect={setDate} selected={date} />

      {/* Start Time Picker */}
      <TimePickerModal visible={showStartTime} onClose={() => setShowStartTime(false)} onSelect={setStartTime}
        slots={timeSlots} title={`Start Time${openingHours ? ` · ${openingHours}` : ''}`} selected={startTime} />

      {/* End Time Picker */}
      <TimePickerModal visible={showEndTime} onClose={() => setShowEndTime(false)} onSelect={setEndTime}
        slots={timeSlots} title={`End Time${openingHours ? ` · ${openingHours}` : ''}`} selected={endTime} />

      {/* Card Payment Modal */}
      <Modal visible={showCardModal} transparent animationType="slide" onRequestClose={() => setShowCardModal(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={s.modalCard}>
              <View style={s.modalHdr}>
                <Text style={s.modalTitle}>Advance Payment</Text>
                <TouchableOpacity onPress={() => setShowCardModal(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
              </View>
              <Text style={s.modalAmt}>Rs. {advance.toFixed(2)}</Text>
              <Text style={s.modalSub}>Advance for {restaurantName}</Text>
              <Text style={s.fldLbl}>Card Number</Text>
              <TextInput style={s.cardInput} placeholder="0000 0000 0000 0000" placeholderTextColor="#aaa" value={cardNumber} onChangeText={formatCardNumber} keyboardType="number-pad" maxLength={19} />
              <Text style={s.fldLbl}>Cardholder Name</Text>
              <TextInput style={s.cardInput} placeholder="Name on card" placeholderTextColor="#aaa" value={cardHolder} onChangeText={setCardHolder} autoCapitalize="words" />
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={s.fldLbl}>Month (MM)</Text>
                  <TextInput style={s.cardInput} placeholder="01–12" placeholderTextColor="#aaa" value={expMonth} onChangeText={t => setExpMonth(t.replace(/\D/g,'').slice(0,2))} keyboardType="number-pad" maxLength={2} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={s.fldLbl}>Year (YY)</Text>
                  <TextInput style={s.cardInput} placeholder="27" placeholderTextColor="#aaa" value={expYear} onChangeText={t => setExpYear(t.replace(/\D/g,'').slice(0,2))} keyboardType="number-pad" maxLength={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fldLbl}>CVV</Text>
                  <TextInput style={s.cardInput} placeholder="•••" placeholderTextColor="#aaa" value={cvv} onChangeText={t => setCvv(t.replace(/\D/g,'').slice(0,4))} keyboardType="number-pad" maxLength={4} secureTextEntry />
                </View>
              </View>
              <Text style={s.mockNote}>🔒 Simulated payment — no real charge.</Text>
              {cardProcessing ? (
                <View style={s.processingBox}><ActivityIndicator size="small" color="#fff" /><Text style={s.processingTxt}> Processing...</Text></View>
              ) : (
                <TouchableOpacity style={s.payBtn} onPress={handleCardPayment} activeOpacity={0.85}>
                  <Text style={s.payBtnTxt}>Pay Rs. {advance.toFixed(2)} & Reserve</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 40 },
  heroHeader: { backgroundColor: '#000', paddingTop: 40, paddingBottom: 50, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 15, color: '#ffffff88', marginTop: 6 },
  hoursBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff22', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  hoursBadgeTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  formWrap: { paddingHorizontal: 20, marginTop: -30 },
  capacityBadge: { backgroundColor: '#E3F2FD', padding: 14, borderRadius: 12, marginBottom: 16, marginTop: 35, borderWidth: 1, borderColor: '#BBDEFB', alignItems: 'center' },
  capacityTxt: { fontSize: 14, color: '#1565C0', lineHeight: 20, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 22, marginBottom: 16, elevation: 6, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 16 },
  secTitle: { fontSize: 17, fontWeight: '700', color: '#000', marginBottom: 16 },
  lbl: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#f6f6f6', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000' },
  row: { flexDirection: 'row' },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f6f6f6', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  pickerBtnTxt: { flex: 1, fontSize: 15, color: '#000', fontWeight: '500' },
  pickerBtnPlaceholder: { color: '#aaa', fontWeight: '400' },
  note: { fontSize: 12, color: '#95a5a6', marginTop: 6, fontStyle: 'italic' },
  payNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EBF5FB', padding: 12, borderRadius: 10, marginTop: 12 },
  payNoteText: { flex: 1, fontSize: 13, color: '#2980b9', fontWeight: '500' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', paddingVertical: 18, borderRadius: 14, marginTop: 18 },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  infoBox: { marginTop: 8, marginBottom: 30, padding: 18, backgroundColor: '#EEF2F5', borderRadius: 14, borderLeftWidth: 4, borderLeftColor: '#A4B0BE' },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#545454', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 19, fontWeight: '700', color: '#000' },
  modalAmt: { fontSize: 34, fontWeight: '800', color: '#000', textAlign: 'center', marginTop: 6 },
  modalSub: { fontSize: 13, color: '#95a5a6', textAlign: 'center', marginBottom: 16 },
  fldLbl: { fontSize: 12, fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: 6, marginTop: 12 },
  cardInput: { backgroundColor: '#f6f6f6', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000' },
  mockNote: { fontSize: 12, color: '#95a5a6', textAlign: 'center', marginTop: 14, marginBottom: 8 },
  processingBox: { backgroundColor: '#000', borderRadius: 14, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  processingTxt: { color: '#fff', fontWeight: '600', fontSize: 15 },
  payBtn: { backgroundColor: '#000', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  payBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default TableReservationScreen;
