import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BRAND_COLORS } from '../constants/theme';

interface MascotProps {
  size?: number;
  showRing?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const HiHubbleMascot = ({
  size = 36,
  showRing = true,
  style,
}: MascotProps) => {
  const outerSize = size + (showRing ? 8 : 0);

  return (
    <View
      style={[
        styles.container,
        showRing && styles.ring,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.innerCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: size * 0.85, height: size * 0.85 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BRAND_COLORS.purpleLight,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  innerCircle: {
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default HiHubbleMascot;
