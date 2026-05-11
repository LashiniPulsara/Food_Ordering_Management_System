import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { COLORS } from '../../theme/colors';

const RoleSelectionScreen = ({ navigation }) => {
  const handleSelectRole = (role) => {
    navigation.navigate('Register', { role });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.logoEmoji}>🍽️</Text>
        <Text style={styles.title}>Join <Text style={{ color: COLORS.primary }}>WMTFOOD</Text></Text>
        <Text style={styles.subtitle}>Choose how you want to use the app.</Text>
      </View>

      {/* Role Cards */}
      <View style={styles.cardsContainer}>

        {/* Customer Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleSelectRole('customer')}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="cart-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Order food</Text>
            <Text style={styles.cardDescription}>
              Get food delivery to your doorstep.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Restaurant Owner Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleSelectRole('restaurantOwner')}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="restaurant-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Partner with us</Text>
            <Text style={styles.cardDescription}>
              List your restaurant and reach new customers.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Delivery Rider Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleSelectRole('deliveryRider')}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="bicycle-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Deliver with us</Text>
            <Text style={styles.cardDescription}>
              Earn money by delivering food to customers.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
        </TouchableOpacity>

      </View>

      {/* Footer */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.loginLink}
      >
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginHighlight}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 40,
    marginTop: 20,
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMedium,
  },
  cardsContainer: {
    flex: 1,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textMedium,
    lineHeight: 20,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginText: {
    fontSize: 16,
    color: COLORS.textMedium,
  },
  loginHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default RoleSelectionScreen;
