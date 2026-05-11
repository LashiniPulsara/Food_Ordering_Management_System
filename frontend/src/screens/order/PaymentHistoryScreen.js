import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Modal, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return '#2ecc71';
    case 'pending': return '#f39c12';
    case 'failed': return '#e74c3c';
    default: return '#95a5a6';
  }
};

const PaymentHistoryScreen = () => {
  const { userToken } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments/myhistory', authConfig);
      setPayments(res.data.data || []);
    } catch (error) {
      console.log('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const openInvoice = async (paymentId) => {
    setInvoiceLoading(true);
    try {
      const res = await api.get(`/payments/${paymentId}/invoice`, authConfig);
      setSelectedInvoice(res.data.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load invoice for this payment.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const renderPaymentCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.invoiceId}>
            INV-{item._id.substring(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.restaurantName}>
            {item.orderId?.restaurantId?.restaurantName || 'Restaurant'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.paymentStatus) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.paymentStatus) }]}>
            {item.paymentStatus?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color="#545454" />
          <Text style={styles.infoText}>{item.paymentMethod}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#545454" />
          <Text style={styles.infoText}>
            {new Date(item.paymentDate || item.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric'
            })}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.amount}>Rs. {Number(item.amount).toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.invoiceBtn}
          onPress={() => openInvoice(item._id)}
          activeOpacity={0.8}
        >
          {invoiceLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={16} color="#fff" />
              <Text style={styles.invoiceBtnText}>Invoice</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item._id}
        renderItem={renderPaymentCard}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="receipt-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>No payment history yet.</Text>
            <Text style={styles.emptySubText}>Your payments will appear here after placing orders.</Text>
          </View>
        }
      />

      {/* Invoice Modal */}
      <Modal
        visible={!!selectedInvoice}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invoice</Text>
              <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedInvoice && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Invoice ID & Date */}
                <View style={styles.invoiceTopRow}>
                  <Text style={styles.invoiceNumber}>{selectedInvoice.invoiceId}</Text>
                  <Text style={styles.invoiceDate}>
                    {new Date(selectedInvoice.date || Date.now()).toLocaleDateString('en-US', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* Customer & Restaurant */}
                <View style={styles.partiesRow}>
                  <View style={styles.party}>
                    <Text style={styles.partyLabel}>BILLED TO</Text>
                    <Text style={styles.partyName}>{selectedInvoice.customerData?.name}</Text>
                    <Text style={styles.partyDetail}>{selectedInvoice.customerData?.email}</Text>
                    <Text style={styles.partyDetail}>{selectedInvoice.customerData?.phone}</Text>
                  </View>
                  <View style={styles.party}>
                    <Text style={styles.partyLabel}>FROM</Text>
                    <Text style={styles.partyName}>{selectedInvoice.restaurantData?.restaurantName}</Text>
                    <Text style={styles.partyDetail}>{selectedInvoice.restaurantData?.phone}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Items */}
                <Text style={styles.itemsHeading}>Items</Text>
                {selectedInvoice.items?.map((item, idx) => (
                  <View key={idx} style={styles.lineItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineItemName}>{item.name}</Text>
                      <Text style={styles.lineItemQty}>x{item.quantity} @ Rs. {item.unitPrice}</Text>
                    </View>
                    <Text style={styles.lineItemTotal}>Rs. {Number(item.total).toFixed(2)}</Text>
                  </View>
                ))}

                <View style={styles.divider} />

                {/* Total */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Paid</Text>
                  <Text style={styles.totalValue}>Rs. {Number(selectedInvoice.totalAmount).toFixed(2)}</Text>
                </View>

                {/* Payment Method */}
                <View style={styles.paymentMethodRow}>
                  <Ionicons name="card-outline" size={16} color="#545454" />
                  <Text style={styles.paymentMethodText}>
                    Paid via {selectedInvoice.method} · Status: {selectedInvoice.status}
                  </Text>
                </View>

                <Text style={styles.thankYou}>Thank you for your order! 🙏</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, color: '#95a5a6', marginTop: 16, fontWeight: '600' },
  emptySubText: { fontSize: 13, color: '#bdc3c7', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 14, elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  invoiceId: { fontSize: 14, fontWeight: '700', color: '#000', fontFamily: 'monospace' },
  restaurantName: { fontSize: 13, color: '#545454', marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { fontSize: 14, color: '#34495e', marginLeft: 8 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  amount: { fontSize: 20, fontWeight: '700', color: '#000' },
  invoiceBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 6 },
  invoiceBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000' },

  invoiceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  invoiceNumber: { fontSize: 16, fontWeight: '800', color: '#000', fontFamily: 'monospace' },
  invoiceDate: { fontSize: 13, color: '#545454' },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },

  partiesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  party: { flex: 1 },
  partyLabel: { fontSize: 10, fontWeight: '700', color: '#95a5a6', textTransform: 'uppercase', marginBottom: 6 },
  partyName: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 3 },
  partyDetail: { fontSize: 12, color: '#545454', marginBottom: 2 },

  itemsHeading: { fontSize: 13, fontWeight: '700', color: '#95a5a6', textTransform: 'uppercase', marginBottom: 12 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  lineItemName: { fontSize: 15, fontWeight: '600', color: '#000' },
  lineItemQty: { fontSize: 12, color: '#545454', marginTop: 2 },
  lineItemTotal: { fontSize: 15, fontWeight: '700', color: '#000' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#000' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#000' },

  paymentMethodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  paymentMethodText: { fontSize: 13, color: '#545454' },

  thankYou: { textAlign: 'center', color: '#95a5a6', marginTop: 24, fontSize: 14 },
});

export default PaymentHistoryScreen;
