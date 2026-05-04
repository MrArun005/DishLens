import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator, Alert,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

// Pointing to your live production Render API!
const API_URL = 'https://dishlens-be.onrender.com';

const TAG_COLORS = {
  Veg:        { bg: '#E8F5E9', text: '#2E7D32' },
  'Non-Veg':  { bg: '#FFEBEE', text: '#C62828' },
  Vegan:      { bg: '#E0F2F1', text: '#00695C' },
  Mild:       { bg: '#FFF8E1', text: '#F57F17' },
  Medium:     { bg: '#FFF3E0', text: '#E65100' },
  Spicy:      { bg: '#FCE4EC', text: '#880E4F' },
  Popular:    { bg: '#EDE7F6', text: '#4527A0' },
  Gluten:     { bg: '#F3E5F5', text: '#6A1B9A' },
};

function Tag({ label }) {
  const colors = TAG_COLORS[label] || { bg: '#F5F5F5', text: '#555' };
  return (
    <View style={[styles.tag, { backgroundColor: colors.bg }]}>
      <Text style={[styles.tagText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function DishCard({ dish, index, sourceLang }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 400,
      delay: index * 80, useNativeDriver: true,
    }).start();
  }, []);

  const tags = [
    dish.type,
    dish.spiceLevel,
    dish.isPopular && 'Popular',
    dish.isVegan && 'Vegan',
    dish.hasGluten && 'Gluten',
  ].filter(Boolean);

  const speakName = () => {
    Speech.speak(dish.name, { language: sourceLang || 'en' });
  };

  return (
    <Animated.View style={[styles.card, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.titleWithAudio}>
              <Text style={styles.dishName}>{dish.name}</Text>
              <TouchableOpacity onPress={speakName} style={styles.audioBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="volume-medium" size={20} color="#777" />
              </TouchableOpacity>
            </View>
            {dish.price && <Text style={styles.price}>{dish.price}</Text>}
          </View>
          {dish.translated && dish.translated !== dish.name && (
            <Text style={styles.translatedName}>{dish.translated}</Text>
          )}
        </View>

        <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
          {dish.description}
        </Text>

        {expanded && dish.ingredients && (
          <Text style={styles.ingredients}>
            <Text style={styles.ingredientsLabel}>Key ingredients: </Text>
            {dish.ingredients.join(', ')}
          </Text>
        )}

        <View style={styles.tagRow}>
          {tags.map(t => <Tag key={t} label={t} />)}
        </View>

        {!expanded && (
          <Text style={styles.expandHint}>Tap for details</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function ShimmerCard() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.shimmerCard, { opacity: anim }]}>
      <View style={styles.shimmerLine1} />
      <View style={styles.shimmerLine2} />
      <View style={styles.shimmerLine3} />
    </Animated.View>
  );
}

export default function ResultsScreen({ route, navigation }) {
  const { imageBase64 } = route.params;
  const [dishes, setDishes] = useState([]);
  const [sourceLang, setSourceLang] = useState('en');
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyzeMenu();
  }, []);

  const analyzeMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/analyze-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to analyze menu (${res.status})`);
      }

      if (!data.dishes?.length) throw new Error('No dishes found. Try a clearer photo.');
      setDishes(data.dishes);
      if (data.sourceLang) setSourceLang(data.sourceLang);
    } catch (err) {
      setError(err.message);
      Alert.alert('Analysis failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDishes = dishes.filter(dish => {
    if (filterType === 'All') return true;
    if (filterType === 'Veg') return dish.type === 'Veg' || dish.type === 'Vegan' || dish.isVegan;
    if (filterType === 'Vegan') return dish.type === 'Vegan' || dish.isVegan;
    if (filterType === 'Gluten-Free') return !dish.hasGluten;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Insights</Text>
        {!loading && (
          <TouchableOpacity onPress={analyzeMenu} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {loading && (
          <>
            <View style={styles.loadingBanner}>
              <ActivityIndicator color="#1A1A1A" size="small" />
              <Text style={styles.loadingText}>Analyzing your menu…</Text>
            </View>
            {[1, 2, 3].map(i => <ShimmerCard key={i} />)}
          </>
        )}

        {!loading && error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.errorBtn} onPress={analyzeMenu}>
              <Text style={styles.errorBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <>
            <View style={styles.filterWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                {['All', 'Veg', 'Vegan', 'Gluten-Free'].map(f => {
                  const isActive = filterType === f;
                  return (
                    <TouchableOpacity 
                      key={f} 
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setFilterType(f)}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <Text style={styles.resultCount}>{filteredDishes.length} dishes found</Text>
            {filteredDishes.map((dish, i) => (
              <DishCard key={dish.name + i} dish={dish} index={i} sourceLang={sourceLang} />
            ))}
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#FAFAF8', borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 22, color: '#1A1A1A' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  retryBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: '#F0F0F0', borderRadius: 8,
  },
  retryBtnText: { fontSize: 13, color: '#555', fontWeight: '500' },

  scroll: { padding: 20, paddingBottom: 40 },

  resultCount: {
    fontSize: 13, color: '#888', fontWeight: '500',
    letterSpacing: 0.4, marginBottom: 16,
    textTransform: 'uppercase',
  },

  filterWrapper: { marginBottom: 20, marginHorizontal: -20 },
  filterContainer: { paddingHorizontal: 20, gap: 10 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#EFEFEF',
  },
  filterChipActive: { backgroundColor: '#1A1A1A' },
  filterChipText: { fontSize: 14, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#FFF' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#EFEFEF',
  },
  cardHeader: { marginBottom: 8 },
  cardTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  titleWithAudio: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  dishName: {
    fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginRight: 8,
  },
  audioBtn: { padding: 4 },
  price: { fontSize: 16, fontWeight: '600', color: '#444' },
  translatedName: {
    fontSize: 13, color: '#999', marginTop: 2, fontStyle: 'italic',
  },
  description: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 12 },
  ingredients: { fontSize: 13, color: '#888', marginBottom: 10, lineHeight: 18 },
  ingredientsLabel: { fontWeight: '600', color: '#666' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 12, fontWeight: '600' },
  expandHint: {
    fontSize: 11, color: '#BBB', marginTop: 10, textAlign: 'right',
  },

  loadingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 20, padding: 14, backgroundColor: '#F5F5F5', borderRadius: 12,
  },
  loadingText: { fontSize: 14, color: '#555' },

  shimmerCard: {
    backgroundColor: '#F5F5F5', borderRadius: 18,
    padding: 18, marginBottom: 12, height: 110,
  },
  shimmerLine1: { height: 16, width: '60%', backgroundColor: '#E0E0E0', borderRadius: 8, marginBottom: 10 },
  shimmerLine2: { height: 12, width: '90%', backgroundColor: '#E8E8E8', borderRadius: 8, marginBottom: 8 },
  shimmerLine3: { height: 12, width: '75%', backgroundColor: '#E8E8E8', borderRadius: 8 },

  errorBox: {
    padding: 24, alignItems: 'center',
    backgroundColor: '#FFF8F8', borderRadius: 18,
    borderWidth: 1, borderColor: '#FFE0E0',
  },
  errorText: { fontSize: 15, color: '#C62828', textAlign: 'center', marginBottom: 16 },
  errorBtn: {
    backgroundColor: '#1A1A1A', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  errorBtnText: { color: '#FFF', fontWeight: '600' },
});
