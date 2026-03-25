import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain } from 'lucide-react-native';
import { COLORS } from '../utils/theme';

export default function LoadingScreen() {
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const fadeValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeValue, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinReverse = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeValue }]}>
      {/* Top Gradient Header */}
      <LinearGradient
        colors={['#84B1F9', '#87E5D0']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoRow}>
          <Brain size={42} color={COLORS.primary} style={{ marginRight: 12 }} />
          <Text style={styles.logoText}>AI Prep</Text>
        </View>

        {/* Animated Circular Loader */}
        <View style={styles.loaderContainer}>
          <Animated.View style={[styles.outerRing, { transform: [{ rotate: spin }] }]} />
          <Animated.View style={[styles.innerRing, { transform: [{ rotate: spinReverse }] }]} />
          <Animated.View style={[styles.mainRing, { transform: [{ rotate: spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} />
          <Text style={styles.loadingText}>LOADING...</Text>
        </View>
      </View>
      
      {/* Bottom accent */}
      <View style={styles.bottomAccent} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '28%',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  content: {
    alignItems: 'center',
    marginTop: -50,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 64,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  loaderContainer: {
    width: 192,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 96,
    borderWidth: 5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  innerRing: {
    position: 'absolute',
    width: '85%',
    height: '85%',
    borderRadius: 82,
    borderWidth: 4,
    borderColor: '#10B981',
    borderStyle: 'dotted',
    opacity: 0.6,
  },
  mainRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 96,
    borderWidth: 5,
    borderColor: 'transparent',
    borderTopColor: COLORS.primary,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 2,
    zIndex: 10,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 48,
    width: '33%',
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
  },
});
