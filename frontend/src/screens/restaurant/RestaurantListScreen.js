import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, TextInput } from 'react-native';
import api, { buildAssetUrl } from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';

const RestaurantListScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchRestaurants();
    }, [])
  );

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/restaurants');
      setRestaurants(response.data.data);
    } catch (error) {
      console.log('Error fetching restaurants', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    restaurant.cuisineType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRestaurant = ({ item }) => {
    const mainImage = item.coverImage && item.coverImage !== 'no-cover.jpg' ? item.coverImage : item.image;
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('RestaurantDetails', { 
          restaurantId: item._id, 
          restaurantName: item.restaurantName,
          coverImage: mainImage,
          rating: item.rating
        })}
        activeOpacity={0.9}
      >
        <Image 
           source={{ uri: buildAssetUrl(mainImage) }} 
           style={styles.coverImage} 
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{item.restaurantName}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color={COLORS.star} style={{marginRight: 4}} />
              <Text style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : 'New'}</Text>
            </View>
          </View>
          <Text style={styles.cuisine}>{item.cuisineType}</Text>
          <View style={styles.detailsRow}>
            <Ionicons name="bicycle-outline" size={14} color={COLORS.textLight} style={{marginRight: 4}} />
            <Text style={styles.detailsText}>Free delivery • 20-30 min</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Discover Restaurants</Text>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textLight} style={{marginRight: 10}} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or cuisine..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredRestaurants.length === 0 ? (
         <View style={styles.center}>
           <Text style={styles.emptyText}>🍽️ No restaurants found.</Text>
         </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item._id}
          renderItem={renderRestaurant}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textDark, marginBottom: 16 },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.textDark },
  
  card: {
    backgroundColor: COLORS.surface,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.border,
  },
  cardContent: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, flex: 1, marginRight: 10 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: COLORS.star },
  cuisine: { fontSize: 14, color: COLORS.textMedium, marginBottom: 6, fontWeight: '500' },
  detailsRow: { flexDirection: 'row', alignItems: 'center' },
  detailsText: { fontSize: 14, color: COLORS.textLight, fontWeight: '500' },
  emptyText: { fontSize: 16, color: COLORS.textMedium },
});

export default RestaurantListScreen;
