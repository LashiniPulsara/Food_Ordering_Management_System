import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { COLORS } from '../../theme/colors';

const ProfileScreen = ({ navigation }) => {
  const { userInfo, logout, userToken } = useContext(AuthContext);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(false);

  const isOwner = userInfo?.role === 'restaurantOwner';

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchRestaurant = async () => {
        if (!isOwner) return;
        setLoading(true);
        try {
          const res = await api.get('/restaurants/my/restaurant', {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          if (isActive) {
            setRestaurant(res.data.data);
          }
        } catch (error) {
          console.log('Failed to fetch restaurant profile:', error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchRestaurant();

      return () => {
        isActive = false;
      };
    }, [isOwner, userToken])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{userInfo?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{userInfo?.name}</Text>
        <Text style={styles.role}>{userInfo?.role.toUpperCase()}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{userInfo?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{userInfo?.phone || 'Not provided'}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>My Activity</Text>
        <TouchableOpacity 
           style={styles.actionRow}
           onPress={() => navigation.navigate('Orders')}
        >
           <Text style={styles.infoLabel}>My Orders</Text>
           <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity 
           style={styles.actionRow}
           onPress={() => navigation.navigate('PaymentHistory')}
        >
           <Text style={styles.infoLabel}>Payment History</Text>
           <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity 
           style={styles.actionRow}
           onPress={() => navigation.navigate('MyReservations')}
        >
           <Text style={styles.infoLabel}>My Reservations</Text>
           <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity 
           style={styles.actionRow}
           onPress={() => navigation.navigate('ChangePassword')}
        >
           <Text style={styles.infoLabel}>Change Password</Text>
           <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>
      
      {isOwner && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Restaurant Details</Text>
          {loading ? (
             <ActivityIndicator size="small" color={COLORS.primary} />
          ) : restaurant ? (
             <>
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Status</Text>
                 <Text style={[styles.infoValue, { color: restaurant.isOpen ? '#000000' : '#000000' }]}>
                    {restaurant.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                 </Text>
               </View>
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Restaurant</Text>
                 <Text style={styles.infoValue}>{restaurant.restaurantName}</Text>
               </View>
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Address</Text>
                 <Text style={styles.infoValue}>{restaurant.address}</Text>
               </View>
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Primary Phone</Text>
                 <Text style={styles.infoValue}>{restaurant.phone}</Text>
               </View>
               {restaurant.secondaryPhone ? (
                 <View style={styles.infoRow}>
                   <Text style={styles.infoLabel}>Secondary Phone</Text>
                   <Text style={styles.infoValue}>{restaurant.secondaryPhone}</Text>
                 </View>
               ) : null}
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Hours</Text>
                 <Text style={styles.infoValue}>{restaurant.openingHours}</Text>
               </View>
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Total Tables</Text>
                 <Text style={styles.infoValue}>{restaurant.numberOfTables || 0}</Text>
               </View>
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Chairs / Table</Text>
                 <Text style={styles.infoValue}>{restaurant.chairsPerTable || 0}</Text>
               </View>

               <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => navigation.navigate('EditRestaurant', { restaurant })}
               >
                 <Text style={styles.editButtonText}>Edit Restaurant Info</Text>
               </TouchableOpacity>
             </>
          ) : (
             <Text style={styles.noRestText}>No restaurant profile found. Complete onboarding in your dashboard.</Text>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.textWhite },
  name: { fontSize: 24, fontWeight: '700', color: COLORS.textWhite },
  role: { fontSize: 14, color: COLORS.textWhite, opacity: 0.8, marginTop: 5, fontWeight: '500' },
  infoSection: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 12, marginLeft: 5 },
  infoRow: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', shadowColor: COLORS.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  infoLabel: { fontSize: 15, color: COLORS.textMedium, fontWeight: '500' },
  infoValue: { fontSize: 15, color: COLORS.textDark, fontWeight: '600', maxWidth: '70%', textAlign: 'right' },
  actionRow: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: COLORS.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  arrowText: { fontSize: 20, color: COLORS.primary, fontWeight: '400' },
  editButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  editButtonText: { color: COLORS.textWhite, fontSize: 16, fontWeight: '700' },
  noRestText: { color: COLORS.textMedium, fontStyle: 'italic', marginVertical: 10, textAlign: 'center' },
  logoutButton: { marginHorizontal: 20, marginTop: 30, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.error, padding: 16, borderRadius: 14, alignItems: 'center' },
  logoutText: { color: COLORS.error, fontSize: 18, fontWeight: '700' }
});

export default ProfileScreen;
