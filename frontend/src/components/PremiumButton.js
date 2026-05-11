import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../theme/colors';
import { globalStyles } from '../theme/globalStyles';

const PremiumButton = ({ 
  title, 
  onPress, 
  variant = 'primary', // primary, outline, text
  size = 'large',       // large, medium, small
  disabled = false,
  style,
  icon
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const getHeight = () => {
    if (size === 'small') return 40;
    if (size === 'medium') return 48;
    return 56;
  };

  const getFontSize = () => {
    if (size === 'small') return 14;
    return 16;
  };

  if (variant === 'outline') {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity 
          onPress={onPress} 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={0.8}
          style={[
            styles.outlineContainer,
            { height: getHeight() },
            disabled && styles.disabledOutline
          ]}
        >
          {icon && icon}
          <Text style={[
            styles.outlineText, 
            { fontSize: getFontSize(), marginLeft: icon ? 8 : 0 },
            disabled && styles.disabledText
          ]}>{title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
        style={[globalStyles.shadow, { borderRadius: 16 }]}
      >
        <LinearGradient
          colors={disabled ? ['#E5E7EB', '#D1D5DB'] : GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.primaryContainer, { height: getHeight() }]}
        >
          {icon && icon}
          <Text style={[
            styles.primaryText, 
            { fontSize: getFontSize(), marginLeft: icon ? 8 : 0 },
            disabled && styles.disabledTextWhite
          ]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  primaryContainer: {
    width: '100%',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryText: {
    color: COLORS.textWhite,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outlineContainer: {
    width: '100%',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  outlineText: {
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledOutline: {
    borderColor: '#D1D5DB',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  disabledTextWhite: {
    color: '#9CA3AF',
  }
});

export default PremiumButton;
