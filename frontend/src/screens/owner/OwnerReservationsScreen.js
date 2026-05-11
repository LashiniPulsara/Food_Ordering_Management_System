import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const getStatusColor = (status) => {
  switch (status) {
    case 'Confirmed': return '#2ecc71';
    case 'Pending': return '#f39c12';
    case 'Cancelled': return '#e74c3c';
    case 'Completed': return '#3498db';
    default: return '#95a5a6';
  }
};

const OwnerReservationsScreen = () => {
  const { userToken } = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);

  const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const restRes = await api.get('/restaurants/my/restaurant', authConfig);
      const rid = restRes.data.data._id;
      setRestaurantId(rid);

      const res = await api.get(`/reservations/restaurant/${rid}`, authConfig);
      setReservations(res.data.data || []);
    } catch (error) {
      console.log('Error loading reservations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatus = (id, newStatus) => {
    Alert.alert(
      `Mark as ${newStatus}`,
      `Set this reservation status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.put(`/reservations/${id}/status`, { reservationStatus: newStatus }, authConfig);
              loadData();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Could not update status.');
            }
          }
        }
      ]
    );
  };

  const renderReservation = ({ item }) => {
    const statusColor = getStatusColor(item.reservationStatus);
    const isPending = item.reservationStatus === 'Pending';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.customerName}>{item.customerName || item.userId?.name}</Text>
            <Text style={styles.customerPhone}>{item.customerPhone || item.userId?.phone}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.reservationStatus?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={15} color="#545454" />
            <Text style={styles.detailText}>{item.reservationDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={15} color="#545454" />
            <Text style={styles.detailText}>{item.reservationTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={15} color="#545454" />
            <Text style={styles.detailText}>{item.guestCount} guests</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="grid-outline" size={15} color="#545454" />
            <Text style={styles.detailText}>Table: {item.tableNumber}</Text>
          </View>
        </View>

        {item.advancePayment > 0 && (
          <View style={styles.advanceRow}>
            <Ionicons name="cash-outline" size={15} color="#27ae60" />
            <Text style={styles.advanceText}>Advance: Rs. {item.advancePayment}</Text>
          </View>
        )}

        {/* Action buttons — only show for active reservations */}
        {item.reservationStatus !== 'Cancelled' && item.reservationStatus !== 'Completed' && (
          <View style={styles.actionsRow}>
            {isPending && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#2ecc71' }]}
                onPress={() => updateStatus(item._id, 'Confirmed')}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Confirm</Text>
              </TouchableOpacity>
            )}
            {!isPending && item.reservationStatus === 'Confirmed' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#3498db' }]}
                onPress={() => updateStatus(item._id, 'Completed')}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Mark Completed</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#e74c3c' }]}
              onPress={() => updateStatus(item._id, 'Cancelled')}
              activeOpacity={0.8}
            >
              <Ionicons name="close-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
  }

  const pending = reservations.filter(r => r.reservationStatus === 'Pending');
  const others = reservations.filter(r => r.reservationStatus !== 'Pending');
  const sortedData = [...pending, ...others];

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderLeftColor: '#f39c12' }]}>
          <Text style={styles.statNum}>{pending.length}</Text>
          <Text style={styles.statLbl}>Pending</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#2ecc71' }]}>
          <Text style={styles.statNum}>{reservations.filter(r => r.reservationStatus === 'Confirmed').length}</Text>
          <Text style={styles.statLbl}>Confirmed</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#3498db' }]}>
          <Text style={styles.statNum}>{reservations.filter(r => r.reservationStatus === 'Completed').length}</Text>
          <Text style={styles.statLbl}>Completed</Text>
        </View>
      </View>

      <FlatList
        data={sortedData}
        keyExtractor={(item) => item._id}
        renderItem={renderReservation}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>No reservations yet</Text>
            <Text style={styles.emptySubText}>Customer reservations for your restaurant will appear here.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, color: '#95a5a6', marginTop: 16, fontWeight: '600' },
  emptySubText: { fontSize: 13, color: '#bdc3c7', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },

  statsRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  statNum: { fontSize: 22, fontWeight: '800', color: '#000' },
  statLbl: { fontSize: 11, color: '#95a5a6', marginTop: 2 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 14, elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  customerName: { fontSize: 16, fontWeight: '700', color: '#000' },
  customerPhone: { fontSize: 13, color: '#95a5a6', marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f8f9fa', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  detailText: { fontSize: 13, color: '#34495e', fontWeight: '500' },

  advanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  advanceText: { fontSize: 13, color: '#27ae60', fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

export default OwnerReservationsScreen;
