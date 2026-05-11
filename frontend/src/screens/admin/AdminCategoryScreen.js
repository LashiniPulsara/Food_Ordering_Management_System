import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const AdminCategoryScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ categoryName: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const authConfig = { headers: { Authorization: `Bearer ${userToken}` } };

  // Load all global categories
  const loadCategories = async () => {
    try {
      const res = await api.get('/categories', authConfig);
      setCategories(res.data.data || []);
    } catch (error) {
      console.log('Failed to load categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const openCreateForm = () => {
    setEditingCategory(null);
    setForm({ categoryName: '', description: '' });
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setForm({ categoryName: category.categoryName, description: category.description });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.categoryName.trim() || !form.description.trim()) {
      Alert.alert('Validation', 'Please fill in both category name and description.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, form, authConfig);
        Alert.alert('Success', 'Category updated successfully.');
      } else {
        await api.post('/categories', form, authConfig);
        Alert.alert('Success', 'Category created successfully.');
      }

      setShowForm(false);
      setForm({ categoryName: '', description: '' });
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.categoryName}"?\nMenu items using this category will keep their reference.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/categories/${category._id}`, authConfig);
              Alert.alert('Deleted', 'Category removed successfully.');
              loadCategories();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Global Categories</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.infoText}>
        These categories are available to all restaurants. Owners select from these when adding menu items.
      </Text>

      {/* Create Button */}
      <TouchableOpacity style={styles.createButton} onPress={openCreateForm} activeOpacity={0.8}>
        <Text style={styles.createButtonIcon}>＋</Text>
        <Text style={styles.createButtonText}>Create Category</Text>
      </TouchableOpacity>

      {/* Category List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <View style={styles.categoryCardHeader}>
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>📁</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryName}>{item.categoryName}</Text>
                <Text style={styles.categoryDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>

            <View style={styles.categoryActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => openEditForm(item)}
              >
                <Text style={styles.editButtonText}><Ionicons name="create-outline" size={24} color="#000000" /> Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.deleteButtonText}>🗑 Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📂</Text>
            <Text style={styles.emptyText}>No categories yet.</Text>
            <Text style={styles.emptySubText}>Tap "Create Category" to add the first one.</Text>
          </View>
        }
      />

      {/* Create / Edit Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </Text>

              <Text style={styles.inputLabel}>Category Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rice & Curry, Beverages, Desserts"
                value={form.categoryName}
                onChangeText={(v) => setForm((p) => ({ ...p, categoryName: v }))}
                autoFocus
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of this category"
                value={form.description}
                onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    setForm({ categoryName: '', description: '' });
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.submitBtn]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {editingCategory ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#545454' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ecf0f1',
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backBtnText: { fontSize: 16, color: '#3498db', fontWeight: '600' },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: '#000000', flex: 1, textAlign: 'center' },

  infoText: { fontSize: 13, color: '#545454', paddingHorizontal: 20, paddingVertical: 10 },

  createButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3498db', marginHorizontal: 16, marginBottom: 12,
    paddingVertical: 14, borderRadius: 12, elevation: 0,
    shadowColor: '#3498db', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  createButtonIcon: { fontSize: 20, color: '#fff', fontWeight: '700', marginRight: 8 },
  createButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  listContainer: { paddingHorizontal: 16, paddingBottom: 30 },

  categoryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    elevation: 0, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  categoryCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  categoryIconContainer: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: '#ebf5fb',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  categoryIcon: { fontSize: 18 },
  categoryName: { fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 2 },
  categoryDesc: { fontSize: 13, color: '#545454', lineHeight: 18 },
  categoryActions: {
    flexDirection: 'row', justifyContent: 'flex-end',
    borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10,
  },
  actionButton: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, marginLeft: 8 },
  editButton: { backgroundColor: '#ebf5fb' },
  editButtonText: { fontSize: 13, fontWeight: '600', color: '#2980b9' },
  deleteButton: { backgroundColor: '#fdf2f2' },
  deleteButtonText: { fontSize: 13, fontWeight: '600', color: '#000000' },

  emptyContainer: { alignItems: 'center', paddingVertical: 50 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#545454' },
  emptySubText: { fontSize: 13, color: '#95a5a6', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 320 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000000', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#34495e', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#eeeeee', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 14, backgroundColor: '#fafafa', color: '#000000' },
  textArea: { height: 80 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#ecf0f1', marginRight: 8 },
  cancelBtnText: { color: '#545454', fontWeight: '700', fontSize: 15 },
  submitBtn: { backgroundColor: '#3498db', marginLeft: 8 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default AdminCategoryScreen;
