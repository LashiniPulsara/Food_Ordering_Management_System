import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Image, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { buildAssetUrl } from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const OwnerMenuScreen = () => {
  const { userToken } = useContext(AuthContext);
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    foodName: '',
    description: '',
    price: '',
    categoryId: '',
    preparationTime: '15'
  });

  const [editingItem, setEditingItem] = useState(null);
  const [image, setImage] = useState(null);

  const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

  const loadData = async () => {
    try {
      const restRes = await api.get('/restaurants/my/restaurant', authConfig);
      const rest = restRes.data.data;
      setRestaurant(rest);

      const [catRes, menuRes] = await Promise.all([
        api.get('/categories').catch(() => ({ data: { data: [] } })),
        api.get(`/menu/restaurant/${rest._id}`).catch(() => ({ data: { data: [] } }))
      ]);

      const cats = catRes.data.data || [];
      setCategories(cats);
      setMenuItems(menuRes.data.data || []);

      // Auto-select first category if none selected
      if (cats.length > 0 && !form.categoryId) {
        setForm((p) => ({ ...p, categoryId: cats[0]._id }));
      }
    } catch (error) {
      console.log('Owner menu load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio is better for food items
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const submitMenuItem = async () => {
    if (!restaurant || restaurant.status !== 'approved') {
      alert('Restaurant is not approved yet.');
      return;
    }
    if (!form.foodName || !form.description || !form.price || !form.categoryId || !form.preparationTime) {
      alert('Please fill all menu fields and select a category.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('foodName', form.foodName);
      formData.append('description', form.description);
      formData.append('price', Number(form.price));
      formData.append('categoryId', form.categoryId);
      formData.append('restaurantId', restaurant._id);
      formData.append('preparationTime', Number(form.preparationTime));
      
      if (!editingItem) {
         formData.append('availability', 'true');
      }

      if (image) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        
        if (Platform.OS === 'web') {
             const response = await fetch(image);
             const blob = await response.blob();
             formData.append('image', blob, filename || 'food.jpg');
        } else {
             formData.append('image', { uri: image, name: filename, type });
        }
      }

      if (editingItem) {
        await api.put(`/menu/${editingItem._id}`, formData, {
          headers: {
            ...authConfig.headers,
            'Content-Type': 'multipart/form-data',
          }
        });
        Alert.alert('Success', 'Menu item updated successfully.');
      } else {
        await api.post('/menu', formData, {
          headers: {
            ...authConfig.headers,
            'Content-Type': 'multipart/form-data',
          }
        });
        Alert.alert('Success', 'Menu item added successfully.');
      }

      setEditingItem(null);
      setForm({ foodName: '', description: '', price: '', categoryId: categories[0]?._id || '', preparationTime: '15' });
      setImage(null);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save menu item.');
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setForm({ foodName: '', description: '', price: '', categoryId: categories[0]?._id || '', preparationTime: '15' });
    setImage(null);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setForm({
      foodName: item.foodName,
      description: item.description,
      price: item.price.toString(),
      categoryId: item.categoryId?._id || item.categoryId,
      preparationTime: item.preparationTime.toString()
    });
    setImage(null);
  };

  const toggleAvailability = async (item) => {
    try {
      await api.put(`/menu/${item._id}`, { availability: !item.availability }, authConfig);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update item.');
    }
  };

  const deleteMenuItem = (item) => {
    Alert.alert(
      'Delete Menu Item',
      `Are you sure you want to delete "${item.foodName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/menu/${item._id}`, authConfig);
              await loadData();
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete item.');
            }
          }
        }
      ]
    );
  };

  // Get category name from ID
  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c._id === catId);
    return cat ? cat.categoryName : 'Unknown';
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#000000" /></View>;
  }

  if (!restaurant) {
    return <View style={styles.center}><Text>Create your restaurant profile first.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Menu Manager</Text>
            <Text style={styles.subtitle}>{restaurant.restaurantName}</Text>
            <Text style={[styles.subtitle, { marginBottom: 12 }]}>Status: {restaurant.status}</Text>

            {/* Add Menu Item Form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </Text>

              <TextInput style={styles.input} placeholder="Food Name" value={form.foodName} onChangeText={(v) => setForm((p) => ({ ...p, foodName: v }))} />
              <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} />
              <TextInput style={styles.input} placeholder="Price (Rs.)" keyboardType="numeric" value={form.price} onChangeText={(v) => setForm((p) => ({ ...p, price: v }))} />
              <TextInput style={styles.input} placeholder="Preparation Time (minutes)" keyboardType="numeric" value={form.preparationTime} onChangeText={(v) => setForm((p) => ({ ...p, preparationTime: v }))} />

              {/* Category Selector */}
              <Text style={styles.selectorLabel}>Select Category:</Text>
              {categories.length === 0 ? (
                <View style={styles.noCatBox}>
                  <Text style={styles.noCatText}>No categories available.</Text>
                  <Text style={styles.noCatSubText}>Ask admin to create categories first.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                  {categories.map((cat) => {
                    const isSelected = form.categoryId === cat._id;
                    return (
                      <TouchableOpacity
                        key={cat._id}
                        style={[
                          styles.catChip,
                          isSelected && styles.catChipSelected,
                        ]}
                        onPress={() => setForm((p) => ({ ...p, categoryId: cat._id }))}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>
                          {cat.categoryName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Text style={styles.imagePickerBtnText}>{image ? 'Change Item Image' : 'Upload Item Image'}</Text>
              </TouchableOpacity>
              {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!form.categoryId || categories.length === 0) && styles.primaryButtonDisabled,
                ]}
                onPress={submitMenuItem}
                disabled={!form.categoryId || categories.length === 0}
              >
                <Text style={styles.primaryButtonText}>
                  {editingItem ? 'Update Menu Item' : 'Add Menu Item'}
                </Text>
              </TouchableOpacity>
              
              {editingItem && (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: '#e74c3c', marginTop: 10 }]}
                  onPress={cancelEdit}
                >
                  <Text style={styles.primaryButtonText}>Cancel Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>
              Menu Items ({menuItems.length})
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image 
               source={{ uri: buildAssetUrl(item.image) }} 
               style={styles.menuImageList} 
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.foodName}</Text>
              <Text style={styles.itemMeta}>Rs. {Number(item.price).toFixed(2)} | {item.preparationTime} min</Text>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>
                  {item.categoryId?.categoryName || getCategoryName(item.categoryId) || 'N/A'}
                </Text>
              </View>
              <Text style={[styles.itemMeta, { color: item.availability ? '#2ecc71' : '#000000' }]}>
                {item.availability ? '● Available' : '● Unavailable'}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#3498db', marginBottom: 6 }]} onPress={() => openEditForm(item)}>
                <Text style={styles.smallButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={() => toggleAvailability(item)}>
                <Text style={styles.smallButtonText}>{item.availability ? 'Disable' : 'Enable'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#000000', marginTop: 6 }]} onPress={() => deleteMenuItem(item)}>
                <Text style={styles.smallButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#95a5a6' }}>No menu items yet. Add your first item above.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#000000' },
  subtitle: { fontSize: 13, color: '#545454' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000000', marginTop: 6, marginBottom: 10 },

  formCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginVertical: 10 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#34495e', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#eeeeee', borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: '#fafafa' },

  // Category Selector
  selectorLabel: { fontSize: 13, fontWeight: '600', color: '#34495e', marginBottom: 8 },
  catScroll: { marginBottom: 12 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#ecf0f1',
  },
  catChipSelected: {
    backgroundColor: '#00000010',
    borderColor: '#000000',
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#545454',
  },
  catChipTextSelected: {
    color: '#000000',
  },
  noCatBox: {
    backgroundColor: '#fdf2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  noCatText: { fontSize: 13, fontWeight: '600', color: '#000000' },
  noCatSubText: { fontSize: 12, color: '#95a5a6', marginTop: 2 },

  primaryButton: { backgroundColor: '#000000', borderRadius: 8, padding: 12, alignItems: 'center' },
  primaryButtonDisabled: { backgroundColor: '#bdc3c7' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },

  imagePickerBtn: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },

  itemCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  menuImageList: { width: 50, height: 50, borderRadius: 8, marginRight: 10, backgroundColor: '#ecf0f1' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#000000' },
  itemMeta: { fontSize: 12, color: '#545454', marginTop: 2 },
  itemActions: { marginLeft: 8 },

  catBadge: {
    backgroundColor: '#00000015',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  catBadgeText: { fontSize: 11, fontWeight: '600', color: '#000000' },

  smallButton: { backgroundColor: '#16a085', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  smallButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});

export default OwnerMenuScreen;
