import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, Dimensions, StatusBar, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/Colors';
import { ParallaxCarousel } from '@/components/ParallaxCarousel';
import { DailyQuote, StreakCard } from '@/components/DashboardWidgets';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const [books, setBooks] = useState<any[]>([]);
  const [readingList, setReadingList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    // 1. Fetch "Fresh Arrivals" (Newest Books)
    const { data: allBooks } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setBooks(allBooks || []);

    // 2. Fetch "Continue Reading" (Currently Reading)
    if (user) {
      const { data: reading } = await supabase
        .from('reading_lists')
        .select('progress, books(*)')
        .eq('user_id', user.id)
        .eq('status', 'currently_reading')
        .order('updated_at', { ascending: false });

      const formattedReading = reading?.map(item => ({
        ...item.books,
        progress: item.progress || 0 // Default to 0 if null
      })) || [];
      setReadingList(formattedReading);
    }

    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Palette.bgCanvas, Palette.surface1]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Palette.primary} />}
      >
        {/* HEADER: Greeting */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.headerRow}>
          <View>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</Text>
            <Text style={styles.greetingTitle}>Welcome Back</Text>
          </View>
          {user && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
              <Image
                source={{ uri: `https://api.dicebear.com/7.x/initials/png?seed=${user.email}&backgroundColor=6366f1` }}
                style={styles.profileImg}
              />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* WIDGETS ROW (Side by Side potential, or stacked) */}
        {/* For mobile portrait, stacked often looks better or 2-col if small. Let's do Stacked Quote -> Parallax -> Streak for flow */}

        <DailyQuote />

        {/* CONTINUE READING (Parallax) */}
        {readingList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue Reading</Text>
            <ParallaxCarousel data={readingList} />
          </View>
        )}

        {/* STREAK */}
        <StreakCard days={12} />

        {/* FRESH ARRIVALS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fresh Arrivals</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={books}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(300 + (index * 50))} style={{ marginRight: 16 }}>
                <TouchableOpacity onPress={() => { Haptics.selectionAsync(); router.push(`/book/${item.id}` as any); }}>
                  <Image source={{ uri: item.cover_url }} style={styles.bookCover} />
                  <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        </View>

        {/* SPACER */}
        <View style={{ height: 40 }} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.bgCanvas },
  scrollContent: { paddingTop: 60, paddingBottom: 100 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24
  },
  dateText: { color: Palette.textMed, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  greetingTitle: { color: Palette.textHigh, fontSize: 28, fontWeight: '900' },
  profileImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Palette.surface2 },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Palette.textHigh, marginLeft: 24, marginBottom: 12 },
  seeAll: { color: Palette.primary, fontWeight: '700' },

  bookCover: { width: 120, height: 180, borderRadius: 16, marginBottom: 8, backgroundColor: Palette.surface1 },
  bookTitle: { width: 120, fontSize: 13, fontWeight: '600', color: Palette.textHigh }
});
