import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const deliveryFlow = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered'];
const dineInFlow   = ['Pending', 'Preparing', 'Order Ready', 'Served'];

const STATUS_CONFIG = {
  'Pending':           { color: '#f39c12', bg: '#FFF9E6', icon: 'time-outline' },
  'Preparing':         { color: '#3498db', bg: '#EBF5FB', icon: 'flame-outline' },
  'Out for Delivery':  { color: '#9b59b6', bg: '#F5EEF8', icon: 'bicycle-outline' },
  'Order Ready':       { color: '#27ae60', bg: '#EAFAF1', icon: 'restaurant-outline' },
  'Delivered':         { color: '#2ecc71', bg: '#EAFAF1', icon: 'checkmark-circle-outline' },
  'Served':            { color: '#16a085', bg: '#E8F8F5', icon: 'checkmark-done-outline' },
  'Cancelled':         { color: '#e74c3c', bg: '#FDEDEC', icon: 'close-circle-outline' },
};

const OwnerOrdersScreen = () => {
  const { userToken } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

  const loadOrders = async () => {
    try {
      const res = await api.get('/orders/owner/my-restaurant', authConfig);
      setOrders(res.data.data || []);
    } catch (error) {
      if (error.response?.status !== 404) console.log('Owner orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const moveToNextStatus = async (order) => {
    const flow = order.orderType === 'Dine-in' ? dineInFlow : deliveryFlow;
    const idx = flow.indexOf(order.orderStatus);
    if (idx < 0 || idx >= flow.length - 1) return;
    const nextStatus = flow[idx + 1];

    Alert.alert(
      'Update Order',
      `Move order to "${nextStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm', onPress: async () => {
            try {
              await api.put(`/orders/${order._id}/status`, { orderStatus: nextStatus }, authConfig);
              loadOrders();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update.');
            }
          }
        }
      ]
    );
  };

  const activeOrders  = orders.filter(o => !['Delivered','Served','Cancelled'].includes(o.orderStatus));
  const doneOrders    = orders.filter(o => ['Delivered','Served','Cancelled'].includes(o.orderStatus));
  const displayOrders = activeTab === 'active' ? activeOrders : doneOrders;

  const renderOrder = ({ item }) => {
    const flow = item.orderType === 'Dine-in' ? dineInFlow : deliveryFlow;
    const isFinished = ['Delivered','Served','Cancelled'].includes(item.orderStatus);
    const canProgress = flow.includes(item.orderStatus) && !isFinished;
    const cfg = STATUS_CONFIG[item.orderStatus] || { color: '#95a5a6', bg: '#f4f6f8', icon: 'ellipse-outline' };
    const isDelivery = item.orderType === 'Delivery';

    return (
      <View style={styles.card}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.customerName}>{item.userId?.name || 'Customer'}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.typeBadge, { backgroundColor: isDelivery ? '#EBF5FB' : '#FFF3E0' }]}>
              <Ionicons name={isDelivery ? 'bicycle-outline' : 'restaurant-outline'} size={12} color={isDelivery ? '#2980b9' : '#e67e22'} />
              <Text style={[styles.typeBadgeText, { color: isDelivery ? '#2980b9' : '#e67e22' }]}> {item.orderType}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={[styles.statusText, { color: cfg.color }]}> {item.orderStatus}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={14} color="#95a5a6" />
          <Text style={styles.infoText}>{item.userId?.phone || 'No phone'}</Text>
        </View>
        {isDelivery && item.deliveryAddress && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#95a5a6" />
            <Text style={styles.infoText} numberOfLines={2}>{item.deliveryAddress}</Text>
          </View>
        )}
        {!isDelivery && (
          <View style={styles.infoRow}>
            <Ionicons name="grid-outline" size={14} color="#95a5a6" />
            <Text style={styles.infoText}>Table {item.tableNumber} · Arrival {item.arrivalTime || 'N/A'}</Text>
          </View>
        )}

        {/* Items */}
        <View style={styles.itemsBox}>
          {item.items?.map((oi, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{oi.quantity}×</Text>
              <Text style={styles.itemName}>{oi.menuItem?.foodName || 'Item'}</Text>
              <Text style={styles.itemPrice}>Rs. {(oi.price * oi.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.payMethod}>{item.paymentMethod}</Text>
          <Text style={styles.totalAmount}>Rs. {Number(item.totalAmount).toFixed(2)}</Text>
        </View>

        {/* Action Button */}
        {canProgress && (
          <TouchableOpacity style={styles.progressBtn} onPress={() => moveToNextStatus(item)} activeOpacity={0.85}>
            <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />
            <Text style={styles.progressBtnText}>
              Move to: {flow[flow.indexOf(item.orderStatus) + 1]}
            </Text>
          </TouchableOpacity>
        )}
        {isFinished && (
          <View style={[styles.finishedBanner, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={15} color={cfg.color} />
            <Text style={[styles.finishedText, { color: cfg.color }]}> {item.orderStatus}</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;

  return (
    <View style={styles.container}>
      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={[styles.summaryChip, { borderLeftColor: '#f39c12' }]}>
          <Text style={styles.summaryNum}>{activeOrders.length}</Text>
          <Text style={styles.summaryLbl}>Active</Text>
        </View>
        <View style={[styles.summaryChip, { borderLeftColor: '#2ecc71' }]}>
          <Text style={styles.summaryNum}>{doneOrders.filter(o=>o.orderStatus!=='Cancelled').length}</Text>
          <Text style={styles.summaryLbl}>Completed</Text>
        </View>
        <View style={[styles.summaryChip, { borderLeftColor: '#e74c3c' }]}>
          <Text style={styles.summaryNum}>{orders.filter(o=>o.orderStatus==='Cancelled').length}</Text>
          <Text style={styles.summaryLbl}>Cancelled</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[['active','Active Orders'],['done','Completed']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.tab, activeTab===key && styles.tabActive]} onPress={() => setActiveTab(key)}>
            <Text style={[styles.tabText, activeTab===key && styles.tabTextActive]}>{label}</Text>
            <View style={[styles.tabBadge, { backgroundColor: activeTab===key ? '#000' : '#eee' }]}>
              <Text style={[styles.tabBadgeText, { color: activeTab===key ? '#fff' : '#545454' }]}>
                {key === 'active' ? activeOrders.length : doneOrders.length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayOrders}
        keyExtractor={item => item._id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#ddd" />
            <Text style={styles.emptyTitle}>{activeTab === 'active' ? 'No active orders' : 'No completed orders'}</Text>
            <Text style={styles.emptySubtitle}>Orders will appear here as customers place them.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  summaryBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  summaryChip: { flex: 1, borderRadius: 10, borderLeftWidth: 4, backgroundColor: '#f8f9fa', padding: 10, alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '800', color: '#000' },
  summaryLbl: { fontSize: 11, color: '#95a5a6', marginTop: 2 },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#000' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#95a5a6' },
  tabTextActive: { color: '#000' },
  tabBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },

  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 10 },
  orderId: { fontSize: 13, fontWeight: '700', color: '#000', fontFamily: 'monospace' },
  customerName: { fontSize: 16, fontWeight: '700', color: '#000', marginTop: 2 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 6 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 6 },
  infoText: { fontSize: 13, color: '#545454', flex: 1 },

  itemsBox: { margin: 16, marginTop: 10, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemQty: { fontSize: 13, fontWeight: '700', color: '#000', width: 28 },
  itemName: { flex: 1, fontSize: 14, color: '#34495e' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#545454' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5', backgroundColor: '#fafafa' },
  payMethod: { fontSize: 12, color: '#95a5a6' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#000' },

  progressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#000', paddingVertical: 14, marginHorizontal: 16, marginBottom: 16, borderRadius: 12 },
  progressBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  finishedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginHorizontal: 16, marginBottom: 16, borderRadius: 12 },
  finishedText: { fontWeight: '700', fontSize: 14 },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#95a5a6', textAlign: 'center', paddingHorizontal: 30 },
});

export default OwnerOrdersScreen;
