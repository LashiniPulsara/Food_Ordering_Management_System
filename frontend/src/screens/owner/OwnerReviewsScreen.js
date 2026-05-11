import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Modal, TextInput, KeyboardAvoidingView,
  Platform, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { buildAssetUrl } from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const OwnerReviewsScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);

  // Reply Modal State
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      const restRes = await api.get('/restaurants/my/restaurant', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const restData = restRes.data.data;
      setRestaurant(restData);

      if (restData) {
        const revRes = await api.get(`/reviews/restaurant/${restData._id}`);
        setReviews(revRes.data.data || []);
      }
    } catch (error) {
      console.log('Error fetching owner reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyText(review.ownerReply || '');
    setShowReplyModal(true);
  };

  const submitReply = async () => {
    if (!replyText.trim()) return Alert.alert('Error', 'Please enter your reply.');

    setSubmitting(true);
    try {
      await api.put(`/reviews/${selectedReview._id}/reply`, { ownerReply: replyText }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      Alert.alert('Success', 'Reply posted successfully.');
      setShowReplyModal(false);
      fetchOwnerData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post reply.');
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
            <Text style={styles.reviewerName}>{item.userId?.name || 'Customer'}</Text>
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

      {item.ownerReply ? (
        <View style={styles.ownerReplyBox}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
             <Text style={styles.replyTitle}>Your Reply</Text>
             <TouchableOpacity onPress={() => openReplyModal(item)}>
               <Ionicons name="pencil" size={16} color="#3498db" />
             </TouchableOpacity>
          </View>
          <Text style={styles.replyText}>{item.ownerReply}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.replyBtn} onPress={() => openReplyModal(item)}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#000" />
          <Text style={styles.replyBtnText}>Reply to Customer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
      ) : !restaurant ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Restaurant profile not found.</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item._id}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="star-outline" size={60} color="#e1e1e1" />
              <Text style={styles.emptyText}>No reviews yet.</Text>
              <Text style={styles.emptySubText}>When customers review {restaurant.restaurantName}, they will appear here.</Text>
            </View>
          }
        />
      )}

      {/* Reply Modal */}
      <Modal visible={showReplyModal} transparent animationType="slide" onRequestClose={() => setShowReplyModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Review</Text>
              <TouchableOpacity onPress={() => setShowReplyModal(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedReview && (
                <View style={styles.quoteBox}>
                  <Text style={styles.quoteText}>"{selectedReview.reviewText}"</Text>
                  <Text style={styles.quoteAuthor}>- {selectedReview.userId?.name || 'Customer'} ({selectedReview.rating}★)</Text>
                </View>
              )}

              <Text style={styles.label}>Your Reply</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Thank the customer or address their concerns..."
                placeholderTextColor="#a4b0be"
                multiline
                numberOfLines={5}
                value={replyText}
                onChangeText={setReplyText}
                autoFocus
              />

              {submitting ? (
                <View style={styles.submittingBox}><ActivityIndicator color="#fff" /></View>
              ) : (
                <TouchableOpacity style={styles.submitBtn} onPress={submitReply}>
                  <Text style={styles.submitBtnText}>Post Reply</Text>
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
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  listContent: { padding: 16, paddingBottom: 40 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  reviewerName: { fontSize: 15, fontWeight: '600', color: '#000' },
  reviewDate: { fontSize: 12, color: '#888', marginTop: 2 },
  starsRow: { flexDirection: 'row' },
  reviewText: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 12 },
  reviewPhoto: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
  ownerReplyBox: { backgroundColor: '#f0f8ff', padding: 14, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#3498db' },
  replyTitle: { fontSize: 13, fontWeight: '700', color: '#000', marginBottom: 6 },
  replyText: { fontSize: 13, color: '#555', lineHeight: 20 },
  replyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f6f6', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  replyBtnText: { fontSize: 14, fontWeight: '600', color: '#000', marginLeft: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#000', marginTop: 16 },
  emptySubText: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center', paddingHorizontal: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  modalContent: { padding: 20 },
  quoteBox: { backgroundColor: '#f6f6f6', padding: 16, borderRadius: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#ddd' },
  quoteText: { fontStyle: 'italic', color: '#555', marginBottom: 8 },
  quoteAuthor: { fontSize: 12, fontWeight: '700', color: '#888' },
  label: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 10 },
  textArea: { backgroundColor: '#f6f6f6', borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 16, fontSize: 16, color: '#000', textAlignVertical: 'top', minHeight: 120, marginBottom: 20 },
  submitBtn: { backgroundColor: '#000', paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginBottom: 30 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  submittingBox: { backgroundColor: '#000', paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginBottom: 30 },
});

export default OwnerReviewsScreen;
