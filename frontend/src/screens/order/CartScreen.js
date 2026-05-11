import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { CartContext } from '../../context/CartContext';
import { buildAssetUrl } from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import PremiumButton from '../../components/PremiumButton';

const CartScreen = ({ navigation }) => {
  const { cartItems, updateQuantity, getCartTotal } = useContext(CartContext);

  const renderCartItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: buildAssetUrl(item.image) }}
        style={styles.cartImage}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.name} numberOfLines={1}>{item.foodName}</Text>
        <Text style={styles.price}>Rs. {item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity style={styles.qBtn} onPress={() => updateQuantity(item._id, item.quantity - 1)}>
          <Text style={styles.qText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qValue}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qBtn} onPress={() => updateQuantity(item._id, item.quantity + 1)}>
          <Text style={styles.qText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.headerSubtitle}>{cartItems.length} items</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cart-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Looks like you haven't added any food yet.</Text>
          <PremiumButton 
            title="Browse Restaurants" 
            onPress={() => navigation.navigate('Home')}
            style={{ width: '80%', marginTop: 16 }}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item._id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Sticky Bottom Footer */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total Amount</Text>
              <Text style={styles.totalValue}>Rs. {getCartTotal().toFixed(2)}</Text>
            </View>
            <PremiumButton 
              title="Proceed to Checkout" 
              onPress={() => navigation.navigate('Checkout')}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textDark },
  headerSubtitle: { fontSize: 14, color: COLORS.textMedium, marginTop: 4, fontWeight: '500' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginBottom: 10 },
  emptySub: { fontSize: 15, color: COLORS.textMedium, textAlign: 'center', marginBottom: 20 },

  listContent: { padding: 16, paddingBottom: 120 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3
  },
  cartImage: { width: 75, height: 75, borderRadius: 14, marginRight: 14, backgroundColor: COLORS.border },
  cardInfo: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 6, paddingRight: 10 },
  price: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },

  quantityControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary, borderRadius: 14, paddingHorizontal: 6, paddingVertical: 6 },
  qBtn: { backgroundColor: COLORS.surface, width: 34, height: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 17, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 },
  qText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  qValue: { marginHorizontal: 12, fontSize: 16, fontWeight: '700', color: COLORS.textDark, width: 24, textAlign: 'center' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 15
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  totalText: { fontSize: 16, color: COLORS.textMedium, fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
});

export default CartScreen;
