import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

const getStatusConfig = (status) => {
  switch (status) {
    case 'Pending': return { color: '#f39c12', bg: '#FFF9E6', icon: 'time-outline' };
    case 'Preparing': return { color: '#3498db', bg: '#EBF5FB', icon: 'flame-outline' };
    case 'Out for Delivery': return { color: '#9b59b6', bg: '#F5EEF8', icon: 'bicycle-outline' };
    case 'Delivered': return { color: '#2ecc71', bg: '#EAFAF1', icon: 'checkmark-circle-outline' };
    case 'Cancelled': return { color: '#e74c3c', bg: '#FDEDEC', icon: 'close-circle-outline' };
    case 'Order Ready': return { color: '#27ae60', bg: '#EAFAF1', icon: 'restaurant-outline' };
    case 'Served': return { color: '#16a085', bg: '#E8F8F5', icon: 'checkmark-done-outline' };
    default: return { color: '#95a5a6', bg: '#f4f6f8', icon: 'ellipse-outline' };
  }
};

const OrderHistoryScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userToken } = useContext(AuthContext);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/myorders', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setOrders(res.data.data || []);
    } catch (error) {
      console.log('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }) => {
    const { color, bg, icon } = getStatusConfig(item.orderStatus);
    const isDelivery = item.orderType === 'Delivery';

    return (
      <View style={styles.card}>
        {/* Top Row */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>#{item._id.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.restaurantName}>{item.restaurantId?.restaurantName || 'Restaurant'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={13} color={color} />
            <Text style={[styles.statusText, { color }]}> {item.orderStatus}</Text>
          </View>
        </View>

        {/* Order Type Tag */}
        <View style={styles.typeRow}>
          <View style={[styles.typeTag, { backgroundColor: isDelivery ? '#E8F4FD' : '#FFF3E0' }]}>
            <Ionicons
              name={isDelivery ? 'bicycle-outline' : 'restaurant-outline'}
              size={13}
              color={isDelivery ? '#2980b9' : '#e67e22'}
            />
            <Text style={[styles.typeTagText, { color: isDelivery ? '#2980b9' : '#e67e22' }]}>
              {' '}{item.orderType}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </Text>
        </View>

        {/* Items */}
        <View style={styles.itemsContainer}>
          {item.items.slice(0, 3).map((cartItem, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{cartItem.quantity}×</Text>
              <Text style={styles.itemName}>{cartItem.menuItem?.foodName || 'Item'}</Text>
              <Text style={styles.itemPrice}>Rs. {(cartItem.price * cartItem.quantity).toFixed(2)}</Text>
            </View>
          ))}
          {item.items.length > 3 && (
            <Text style={styles.moreItems}>+{item.items.length - 3} more items</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.payLabel}>{item.paymentMethod}</Text>
          </View>
          <Text style={styles.totalAmount}>Rs. {item.totalAmount?.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        onRefresh={fetchOrders}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-handle-outline" size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Your past and current orders will appear here.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 14,
    overflow: 'hidden', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 16, paddingBottom: 10,
  },
  orderId: { fontSize: 13, fontWeight: '700', color: '#000', fontFamily: 'monospace' },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#000', marginTop: 3 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  typeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  typeTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeTagText: { fontSize: 12, fontWeight: '600' },
  dateText: { fontSize: 12, color: '#95a5a6' },

  itemsContainer: {
    borderTopWidth: 1, borderTopColor: '#f5f5f5',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemQty: { fontSize: 13, fontWeight: '700', color: '#000', width: 28 },
  itemName: { flex: 1, fontSize: 14, color: '#34495e' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#545454' },
  moreItems: { fontSize: 12, color: '#95a5a6', marginTop: 4, fontStyle: 'italic' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f9f9f9', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  payLabel: { fontSize: 12, color: '#95a5a6', fontWeight: '500' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: COLORS.primary },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#95a5a6', textAlign: 'center', paddingHorizontal: 30 },
});

export default OrderHistoryScreen;
