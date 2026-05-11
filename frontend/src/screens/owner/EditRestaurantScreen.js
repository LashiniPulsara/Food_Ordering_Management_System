import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { buildAssetUrl } from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const EditRestaurantScreen = ({ route, navigation }) => {
  const { restaurant } = route.params;
  const { userToken } = useContext(AuthContext);

  const [form, setForm] = useState({
    openingHours: restaurant.openingHours || '',
    numberOfTables: restaurant.numberOfTables?.toString() || '0',
    chairsPerTable: restaurant.chairsPerTable?.toString() || '0',
    secondaryPhone: restaurant.secondaryPhone || '',
  });
  const [isOpen, setIsOpen] = useState(restaurant.isOpen !== undefined ? restaurant.isOpen : true);
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0]);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('openingHours', form.openingHours);
      formData.append('numberOfTables', Number(form.numberOfTables) || 0);
      formData.append('chairsPerTable', Number(form.chairsPerTable) || 0);
      formData.append('secondaryPhone', form.secondaryPhone);
      formData.append('isOpen', isOpen);

      if (coverImage) {
        let localUri = coverImage.uri;
        let filename = localUri.split('/').pop();
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image`;
        formData.append('coverImage', { uri: localUri, name: filename, type });
      }

      await api.put(`/restaurants/${restaurant._id}`, formData, {
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      Alert.alert('Success', 'Restaurant details updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Update Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Restaurant Details</Text>
        <Text style={styles.subtitle}>Update your open status, tables, and extra contacts.</Text>

        <View style={styles.statusContainer}>
           <Text style={styles.statusLabel}>Currently Open?</Text>
           <Switch
             trackColor={{ false: '#7f8c8d', true: '#000000' }}
             thumbColor="#fff"
             ios_backgroundColor="#3e3e3e"
             onValueChange={setIsOpen}
             value={isOpen}
           />
        </View>

        <Text style={styles.label}>Restaurant Cover Photo</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {coverImage ? (
            <Image source={{ uri: coverImage.uri }} style={styles.coverPreview} />
          ) : restaurant.coverImage && restaurant.coverImage !== 'no-cover.jpg' ? (
            <Image source={{ uri: buildAssetUrl(restaurant.coverImage) }} style={styles.coverPreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={32} color="#545454" />
              <Text style={styles.imagePlaceholderText}>Upload Cover Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Read-Only Fields */}
        <Text style={styles.label}>Restaurant Name (Cannot change)</Text>
        <TextInput style={[styles.input, styles.readOnlyInput]} value={restaurant.restaurantName} editable={false} />

        <Text style={styles.label}>Primary Phone (Cannot change)</Text>
        <TextInput style={[styles.input, styles.readOnlyInput]} value={restaurant.phone} editable={false} />

        <Text style={styles.label}>Address (Cannot change)</Text>
        <TextInput style={[styles.input, styles.readOnlyInput]} value={restaurant.address} editable={false} />

        <Text style={styles.label}>Cuisine Type (Cannot change)</Text>
        <TextInput style={[styles.input, styles.readOnlyInput]} value={restaurant.cuisineType} editable={false} />

        {/* Editable Fields */}
        <Text style={styles.label}>Secondary Phone Number</Text>
        <TextInput 
          style={styles.input} 
          value={form.secondaryPhone} 
          placeholder="e.g. 0112345678"
          onChangeText={(v) => setForm(p => ({...p, secondaryPhone: v}))} 
        />

        <Text style={styles.label}>Opening Hours</Text>
        <TextInput 
          style={styles.input} 
          value={form.openingHours} 
          placeholder="e.g. 9:00 AM - 10:00 PM"
          onChangeText={(v) => setForm(p => ({...p, openingHours: v}))} 
        />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Total Tables</Text>
            <TextInput 
              style={[styles.input, styles.halfInput]} 
              keyboardType="numeric"
              value={form.numberOfTables} 
              onChangeText={(v) => setForm(p => ({...p, numberOfTables: v}))} 
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Chairs per Table</Text>
            <TextInput 
              style={[styles.input, styles.halfInput, { marginLeft: 10 }]} 
              keyboardType="numeric"
              value={form.chairsPerTable} 
              onChangeText={(v) => setForm(p => ({...p, chairsPerTable: v}))} 
            />
          </View>
        </View>

        {loading ? (
           <ActivityIndicator size="large" color="#000000" style={{ marginTop: 20 }} />
        ) : (
           <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
           </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9f9f9' },
  container: { padding: 20, paddingBottom: 50 },
  title: { fontSize: 24, fontWeight: '600', color: '#000000', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#545454', marginBottom: 20 },
  
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  statusLabel: { fontSize: 16, fontWeight: '600', color: '#000000' },

  label: { fontSize: 13, fontWeight: '600', color: '#34495e', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#000000'
  },
  readOnlyInput: {
    backgroundColor: '#ecf0f1',
    color: '#545454',
    borderColor: '#bdc3c7'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  flex1: { flex: 1 },
  halfInput: { marginBottom: 20 },
  saveBtn: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  imagePicker: {
    width: '100%',
    height: 180,
    backgroundColor: '#f6f6f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#545454',
    marginTop: 8,
    fontSize: 14,
  }
});

export default EditRestaurantScreen;
