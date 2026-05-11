import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { buildAssetUrl } from '../../api/axios';
import { CartContext } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const RestaurantDetailsScreen = ({ route, navigation }) => {
  const { restaurantId, restaurantName, coverImage, rating } = route.params;
  const { cartItems, addToCart, getCartTotal } = useContext(CartContext);

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRating, setCurrentRating] = useState(rating);

  // Hide default header
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      fetchRestaurantDetails();
    }, [])
  );

  const fetchRestaurantDetails = async () => {
    try {
      const res = await api.get(`/restaurants/${restaurantId}`);
      if (res.data && res.data.data) {
        setCurrentRating(res.data.data.rating);
      }
    } catch (error) {
      console.log('Error fetching restaurant details', error);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await api.get(`/menu/restaurant/${restaurantId}`);
      const items = response.data.data || [];
      setMenuItems(items);

      const uniqueCats = [];
      const catSet = new Set();
      items.forEach(item => {
        if (item.categoryId && !catSet.has(item.categoryId._id)) {
          catSet.add(item.categoryId._id);
          uniqueCats.push(item.categoryId);
        }
      });
      setCategories(uniqueCats);
      if (uniqueCats.length > 0) {
        setSelectedCategory(uniqueCats[0]._id);
      }
    } catch (error) {
      console.log('Error fetching menu', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    addToCart(item, restaurantId);
  };

  const filteredItems = menuItems.filter(item =>
    selectedCategory ? item.categoryId?._id === selectedCategory : true
  );

  const renderMenuItem = ({ item }) => {
    const isAdded = cartItems.some(cartItem => cartItem._id === item._id);

    return (
      <View style={styles.menuItemCard}>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemTitle}>{item.foodName}</Text>
          <Text style={styles.menuItemPrice}>Rs. {item.price.toFixed(2)}</Text>
          <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
        </View>

        <View style={styles.menuItemImageContainer}>
          <Image
            source={{ uri: buildAssetUrl(item.image) }}
            style={styles.menuItemImage}
          />
          {isAdded ? (
            <View style={styles.addedBadge}>
              <Text style={styles.addedBadgeText}>✓ Added</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddToCart(item)}
            >
              <Ionicons name="add" size={20} color="#000000" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const hasCoverImage = coverImage && coverImage !== 'no-cover.jpg' && coverImage !== 'no-photo.jpg';

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Cover Image */}
      {hasCoverImage ? (
        <Image
          source={{ uri: buildAssetUrl(coverImage) }}
          style={styles.coverImage}
        />
      ) : (
        <View style={[styles.coverImage, { backgroundColor: '#eeeeee' }]} />
      )}

      {/* Floating Back/Options Buttons */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Restaurant Info */}
      <View style={styles.infoSection}>
        <Text style={styles.restaurantTitle}>{restaurantName}</Text>
        <Text style={styles.restaurantMeta}>{currentRating ? currentRating.toFixed(1) : 'New *'} <Ionicons name="star" size={14} color="#000000" /> • Delivery • 20-30 min</Text>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.reserveButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('TableReservation', { restaurantId, restaurantName })}
          >
            <Ionicons name="calendar-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
            <Text style={styles.reserveButtonText}>Reserve a Table</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reviewButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RestaurantReviews', { restaurantId, restaurantName })}
          >
            <Ionicons name="star-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
            <Text style={styles.reserveButtonText}>Reviews</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categorySection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item._id;
            return (
              <TouchableOpacity
                style={[styles.catPill, isSelected && styles.catPillSelected]}
                onPress={() => setSelectedCategory(item._id)}
              >
                <Text style={[styles.catPillText, isSelected && styles.catPillTextSelected]}>
                  {item.categoryName}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#000000" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        renderItem={renderMenuItem}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No items available in this category.</Text>}
        style={styles.listStyle}
      />

      {/* Sticky Bottom Cart */}
      {cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.stickyCart}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Cart')}
        >
          <View style={styles.cartContent}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
            <Text style={styles.viewCartText}>View cart</Text>
            <Text style={styles.cartTotalPrice}>Rs. {getCartTotal().toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listStyle: { flex: 1 },

  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 10,
  },
  coverImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },

  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  restaurantTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  restaurantMeta: {
    fontSize: 14,
    color: COLORS.textMedium,
    marginBottom: 16,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  reserveButtonText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },

  categorySection: {
    marginTop: 8,
  },
  catPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  catPillTextSelected: {
    color: COLORS.textWhite,
  },

  menuItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 15,
    color: COLORS.primary,
    marginBottom: 6,
    fontWeight: '700',
  },
  menuItemDesc: {
    fontSize: 14,
    color: COLORS.textMedium,
    lineHeight: 20,
  },
  menuItemImageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  menuItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  addButton: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addedBadge: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addedBadgeText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },

  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: 40,
    fontSize: 16,
  },

  stickyCart: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  viewCartText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  cartTotalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
  }
});

export default RestaurantDetailsScreen;
