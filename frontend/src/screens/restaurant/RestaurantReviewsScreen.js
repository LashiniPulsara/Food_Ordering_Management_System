import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Modal, TextInput, KeyboardAvoidingView,
  Platform, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api, { buildAssetUrl } from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const RestaurantReviewsScreen = ({ route, navigation }) => {
  const { restaurantId, restaurantName } = route.params;
  const { userToken } = useContext(AuthContext);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/restaurant/${restaurantId}`);
      setReviews(res.data.data || []);
    } catch (error) {
      console.log('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const submitReview = async () => {
    if (!rating) return Alert.alert('Rating Required', 'Please select a star rating.');
    if (!reviewText.trim()) return Alert.alert('Review Required', 'Please write your review.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('restaurantId', restaurantId);
      formData.append('rating', rating.toString());
      formData.append('reviewText', reviewText);

      if (photo) {
        const filename = photo.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        if (Platform.OS === 'web') {
           const response = await fetch(photo);
           const blob = await response.blob();
           formData.append('photo', blob, filename || 'upload.jpg');
        } else {
           formData.append('photo', { uri: photo, name: filename, type });
        }
      }

      await api.post('/reviews', formData, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      Alert.alert('Success', 'Your review has been submitted!');
      setShowModal(false);
      setRating(0);
      setReviewText('');
      setPhoto(null);
      fetchReviews();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.reviewerName}>{item.userId?.name || 'Anonymous'}</Text>
            <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <Ionicons key={star} name={star <= item.rating ? 'star' : 'star-outline'} size={14} color="#f1c40f" />
          ))}
        </View>
      </View>
      
      <Text style={styles.reviewText}>{item.reviewText}</Text>
      
      {item.photo && (
        <Image source={{ uri: buildAssetUrl(item.photo) }} style={styles.reviewPhoto} />
      )}

      {item.ownerReply && (
        <View style={styles.ownerReplyBox}>
          <Text style={styles.replyTitle}>Owner's Reply</Text>
          <Text style={styles.replyText}>{item.ownerReply}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <Text style={styles.restaurantNameSub}>{restaurantName}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item._id}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={60} color="#e1e1e1" />
              <Text style={styles.emptyText}>No reviews yet.</Text>
              <Text style={styles.emptySubText}>Be the first to review {restaurantName}!</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="pencil" size={24} color="#fff" />
        <Text style={styles.fabText}>Write a Review</Text>
      </TouchableOpacity>

      {/* Write Review Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.label}>Rate your experience</Text>
              <View style={styles.starSelectRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7} style={{ padding: 4 }}>
                    <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={36} color={star <= rating ? '#f1c40f' : '#e1e1e1'} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Your Review</Text>
              <TextInput
                style={styles.textArea}
                placeholder="What did you like or dislike?"
                placeholderTextColor="#a4b0be"
                multiline
                numberOfLines={4}
                value={reviewText}
                onChangeText={setReviewText}
              />

              <Text style={styles.label}>Add a Photo (Optional)</Text>
              <TouchableOpacity style={styles.photoUploadBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={20} color="#3498db" />
                <Text style={styles.photoUploadText}>{photo ? 'Change Photo' : 'Upload Photo'}</Text>
              </TouchableOpacity>
              
              {photo && <Image source={{ uri: photo }} style={styles.photoPreview} />}

              {submitting ? (
                <View style={styles.submittingBox}><ActivityIndicator color="#fff" /></View>
              ) : (
                <TouchableOpacity style={styles.submitBtn} onPress={submitReview}>
                  <Text style={styles.submitBtnText}>Submit Review</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 10 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  restaurantNameSub: { textAlign: 'center', fontSize: 14, color: '#888', marginBottom: 10 },
  listContent: { padding: 20, paddingBottom: 100 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  reviewerName: { fontSize: 15, fontWeight: '600', color: '#000' },
  reviewDate: { fontSize: 12, color: '#888', marginTop: 2 },
  starsRow: { flexDirection: 'row' },
  reviewText: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 12 },
  reviewPhoto: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
  ownerReplyBox: { backgroundColor: '#f9f9f9', padding: 14, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#3498db' },
  replyTitle: { fontSize: 13, fontWeight: '700', color: '#000', marginBottom: 4 },
  replyText: { fontSize: 13, color: '#555', lineHeight: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#000', marginTop: 16 },
  emptySubText: { fontSize: 14, color: '#888', marginTop: 8 },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  modalContent: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 10, marginTop: 10 },
  starSelectRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  textArea: { backgroundColor: '#f6f6f6', borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 16, fontSize: 16, color: '#000', textAlignVertical: 'top', minHeight: 120, marginBottom: 20 },
  photoUploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EBF5FB', padding: 14, borderRadius: 12, marginBottom: 16 },
  photoUploadText: { color: '#3498db', fontWeight: '600', marginLeft: 8, fontSize: 15 },
  photoPreview: { width: '100%', height: 160, borderRadius: 12, marginBottom: 20 },
  submitBtn: { backgroundColor: '#000', paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  submittingBox: { backgroundColor: '#000', paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, marginBottom: 30 },
});

export default RestaurantReviewsScreen;
