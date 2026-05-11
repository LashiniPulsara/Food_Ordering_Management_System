import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Platform, Pressable, Image, Modal, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';

const OwnerDashboardScreen = ({ navigation }) => {
  const { userInfo, userToken } = useContext(AuthContext);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ menuCount: 0, orderCount: 0 });
  const [form, setForm] = useState({
    restaurantName: '',
    email: userInfo?.email || '',
    phone: userInfo?.phone || '',
    address: '',
    cuisineType: '',
    openingHours: '',
    numberOfTables: '',
    chairsPerTable: ''
  });

  const [image, setImage] = useState(null);

  const authConfig = {
    headers: { Authorization: `Bearer ${userToken}` }
  };

  const loadOwnerData = async () => {
    try {
      const restaurantRes = await api.get('/restaurants/my/restaurant', authConfig);
      const restaurantData = restaurantRes.data.data;
      setRestaurant(restaurantData);

      const [menuRes, orderRes] = await Promise.all([
        api.get(`/menu/restaurant/${restaurantData._id}`).catch(() => ({ data: { data: [] } })),
        api.get('/orders/owner/my-restaurant', authConfig).catch(() => ({ data: { data: [] } }))
      ]);

      setStats({
        menuCount: menuRes.data.data?.length || 0,
        orderCount: orderRes.data.data?.length || 0
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setRestaurant(null);
      } else {
        console.log('Owner dashboard load error:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  // Time slots for picker
  const generateSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = h % 12 === 0 ? 12 : h % 12;
        const ap = h < 12 ? 'AM' : 'PM';
        slots.push(`${hh}:${String(m).padStart(2, '0')} ${ap}`);
      }
    }
    return slots;
  };
  const timeSlots = generateSlots();
  const [showOpenTime, setShowOpenTime] = useState(false);
  const [showCloseTime, setShowCloseTime] = useState(false);
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const createRestaurantProfile = async () => {
    const finalHours = (openTime && closeTime) ? `${openTime} - ${closeTime}` : form.openingHours;

    if (!form.restaurantName || !form.email || !form.phone || !form.address || !form.cuisineType || !finalHours) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('restaurantName', form.restaurantName);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('address', form.address);
      formData.append('cuisineType', form.cuisineType);
      formData.append('openingHours', finalHours);
      formData.append('numberOfTables', Number(form.numberOfTables) || 0);
      formData.append('chairsPerTable', Number(form.chairsPerTable) || 0);

      if (image) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        
        if (Platform.OS === 'web') {
             const response = await fetch(image);
             const blob = await response.blob();
             formData.append('image', blob, filename || 'upload.jpg');
        } else {
             formData.append('image', { uri: image, name: filename, type });
        }
      }

      await api.post('/restaurants', formData, {
        headers: {
          ...authConfig.headers,
          'Content-Type': 'multipart/form-data',
        }
      });
      alert('Restaurant profile submitted for admin approval.');
      setLoading(true);
      await loadOwnerData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create restaurant profile.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // --- Reusable Time Picker Modal --- //
  const TimePickerModal = ({ visible, onClose, onSelect, slots, title, selected }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
          </View>
          <FlatList
            data={slots}
            keyExtractor={item => item}
            numColumns={3}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const active = item === selected;
              return (
                <TouchableOpacity
                  style={[styles.slot, active && styles.slotActive]}
                  onPress={() => { onSelect(item); onClose(); }}
                >
                  <Text style={[styles.slotText, active && styles.slotTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  if (!restaurant) {
    return (
      <View style={styles.screen}>
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
             <Text style={styles.logoText}>Owner<Text style={styles.logoFood}>PORTAL</Text></Text>
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

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Owner Onboarding</Text>
          <Text style={styles.subtitle}>Complete your restaurant profile first.</Text>

          <TextInput style={styles.input} placeholder="Restaurant Name" value={form.restaurantName} onChangeText={(v) => setForm((p) => ({ ...p, restaurantName: v }))} />
          <TextInput style={styles.input} placeholder="Business Email" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Business Phone" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} />
          <TextInput style={styles.input} placeholder="Address" value={form.address} onChangeText={(v) => setForm((p) => ({ ...p, address: v }))} />
          <TextInput style={styles.input} placeholder="Cuisine Type (e.g. Sri Lankan)" value={form.cuisineType} onChangeText={(v) => setForm((p) => ({ ...p, cuisineType: v }))} />
          
          <View style={styles.row}>
            <TouchableOpacity style={[styles.pickerBtn, { flex: 1, marginRight: 8 }]} onPress={() => setShowOpenTime(true)}>
              <Text style={openTime ? styles.pickerBtnText : styles.pickerBtnPlaceholder}>{openTime || 'Open Time'}</Text>
              <Ionicons name="time-outline" size={18} color="#aaa" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickerBtn, { flex: 1, marginLeft: 8 }]} onPress={() => setShowCloseTime(true)}>
              <Text style={closeTime ? styles.pickerBtnText : styles.pickerBtnPlaceholder}>{closeTime || 'Close Time'}</Text>
              <Ionicons name="time-outline" size={18} color="#aaa" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Number of Tables" keyboardType="numeric" value={form.numberOfTables} onChangeText={(v) => setForm((p) => ({ ...p, numberOfTables: v }))} />
            <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="Chairs per Table" keyboardType="numeric" value={form.chairsPerTable} onChangeText={(v) => setForm((p) => ({ ...p, chairsPerTable: v }))} />
          </View>

          <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
            <Text style={styles.imagePickerBtnText}>{image ? 'Change Restaurant Image' : 'Upload Restaurant Image'}</Text>
          </TouchableOpacity>
          {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

          <TouchableOpacity style={styles.primaryButton} onPress={createRestaurantProfile}>
            <Text style={styles.primaryButtonText}>Submit For Approval</Text>
          </TouchableOpacity>
        </ScrollView>

        <TimePickerModal visible={showOpenTime} onClose={() => setShowOpenTime(false)} onSelect={setOpenTime} slots={timeSlots} title="Open Time" selected={openTime} />
        <TimePickerModal visible={showCloseTime} onClose={() => setShowCloseTime(false)} onSelect={setCloseTime} slots={timeSlots} title="Close Time" selected={closeTime} />
      </View>
    );
  }

  const statusColor = {
    pending: '#f39c12',
    approved: '#2ecc71',
    rejected: '#000000',
    suspended: '#8e44ad'
  }[restaurant.status] || '#95a5a6';

  return (
    <View style={styles.screen}>
      {/* Custom Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
           <Text style={styles.logoText}>Owner<Text style={styles.logoFood}>PORTAL</Text></Text>
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
        style={styles.screenContent}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOwnerData(); }} />}
      >
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>{restaurant.restaurantName}</Text>

        {/* Quick Actions for Owner */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
             style={[styles.quickActionCard, { backgroundColor: '#000000' }]}
             onPress={() => navigation.navigate('OwnerMenu')}
             activeOpacity={0.8}
          >
            <View style={styles.qaIconCircle}>
              <Text style={styles.qaIcon}><Ionicons name="restaurant-outline" size={24} color="#000000" /></Text>
            </View>
            <Text style={styles.qaTitle}>Manage Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity 
             style={[styles.quickActionCard, { backgroundColor: '#3498db' }]}
             onPress={() => navigation.navigate('OwnerOrders')}
             activeOpacity={0.8}
          >
            <View style={styles.qaIconCircle}>
              <Text style={styles.qaIcon}><Ionicons name="cube-outline" size={24} color="#000000" /></Text>
            </View>
            <Text style={styles.qaTitle}>View Orders</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 15 }}>
            <TouchableOpacity 
               style={[styles.quickActionCard, { backgroundColor: '#e67e22', width: '48%' }]}
               onPress={() => navigation.navigate('AdminCategories')}
               activeOpacity={0.8}
            >
              <View style={styles.qaIconCircle}>
                <Text style={styles.qaIcon}><Ionicons name="grid-outline" size={24} color="#000000" /></Text>
              </View>
              <Text style={styles.qaTitle}>Categories</Text>
            </TouchableOpacity>

            <TouchableOpacity 
               style={[styles.quickActionCard, { backgroundColor: '#9b59b6', width: '48%' }]}
               onPress={() => navigation.navigate('OwnerReservations')}
               activeOpacity={0.8}
            >
              <View style={styles.qaIconCircle}>
                <Text style={styles.qaIcon}><Ionicons name="calendar-outline" size={24} color="#000000" /></Text>
              </View>
              <Text style={styles.qaTitle}>Reservations</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
             style={[styles.quickActionCard, { backgroundColor: '#e74c3c', width: '100%', marginTop: 15 }]}
             onPress={() => navigation.navigate('OwnerReviews')}
             activeOpacity={0.8}
          >
            <View style={styles.qaIconCircle}>
              <Text style={styles.qaIcon}><Ionicons name="star-outline" size={24} color="#000000" /></Text>
            </View>
            <Text style={styles.qaTitle}>Manage Reviews</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Approval Status</Text>
          <Text style={[styles.status, { color: statusColor }]}>{restaurant.status.toUpperCase()}</Text>
          <Text style={styles.note}>{restaurant.approvalNote || 'No note from admin yet.'}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.menuCount}</Text>
            <Text style={styles.statLabel}>Menu Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.orderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  screenContent: { flex: 1 },
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
    color: '#000000',
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
  content: { padding: 16, paddingBottom: 40 },
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '600', color: '#000000', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#545454', marginBottom: 16 },
  
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  qaIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  qaIcon: {
    fontSize: 24,
  },
  qaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  imagePickerBtn: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerBtnText: { color: '#fff', fontWeight: '600' },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  label: { fontSize: 13, color: '#95a5a6', marginBottom: 4, textTransform: 'uppercase', fontWeight: '700' },
  status: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  note: { fontSize: 14, color: '#545454', lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#000000', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#545454', fontWeight: '600' },

  // Picker Button Styles
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e1e1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 15 },
  pickerBtnText: { fontSize: 16, color: '#000' },
  pickerBtnPlaceholder: { fontSize: 16, color: '#a4b0be' },

  // Time Picker Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  slot: { flex: 1, margin: 5, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#f6f6f6', borderWidth: 1.5, borderColor: '#f0f0f0' },
  slotActive: { backgroundColor: '#000', borderColor: '#000' },
  slotText: { fontSize: 14, fontWeight: '600', color: '#34495e' },
  slotTextActive: { color: '#fff' }
});

export default OwnerDashboardScreen;


