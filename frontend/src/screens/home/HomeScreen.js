import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  Pressable, FlatList, TextInput, ActivityIndicator, Image, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api, { buildAssetUrl } from '../../api/axios';
import { COLORS } from '../../theme/colors';

const CUISINE_FILTERS = ['All', 'Italian', 'Chinese', 'Indian', 'Burger', 'Pizza', 'Sri Lankan', 'Seafood', 'Desserts'];

const getCuisineEmoji = (cuisine) => {
  const map = {
    'italian': '🍝', 'chinese': '🥡', 'indian': '🍛', 'burger': '🍔',
    'pizza': '🍕', 'sri lankan': '🍚', 'seafood': '🦞', 'desserts': '🍰',
    'sushi': '🍣', 'mexican': '🌮', 'thai': '🍜', 'bbq': '🔥',
  };
  return map[cuisine?.toLowerCase()] || '🍽️';
};

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  useFocusEffect(
    React.useCallback(() => {
      fetchRestaurants();
    }, [])
  );

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/restaurants');
      setRestaurants(response.data.data || []);
    } catch (error) {
      console.log('Error fetching restaurants', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchSearch =
      r.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisineType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCuisine =
      selectedCuisine === 'All' ||
      r.cuisineType.toLowerCase().includes(selectedCuisine.toLowerCase());
    return matchSearch && matchCuisine;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderRestaurant = ({ item }) => {
    const mainImage = item.coverImage && item.coverImage !== 'no-cover.jpg' ? item.coverImage : item.image;
    const emoji = getCuisineEmoji(item.cuisineType);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RestaurantDetails', {
          restaurantId: item._id,
          restaurantName: item.restaurantName,
          coverImage: mainImage,
          rating: item.rating
        })}
        activeOpacity={0.92}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: buildAssetUrl(mainImage) }} style={styles.coverImage} />
          <View style={[styles.openBadge, { backgroundColor: item.isOpen ? COLORS.success : COLORS.error }]}>
            <View style={styles.openDot} />
            <Text style={styles.openBadgeText}>{item.isOpen ? 'Open' : 'Closed'}</Text>
          </View>
          <View style={styles.emojiPill}>
            <Text style={styles.emojiPillText}>{emoji} {item.cuisineType}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={styles.name} numberOfLines={1}>{item.restaurantName}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={COLORS.star} />
              <Text style={styles.ratingText}> {item.rating ? item.rating.toFixed(1) : 'New'}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={13} color={COLORS.textMedium} />
              <Text style={styles.metaText}> 20–30 min</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaChip}>
              <Ionicons name="bicycle-outline" size={13} color={COLORS.textMedium} />
              <Text style={styles.metaText}> Free delivery</Text>
            </View>
            {item.numberOfTables > 0 && (
              <>
                <View style={styles.metaDot} />
                <View style={styles.metaChip}>
                  <Ionicons name="grid-outline" size={13} color={COLORS.textMedium} />
                  <Text style={styles.metaText}> {item.numberOfTables} tables</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Warm Hero */}
      <View style={styles.heroSection}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.userName}>{userInfo?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.heroSubtitle}>What are you craving today?</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.textLight} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurant or cuisine..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cuisine Chips */}
      <View style={styles.chipsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {CUISINE_FILTERS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, selectedCuisine === c && styles.chipActive]}
              onPress={() => setSelectedCuisine(c)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, selectedCuisine === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          {selectedCuisine === 'All' ? 'All Restaurants' : `${selectedCuisine} Restaurants`}
        </Text>
        <Text style={styles.sectionCount}>{filteredRestaurants.length} places</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.logoText}>WMT<Text style={styles.logoAccent}>FOOD</Text></Text>
        <View style={styles.headerRight}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="cart-outline" size={22} color={COLORS.textDark} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={22} color={COLORS.textDark} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding restaurants near you...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item._id}
          renderItem={renderRestaurant}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>No restaurants found</Text>
              <Text style={styles.emptySubtitle}>Try a different search or cuisine filter.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },

  // Top Header
  topHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : 20,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
  },
  logoText: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5 },
  logoAccent: { color: COLORS.primary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 10, backgroundColor: COLORS.secondary, borderRadius: 22 },
  iconBtnPressed: { opacity: 0.6 },

  // Warm Hero
  heroSection: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  userName: { fontSize: 30, fontWeight: '800', color: '#ffffff', marginTop: 2, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6, marginBottom: 20 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 5,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textDark },

  // Cuisine Chips
  chipsSection: { marginTop: 20 },
  chipsScroll: { paddingHorizontal: 16, gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: COLORS.surface, borderRadius: 22,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textMedium },
  chipTextActive: { color: '#ffffff' },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 24, marginBottom: 14
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  sectionCount: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Restaurant Card
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20, marginBottom: 20,
    overflow: 'hidden',
    shadowColor: COLORS.shadow, shadowOpacity: 1, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  imageWrapper: { position: 'relative' },
  coverImage: { width: '100%', height: 190, backgroundColor: COLORS.border },
  openBadge: {
    position: 'absolute', top: 14, left: 14,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 6 },
  openBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emojiPill: {
    position: 'absolute', bottom: 14, left: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  emojiPillText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  cardContent: { padding: 16 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, flex: 1, marginRight: 10 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF8E1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: COLORS.star },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: COLORS.textMedium, fontWeight: '500' },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.border },

  // Empty State
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 30 },
});

export default HomeScreen;
