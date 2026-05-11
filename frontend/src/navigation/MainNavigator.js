import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

// Import Screens
import HomeScreen from '../screens/home/HomeScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminCategoryScreen from '../screens/admin/AdminCategoryScreen';
import AdminRestaurantScreen from '../screens/admin/AdminRestaurantScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import OwnerMenuScreen from '../screens/owner/OwnerMenuScreen';
import OwnerOrdersScreen from '../screens/owner/OwnerOrdersScreen';
import EditRestaurantScreen from '../screens/owner/EditRestaurantScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import OrderHistoryScreen from '../screens/order/OrderHistoryScreen';
import CartScreen from '../screens/order/CartScreen';
import RestaurantListScreen from '../screens/restaurant/RestaurantListScreen';
import RestaurantDetailsScreen from '../screens/restaurant/RestaurantDetailsScreen';
import TableReservationScreen from '../screens/reservation/TableReservationScreen';
import CheckoutScreen from '../screens/order/CheckoutScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';
import DeliveryDashboardScreen from '../screens/delivery/DeliveryDashboardScreen';
import PaymentHistoryScreen from '../screens/order/PaymentHistoryScreen';
import MyReservationsScreen from '../screens/reservation/MyReservationsScreen';
import OwnerReservationsScreen from '../screens/owner/OwnerReservationsScreen';
import RestaurantReviewsScreen from '../screens/restaurant/RestaurantReviewsScreen';
import OwnerReviewsScreen from '../screens/owner/OwnerReviewsScreen';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  const { userInfo } = useContext(AuthContext);
  const isAdmin = userInfo?.role === 'admin';
  const isRestaurantOwner = userInfo?.role === 'restaurantOwner';
  const isDeliveryRider = userInfo?.role === 'deliveryRider';

  let initialRouteName = 'Home';
  if (isAdmin) initialRouteName = 'AdminDashboard';
  if (isRestaurantOwner) initialRouteName = 'OwnerDashboard';
  if (isDeliveryRider) initialRouteName = 'DeliveryDashboard';

  return (
    <Stack.Navigator 
        initialRouteName={initialRouteName}
        screenOptions={{
            headerShown: false, // We will use custom headers in screens for a website-like feel
            contentStyle: { backgroundColor: '#f4f6f8' }
        }}
    >
      {/* Customer Routes */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="RestaurantList" component={RestaurantListScreen} options={{ headerShown: true, title: 'Restaurants' }} />
      <Stack.Screen name="RestaurantDetails" component={RestaurantDetailsScreen} options={{ headerShown: true, title: 'Menu' }} />
      <Stack.Screen name="TableReservation" component={TableReservationScreen} options={{ headerShown: true, title: 'Reserve Table' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true, title: 'My Cart' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: true, title: 'Checkout' }} />
      <Stack.Screen name="Orders" component={OrderHistoryScreen} options={{ headerShown: true, title: 'My Orders' }} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ headerShown: true, title: 'Payment History' }} />
      <Stack.Screen name="MyReservations" component={MyReservationsScreen} options={{ headerShown: true, title: 'My Reservations' }} />
      <Stack.Screen name="RestaurantReviews" component={RestaurantReviewsScreen} options={{ headerShown: false }} />

      {/* Owner Routes */}
      <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
      <Stack.Screen name="OwnerMenu" component={OwnerMenuScreen} options={{ headerShown: true, title: 'Manage Menu' }} />
      <Stack.Screen name="OwnerOrders" component={OwnerOrdersScreen} options={{ headerShown: true, title: 'Manage Orders' }} />
      <Stack.Screen name="OwnerReservations" component={OwnerReservationsScreen} options={{ headerShown: true, title: 'Reservations' }} />
      <Stack.Screen name="OwnerReviews" component={OwnerReviewsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditRestaurant" component={EditRestaurantScreen} options={{ headerShown: true, title: 'Edit Details' }} />

      {/* Admin Routes */}
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminCategories" component={AdminCategoryScreen} />
      <Stack.Screen name="AdminRestaurants" component={AdminRestaurantScreen} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />

      {/* Delivery Rider Routes */}
      <Stack.Screen name="DeliveryDashboard" component={DeliveryDashboardScreen} />

      {/* Common Routes */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'My Profile' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: true, title: 'Change Password' }} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
