import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Platform, Alert, TextInput, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api, { buildAssetUrl } from '../../api/axios';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'suspended'];

const getStatusStyle = (status) => {
  switch (status) {
    case 'pending': return { bg: '#f39c1220', color: '#f39c12', icon: 'time-outline' };
    case 'approved': return { bg: '#2ecc7120', color: '#2ecc71', icon: 'checkmark-circle-outline' };
    case 'rejected': return { bg: '#e74c3c20', color: '#e74c3c', icon: 'close-circle-outline' };
    case 'suspended': return { bg: '#8e44ad20', color: '#8e44ad', icon: 'ban-outline' };
    default: return { bg: '#95a5a620', color: '#95a5a6', icon: 'help-outline' };
  }
};

const AdminRestaurantScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [noteInput, setNoteInput] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/restaurants?status=all', authConfig);
      setRestaurants(res.data.data || []);
    } catch (error) {
      console.log('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRestaurants();
    }, [])
  );

  const updateStatus = async (restaurantId, newStatus) => {
    setUpdatingId(restaurantId);
    try {
      const note = noteInput[restaurantId] || `${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} by admin`;
      await api.put(`/restaurants/${restaurantId}`, {
        status: newStatus,
        approvalNote: note
      }, authConfig);
      Alert.alert('Success', `Restaurant ${newStatus} successfully`);
      setNoteInput(prev => ({ ...prev, [restaurantId]: '' }));
      fetchRestaurants();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmAction = (restaurantId, newStatus, restaurantName) => {
    Alert.alert(
      `${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} Restaurant`,
      `Are you sure you want to ${newStatus} "${restaurantName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => updateStatus(restaurantId, newStatus) }
      ]
    );
  };

  const filteredRestaurants = activeFilter === 'all'
    ? restaurants
    : restaurants.filter(r => r.status === activeFilter);

  const pendingCount = restaurants.filter(r => r.status === 'pending').length;

  const renderRestaurantCard = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    const isUpdating = updatingId === item._id;

    return (
      <View style={styles.card}>
        {/* Restaurant Image */}
        <Image
          source={{ uri: buildAssetUrl(item.image) }}
          style={styles.cardImage}
        />

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>

        {/* Restaurant Info */}
        <View style={styles.cardContent}>
          <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color="#545454" />
            <Text style={styles.infoText}>{item.ownerName?.name || 'Unknown Owner'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={14} color="#545454" />
            <Text style={styles.infoText}>{item.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color="#545454" />
            <Text style={styles.infoText}>{item.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#545454" />
            <Text style={styles.infoText} numberOfLines={2}>{item.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="restaurant-outline" size={14} color="#545454" />
            <Text style={styles.infoText}>{item.cuisineType}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color="#545454" />
            <Text style={styles.infoText}>{item.openingHours}</Text>
          </View>

          {item.approvalNote ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Admin Note:</Text>
              <Text style={styles.noteText}>{item.approvalNote}</Text>
            </View>
          ) : null}

          {/* Admin Note Input */}
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)..."
            placeholderTextColor="#aaa"
            value={noteInput[item._id] || ''}
            onChangeText={(text) => setNoteInput(prev => ({ ...prev, [item._id]: text }))}
          />

          {/* Action Buttons */}
          {isUpdating ? (
            <ActivityIndicator size="small" color="#000" style={{ marginTop: 10 }} />
          ) : (
            <View style={styles.actionsRow}>
              {item.status !== 'approved' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
                  onPress={() => confirmAction(item._id, 'approved', item.restaurantName)}
                >
                  <Ionicons name="checkmark-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
              )}
              {item.status !== 'rejected' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
                  onPress={() => confirmAction(item._id, 'rejected', item.restaurantName)}
                >
                  <Ionicons name="close-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              )}
              {item.status === 'approved' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#8e44ad' }]}
                  onPress={() => confirmAction(item._id, 'suspended', item.restaurantName)}
                >
                  <Ionicons name="ban-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Suspend</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Restaurant Approvals</Text>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((filter) => {
          const count = filter === 'all' ? restaurants.length : restaurants.filter(r => r.status === filter).length;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Restaurant List */}
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item._id}
        renderItem={renderRestaurantCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRestaurants(); }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>No restaurants in this category</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000', flex: 1 },
  pendingBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  pendingBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f2f6',
    marginRight: 6,
  },
  filterChipActive: { backgroundColor: '#000000' },
  filterChipText: { fontSize: 12, fontWeight: '500', color: '#545454' },
  filterChipTextActive: { color: '#fff' },

  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  cardContent: { padding: 16 },
  restaurantName: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#2c3e50', marginLeft: 8, flex: 1 },
  noteBox: {
    backgroundColor: '#ffeaa720',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  noteLabel: { fontSize: 11, fontWeight: '600', color: '#f39c12', marginBottom: 2 },
  noteText: { fontSize: 13, color: '#2c3e50' },
  noteInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginTop: 10,
    color: '#000',
    backgroundColor: '#fafafa',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 13, marginLeft: 4 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#95a5a6', fontSize: 16, marginTop: 12 },
});

export default AdminRestaurantScreen;
