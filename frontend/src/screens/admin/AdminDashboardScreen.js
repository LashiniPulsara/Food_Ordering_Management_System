import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Pressable, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const StatCard = ({ title, value, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const AdminDashboardScreen = ({ navigation }) => {
  const { userToken, logout, userInfo } = useContext(AuthContext);
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    orders: 0,
    deliveries: 0,
    reservations: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };
      
      const [usersRes, restRes, ordersRes, devRes, resvRes] = await Promise.all([
        api.get('/auth/users', authConfig).catch(() => ({ data: { count: 0 } })),
        api.get('/restaurants?status=all', authConfig),
        api.get('/orders', authConfig),
        api.get('/deliveries', authConfig),
        api.get('/reservations/my-reservations', authConfig)
      ]);

      setStats({
        users: usersRes.data.count || 0,
        restaurants: restRes.data.count || 0,
        orders: ordersRes.data.count || 0,
        deliveries: devRes.data.count || 0,
        reservations: resvRes.data.count || 0,
      });

      setPendingRestaurants((restRes.data.data || []).filter((r) => r.status === 'pending'));
    } catch (error) {
      console.log('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const updateRestaurantStatus = async (restaurantId, status, approvalNote) => {
    try {
      const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };
      await api.put(`/restaurants/${restaurantId}`, { status, approvalNote }, authConfig);
      await fetchDashboardData();
    } catch (error) {
      console.log('Failed to update restaurant status', error);
    }
  };

  const chartData = {
    labels: ['Users', 'Rest.', 'Orders', 'Deliv.'],
    datasets: [{ data: [stats.users, stats.restaurants, stats.orders, stats.deliveries] }]
  };

  const pieData = [
    { name: 'Pending', population: Math.floor(Math.random() * 10), color: '#f39c12', legendFontColor: '#7F7F7F', legendFontSize: 13 },
    { name: 'Completed', population: Math.floor(Math.random() * 20), color: '#2ecc71', legendFontColor: '#7F7F7F', legendFontSize: 13 },
    { name: 'Failed', population: Math.floor(Math.random() * 3), color: '#000000', legendFontColor: '#7F7F7F', legendFontSize: 13 }
  ];

  if (loading) {
    return <View style={styles.center}><Text>Loading Dashboard...</Text></View>;
  }

  return (
    <View style={styles.screen}>
      {/* Custom Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
           <Text style={styles.logoText}>System<Text style={styles.logoFood}>ADMIN</Text></Text>
        </View>
        <View style={styles.headerRight}>
           <Pressable 
             style={({pressed}) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
             onPress={() => navigation.navigate('Profile')}
           >
             <Ionicons name="person-outline" size={24} color="#000000" />
           </Pressable>
        </View>
      </View>

      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.welcomeText}>Welcome, {userInfo?.name}</Text>

        <View style={styles.grid}>
          <StatCard title="Total Users" value={stats.users} color="#3498db" />
          <StatCard title="Restaurants" value={stats.restaurants} color="#e67e22" />
          <StatCard title="Total Orders" value={stats.orders} color="#2ecc71" />
          <StatCard title="Deliveries" value={stats.deliveries} color="#9b59b6" />
          <StatCard title="Reservations" value={stats.reservations} color="#1abc9c" />
        </View>

        {/* ─── Quick Actions ─── */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.chartTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.quickActionBtn,
                { backgroundColor: pressed ? '#2980b9' : '#3498db' },
              ]}
              onPress={() => navigation.navigate('AdminCategories')}
            >
              <Text style={styles.quickActionIcon}>📁</Text>
              <Text style={styles.quickActionLabel}>Manage{'\n'}Categories</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickActionBtn,
                { backgroundColor: pressed ? '#d35400' : '#e67e22' },
              ]}
              onPress={() => navigation.navigate('AdminRestaurants')}
            >
              <Text style={styles.quickActionIcon}>🏪</Text>
              <Text style={styles.quickActionLabel}>Manage{'\n'}Restaurants</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickActionBtn,
                { backgroundColor: pressed ? '#27ae60' : '#2ecc71' },
              ]}
              onPress={() => navigation.navigate('AdminOrders')}
            >
              <Text style={styles.quickActionIcon}><Ionicons name="cube-outline" size={24} color="#000000" /></Text>
              <Text style={styles.quickActionLabel}>View{'\n'}Orders</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickActionBtn,
                { backgroundColor: pressed ? '#8e44ad' : '#9b59b6' },
              ]}
              onPress={() => navigation.navigate('AdminUsers')}
            >
              <Text style={styles.quickActionIcon}>👥</Text>
              <Text style={styles.quickActionLabel}>Manage{'\n'}Users</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Entity Growth</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sample Order Statuses</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Pending Restaurant Approvals</Text>
          {pendingRestaurants.length === 0 ? (
            <Text style={styles.pendingText}>No pending restaurant requests.</Text>
          ) : (
            pendingRestaurants.map((restaurant) => (
              <View key={restaurant._id} style={styles.pendingCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTitle}>{restaurant.restaurantName}</Text>
                  <Text style={styles.pendingText}>{restaurant.email} | {restaurant.phone}</Text>
                  <Text style={styles.pendingText}>{restaurant.address}</Text>
                </View>
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#2ecc71', marginRight: 8 }]}
                    onPress={() => updateRestaurantStatus(restaurant._id, 'approved', 'Approved by admin')}
                  >
                    <Text style={styles.actionText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#000000' }]}
                    onPress={() => updateRestaurantStatus(restaurant._id, 'rejected', 'Rejected by admin')}
                  >
                    <Text style={styles.actionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  logoFood: {
    color: '#3498db',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    marginLeft: 10,
    backgroundColor: '#f1f2f6',
    borderRadius: 12,
  },
  iconBtnPressed: {
    opacity: 0.7,
  },
  headerIcon: {
    fontSize: 18,
  },
  container: { flex: 1, padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeText: { fontSize: 22, fontWeight: '600', color: '#000000', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3
  },
  cardTitle: { fontSize: 14, color: '#545454', marginBottom: 5 },
  cardValue: { fontSize: 22, fontWeight: '600', color: '#000000' },
  chartContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20 },
  chartTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#34495e' },
  pendingCard: {
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10
  },
  pendingTitle: { fontWeight: '600', color: '#000000', marginBottom: 4 },
  pendingText: { color: '#545454', fontSize: 12, marginBottom: 2 },
  pendingActions: { flexDirection: 'row', marginTop: 8 },
  actionBtn: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  quickActionsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionBtn: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;
