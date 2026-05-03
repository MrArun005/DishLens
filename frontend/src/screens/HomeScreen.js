import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  StatusBar,
} from 'react-native';

const RECENT_SCANS = [
  { id: 1, name: 'Dal Makhani', restaurant: 'Punjabi Dhaba', time: '2h ago' },
  { id: 2, name: 'Pho Bo', restaurant: 'Saigon Kitchen', time: 'Yesterday' },
  { id: 3, name: 'Tagliatelle al Ragù', restaurant: 'Trattoria Roma', time: '3d ago' },
];

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.appName}>MenuLens</Text>
          <Text style={styles.tagline}>Understand any menu, anywhere</Text>
        </Animated.View>

        {/* Main CTA */}
        <Animated.View style={[styles.ctaWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('Camera')}
            activeOpacity={0.85}
          >
            <View style={styles.scanIcon}>
              <View style={styles.scanIconInner} />
            </View>
            <Text style={styles.scanButtonText}>Scan Menu</Text>
            <Text style={styles.scanButtonSub}>Point at any menu to get started</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent scans */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          {RECENT_SCANS.map((item, index) => (
            <TouchableOpacity key={item.id} style={styles.recentCard} activeOpacity={0.7}>
              <View style={styles.recentLeft}>
                <View style={styles.recentDot} />
                <View>
                  <Text style={styles.recentDish}>{item.name}</Text>
                  <Text style={styles.recentRestaurant}>{item.restaurant}</Text>
                </View>
              </View>
              <Text style={styles.recentTime}>{item.time}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  scroll: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  ctaWrapper: {
    marginBottom: 40,
  },
  scanButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  scanIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scanIconInner: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scanButtonSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    marginTop: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  recentDish: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  recentRestaurant: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  recentTime: {
    fontSize: 12,
    color: '#BBBBB',
  },
});
