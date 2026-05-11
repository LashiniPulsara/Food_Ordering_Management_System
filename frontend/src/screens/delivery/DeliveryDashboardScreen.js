import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Platform, Pressable, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

const STATUS_FLOW = ['Assigned', 'In Transit', 'Completed'];

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return '#f39c12';
    case 'Assigned': return '#3498db';
    case 'In Transit': return '#e67e22';
    case 'Completed': return '#2ecc71';
    case 'Cancelled': return '#e74c3c';
    default: return '#95a5a6';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Pending': return 'time-outline';
    case 'Assigned': return 'checkmark-circle-outline';
    case 'In Transit': return 'bicycle-outline';
    case 'Completed': return 'checkmark-done-outline';
    case 'Cancelled': return 'close-circle-outline';
    default: return 'help-outline';
  }
};

const DeliveryDashboardScreen = ({ navigation }) => {
  const { userInfo, userToken, logout } = useContext(AuthContext);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'available'

  const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

  const fetchDeliveries = async () => {
    try {
      const [myRes, allRes] = await Promise.all([
        api.get('/deliveries/my-deliveries', authConfig),
        api.get('/deliveries', authConfig)
      ]);

      setMyDeliveries(myRes.data.data || []);
      // Available = all deliveries that are Pending (not yet assigned)
      setAvailableDeliveries(
        (allRes.data.data || []).filter(d => d.deliveryStatus === 'Pending')
      );
    } catch (error) {
      console.log('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
    }, [])
  );

  const updateDeliveryStatus = async (deliveryId, newStatus) => {
    try {
      await api.put(`/deliveries/${deliveryId}/status`, { deliveryStatus: newStatus }, authConfig);
      Alert.alert('Success', `Delivery marked as "${newStatus}"`);
      fetchDeliveries();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const getNextStatus = (currentStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[idx + 1];
    }
    return null;
  };

  const activeCount = myDeliveries.filter(d => d.deliveryStatus !== 'Completed' && d.deliveryStatus !== 'Cancelled').length;
  const completedCount = myDeliveries.filter(d => d.deliveryStatus === 'Completed').length;

  const renderDeliveryCard = ({ item }) => {
    const statusColor = getStatusColor(item.deliveryStatus);
    const statusIcon = getStatusIcon(item.deliveryStatus);
    const nextStatus = getNextStatus(item.deliveryStatus);

    return (
      <View style={styles.deliveryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name={statusIcon} size={22} color={statusColor} />
            <Text style={[styles.statusBadge, { backgroundColor: statusColor + '20', color: statusColor }]}>
              {item.deliveryStatus}
            </Text>
          </View>
          <Text style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#545454" />
            <Text style={styles.infoText} numberOfLines={2}>{item.deliveryAddress}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="receipt-outline" size={16} color="#545454" />
            <Text style={styles.infoText}>
              Order: #{item.orderId?._id?.toString().slice(-8).toUpperCase() || item.orderId?.toString().slice(-8).toUpperCase() || 'N/A'}
            </Text>
          </View>

          {item.orderId?.orderStatus && (
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={16} color="#545454" />
              <Text style={styles.infoText}>Order Status: {item.orderId.orderStatus}</Text>
            </View>
          )}
        </View>

        {nextStatus && item.deliveryStatus !== 'Cancelled' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: getStatusColor(nextStatus) }]}
            onPress={() =>
              Alert.alert(
                'Update Status',
                `Mark this delivery as "${nextStatus}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Confirm', onPress: () => updateDeliveryStatus(item._id, nextStatus) }
                ]
              )
            }
          >
            <Ionicons name="arrow-forward-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Mark as {nextStatus}</Text>
          </TouchableOpacity>
        )}

        {item.deliveryStatus === 'Completed' && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-done" size={18} color="#2ecc71" />
            <Text style={styles.completedText}>Delivered successfully</Text>
          </View>
        )}
      </View>
    );
  };

  const claimDelivery = async (deliveryId) => {
    Alert.alert(
      'Accept Delivery',
      'Do you want to accept this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await api.put(`/deliveries/${deliveryId}/claim`, {}, authConfig);
              Alert.alert('Success', 'Delivery accepted! Check your My Deliveries tab.');
              fetchDeliveries();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to claim delivery');
            }
          }
        }
      ]
    );
  };

  const renderAvailableCard = ({ item }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="time-outline" size={22} color="#f39c12" />
          <Text style={[styles.statusBadge, { backgroundColor: '#f39c1220', color: '#f39c12' }]}>
            Awaiting Pickup
          </Text>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#545454" />
          <Text style={styles.infoText} numberOfLines={2}>{item.deliveryAddress}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="receipt-outline" size={16} color="#545454" />
          <Text style={styles.infoText}>
            Order: #{item.orderId?._id?.toString().slice(-8).toUpperCase() || 'N/A'}
          </Text>
        </View>
        {item.orderId?.totalAmount && (
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={16} color="#545454" />
            <Text style={styles.infoText}>
              Order Value: Rs. {Number(item.orderId.totalAmount).toFixed(2)}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: '#27ae60' }]}
        onPress={() => claimDelivery(item._id)}
      >
        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.actionBtnText}>Accept Delivery</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  const displayData = activeTab === 'assigned' ? myDeliveries : availableDeliveries;

  return (
    <View style={styles.screen}>
      {/* Dark Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>Welcome back,</Text>
            <Text style={styles.heroName}>{userInfo?.name?.split(' ')[0]} 🛵</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={20} color="#000" />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{activeCount}</Text>
            <Text style={styles.heroStatLbl}>Active</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{completedCount}</Text>
            <Text style={styles.heroStatLbl}>Completed</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatNum, { color: '#f39c12' }]}>{availableDeliveries.length}</Text>
            <Text style={styles.heroStatLbl}>Available</Text>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assigned' && styles.activeTab]}
          onPress={() => setActiveTab('assigned')}
        >
          <Ionicons name="bicycle-outline" size={16} color={activeTab === 'assigned' ? '#000' : '#95a5a6'} />
          <Text style={[styles.tabText, activeTab === 'assigned' && styles.activeTabText]}>
            {' '}My Deliveries
          </Text>
          {myDeliveries.length > 0 && (
            <View style={[styles.tabPill, { backgroundColor: activeTab === 'assigned' ? '#000' : '#eee' }]}>
              <Text style={[styles.tabPillText, { color: activeTab === 'assigned' ? '#fff' : '#545454' }]}>{myDeliveries.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Ionicons name="flash-outline" size={16} color={activeTab === 'available' ? '#000' : '#95a5a6'} />
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            {' '}Available
          </Text>
          {availableDeliveries.length > 0 && (
            <View style={[styles.tabPill, { backgroundColor: activeTab === 'available' ? '#000' : '#f39c12' }]}>
              <Text style={[styles.tabPillText, { color: '#fff' }]}>{availableDeliveries.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item._id}
        renderItem={activeTab === 'assigned' ? renderDeliveryCard : renderAvailableCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDeliveries(); }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>{activeTab === 'assigned' ? '📦' : '⚡'}</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'assigned' ? 'No deliveries yet' : 'No available deliveries'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'assigned'
                ? 'Accept a delivery from the Available tab to get started.'
                : 'New deliveries will appear here when restaurants mark orders ready.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Hero Header
  heroHeader: {
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heroGreeting: { fontSize: 14, color: '#ffffff88', fontWeight: '500' },
  heroName: { fontSize: 26, fontWeight: '800', color: '#ffffff', marginTop: 2 },
  profileBtn: { backgroundColor: '#ffffff', width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },

  heroStats: { flexDirection: 'row', backgroundColor: '#ffffff15', borderRadius: 16, padding: 16 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
  heroStatLbl: { fontSize: 11, color: '#ffffff88', marginTop: 3 },
  heroStatDivider: { width: 1, backgroundColor: '#ffffff20', marginHorizontal: 8 },

  // Tab Bar
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#000000' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#95a5a6' },
  activeTabText: { color: '#000000' },
  tabPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  tabPillText: { fontSize: 11, fontWeight: '700' },

  listContent: { padding: 16, paddingBottom: 40 },

  // Cards
  deliveryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8, overflow: 'hidden' },
  cardDate: { fontSize: 12, color: '#95a5a6' },
  cardBody: {},
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#2c3e50', marginLeft: 8, flex: 1 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 13, borderRadius: 12, marginTop: 10, gap: 6 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  completedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: '#2ecc7115', borderRadius: 10, marginTop: 10 },
  completedText: { color: '#2ecc71', fontWeight: '600', marginLeft: 6, fontSize: 13 },

  // Empty State
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#95a5a6', textAlign: 'center', paddingHorizontal: 30 },
});

export default DeliveryDashboardScreen;
