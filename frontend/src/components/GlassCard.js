import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../theme/colors';
import { globalStyles } from '../theme/globalStyles';

const GlassCard = ({ children, style, onPress, intensity = 50, tint = 'light' }) => {
  const content = (
    <BlurView intensity={intensity} tint={tint} style={[styles.blurContainer, style]}>
      {children}
    </BlurView>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[globalStyles.softShadow, styles.cardContainer, style]}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[globalStyles.softShadow, styles.cardContainer, style]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  blurContainer: {
    padding: 20,
    borderRadius: 20,
  }
});

export default GlassCard;
