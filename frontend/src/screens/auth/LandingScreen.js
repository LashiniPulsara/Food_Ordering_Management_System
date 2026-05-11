import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400',
  'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?q=80&w=400',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=400',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=400',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=400'
];

const Stripe = ({ images, duration, reverse }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateY, {
        toValue: reverse ? 1000 : -1000,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [duration, reverse]);

  return (
    <View style={styles.stripeWrapper}>
      <Animated.View style={[styles.stripeInner, { transform: [{ translateY }] }]}>
        {[...images, ...images, ...images, ...images, ...images].map((src, i) => (
          <Image key={i} source={{ uri: src }} style={styles.foodPhoto} />
        ))}
      </Animated.View>
    </View>
  );
};

const LandingScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <View style={styles.stripesGrid}>
          <Stripe images={FOOD_IMAGES.slice(0, 4)} duration={40000} reverse={false} />
          <Stripe images={FOOD_IMAGES.slice(4, 8)} duration={35000} reverse={true} />
          <Stripe images={[...FOOD_IMAGES].reverse().slice(0, 4)} duration={45000} reverse={false} />
          <Stripe images={[...FOOD_IMAGES].reverse().slice(4, 8)} duration={30000} reverse={true} />
          <Stripe images={FOOD_IMAGES.slice(2, 6)} duration={42000} reverse={false} />
        </View>
        <View style={styles.overlay} />
      </View>

      <SafeAreaView style={styles.contentSafeArea}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🍽️</Text>
            <Text style={styles.logoText}>WMT<Text style={{ color: COLORS.primary }}>FOOD</Text></Text>
          </View>

          <View style={styles.bottomSection}>
            <Text style={styles.title}>Get food delivery to your doorstep.</Text>
            <Text style={styles.subtitle}>Order from your favorite restaurants, fast and easy.</Text>

            <TouchableOpacity 
              onPress={() => navigation.navigate('RoleSelection')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
  },
  stripesGrid: {
    flexDirection: 'row',
    width: width * 2.5,
    height: height * 2.5,
    transform: [{ rotate: '-45deg' }, { scale: 1.1 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stripeWrapper: {
    width: 130,
    marginHorizontal: 10,
    height: height * 6,
    overflow: 'hidden',
  },
  stripeInner: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  foodPhoto: {
    width: 130,
    height: 180,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: COLORS.border,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  contentSafeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.textDark,
    letterSpacing: -1,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  bottomSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.textDark,
    lineHeight: 46,
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textMedium,
    fontWeight: '600',
    marginBottom: 40,
    lineHeight: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryButtonText: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.textDark,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default LandingScreen;
