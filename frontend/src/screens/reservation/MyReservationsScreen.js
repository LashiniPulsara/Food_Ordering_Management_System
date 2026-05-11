import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert
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

const MyReservationsScreen = () => {
  const { userToken } = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations/my-reservations', authConfig);
      setReservations(res.data.data || []);
    } catch (error) {
      console.log('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = (id) => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation?',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Reservation',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/reservations/${id}/cancel`, {}, authConfig);
              Alert.alert('Cancelled', 'Your reservation has been cancelled.');
              fetchReservations();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Could not cancel reservation.');
            }
          }
        }
      ]
    );
  };

  const renderReservation = ({ item }) => {
    const statusColor = getStatusColor(item.reservationStatus);
    const canCancel = item.reservationStatus === 'Pending' || item.reservationStatus === 'Confirmed';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.restaurantName}>
              {item.restaurantId?.restaurantName || 'Restaurant'}
            </Text>
            <Text style={styles.restaurantAddress}>{item.restaurantId?.address}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.reservationStatus?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#545454" />
            <Text style={styles.detailText}>{item.reservationDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#545454" />
            <Text style={styles.detailText}>{item.reservationTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color="#545454" />
            <Text style={styles.detailText}>{item.guestCount} guests</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="grid-outline" size={16} color="#545454" />
            <Text style={styles.detailText}>Table: {item.tableNumber}</Text>
          </View>
        </View>

        {item.advancePayment > 0 && (
          <View style={styles.advanceRow}>
            <Ionicons name="cash-outline" size={15} color="#27ae60" />
            <Text style={styles.advanceText}>Advance Paid: Rs. {item.advancePayment}</Text>
          </View>
        )}

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => cancelReservation(item._id)}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={16} color="#e74c3c" />
            <Text style={styles.cancelBtnText}>Cancel Reservation</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item._id}
        renderItem={renderReservation}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        onRefresh={fetchReservations}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>No reservations yet</Text>
            <Text style={styles.emptySubText}>Your table bookings will appear here.</Text>
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

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 14, elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#000', maxWidth: 200 },
  restaurantAddress: { fontSize: 12, color: '#95a5a6', marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f8f9fa', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  detailText: { fontSize: 13, color: '#34495e', fontWeight: '500' },

  advanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  advanceText: { fontSize: 13, color: '#27ae60', fontWeight: '600' },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#e74c3c', borderRadius: 10,
    paddingVertical: 10, marginTop: 4
  },
  cancelBtnText: { color: '#e74c3c', fontWeight: '600', fontSize: 14 },
});

export default MyReservationsScreen;
