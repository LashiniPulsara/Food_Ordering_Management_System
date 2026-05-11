import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Platform, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

const ROLE_COLORS = {
  customer: { bg: '#e0f7fa', text: '#00838f' },
  restaurantOwner: { bg: '#fff3e0', text: '#ef6c00' },
  deliveryRider: { bg: '#e8eaf6', text: '#283593' },
  admin: { bg: '#fce4ec', text: '#c2185b' },
};

const AdminUsersScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users', authConfig);
      setUsers(res.data.data || []);
    } catch (error) {
      console.log('Error fetching users:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const deleteUser = async (userId, userName) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/auth/users/${userId}`, authConfig);
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers(); // Refresh the list
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const renderUserCard = ({ item }) => {
    const roleStyle = ROLE_COLORS[item.role] || { bg: '#f1f2f6', text: '#545454' };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
              <Text style={[styles.roleText, { color: roleStyle.text }]}>
                {item.role.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={() => deleteUser(item._id, item.name)}
            >
              <Ionicons name="trash-outline" size={18} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color="#545454" />
            <Text style={styles.infoText}>{item.email}</Text>
          </View>

          {item.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#545454" />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#545454" />
            <Text style={styles.infoText}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
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
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users ({users.length})</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUserCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>No users found</Text>
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

  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: { fontSize: 16, fontWeight: '700', color: '#000', flex: 1 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { fontSize: 10, fontWeight: '700' },
  deleteBtn: {
    marginLeft: 10,
    padding: 6,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 14, color: '#545454', marginLeft: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#95a5a6', fontSize: 16, marginTop: 12 },
});

export default AdminUsersScreen;
