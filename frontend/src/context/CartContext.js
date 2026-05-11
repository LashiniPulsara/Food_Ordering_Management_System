import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CartContext = createContext();

const CART_ITEMS_KEY = 'cartItems';
const CART_RESTAURANT_KEY = 'cartRestaurantId';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartRestaurantId, setCartRestaurantId] = useState(null);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedItems = await AsyncStorage.getItem(CART_ITEMS_KEY);
        const savedRestaurantId = await AsyncStorage.getItem(CART_RESTAURANT_KEY);
        if (savedItems) {
          setCartItems(JSON.parse(savedItems));
        }
        if (savedRestaurantId) {
          setCartRestaurantId(savedRestaurantId);
        }
      } catch (error) {
        console.log('Error loading cart from storage:', error);
      } finally {
        setCartLoaded(true);
      }
    };
    loadCart();
  }, []);

  // Persist cart to AsyncStorage whenever it changes (after initial load)
  useEffect(() => {
    if (!cartLoaded) return;
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(CART_ITEMS_KEY, JSON.stringify(cartItems));
        if (cartRestaurantId) {
          await AsyncStorage.setItem(CART_RESTAURANT_KEY, cartRestaurantId);
        } else {
          await AsyncStorage.removeItem(CART_RESTAURANT_KEY);
        }
      } catch (error) {
        console.log('Error saving cart to storage:', error);
      }
    };
    saveCart();
  }, [cartItems, cartRestaurantId, cartLoaded]);

  const addToCart = (item, restaurantId) => {
    // If adding from a different restaurant, clear cart first
    if (cartRestaurantId && cartRestaurantId !== restaurantId) {
      setCartItems([{ ...item, quantity: 1}]);
      setCartRestaurantId(restaurantId);
      return;
    }

    setCartRestaurantId(restaurantId);
    
    const existingItem = cartItems.find(i => i._id === item._id);
    if (existingItem) {
      setCartItems(cartItems.map(i => 
        i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item._id !== itemId));
    if (cartItems.length === 1) { // Will become 0
      setCartRestaurantId(null);
    }
  };

  const updateQuantity = (itemId, q) => {
    if (q < 1) {
       removeFromCart(itemId);
       return;
    }
    setCartItems(cartItems.map(i => i._id === itemId ? { ...i, quantity: q } : i));
  };

  const clearCart = async () => {
    setCartItems([]);
    setCartRestaurantId(null);
    try {
      await AsyncStorage.removeItem(CART_ITEMS_KEY);
      await AsyncStorage.removeItem(CART_RESTAURANT_KEY);
    } catch (error) {
      console.log('Error clearing cart storage:', error);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartRestaurantId,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};
