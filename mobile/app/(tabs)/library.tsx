import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, Dimensions, StatusBar, View, Text } from 'react-native';
import { supabase, Book } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/Colors';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const GAP = 16;
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width - 48 - GAP) / COLUMN_COUNT;

interface LibraryBook extends Book {
    reading_status: string;
}

const TABS = [
    { key: 'currently_reading', label: 'Reading' },
    { key: 'want_to_read', label: 'Wishlist' },
    { key: 'finished', label: 'Done' },
];

export default function LibraryScreen() {
    const [books, setBooks] = useState<LibraryBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('currently_reading');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => { checkAuth(); }, []);

    async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            fetchLibrary(user.id);
        } else {
            setLoading(false);
        }
    }

    async function fetchLibrary(uid: string) {
        try {
            const { data, error } = await supabase
                .from('reading_lists')
                .select(`status, books (*)`)
                .eq('user_id', uid);

            if (error) throw error;

            const libraryBooks = (data || []).map((item: any) => ({
                ...item.books,
                reading_status: item.status,
            }));
            setBooks(libraryBooks);
        } catch (error: any) {
            console.error('Library Error:', error);
            const { AppAlert } = require('@/lib/alerts');
            AppAlert.error(error.message || 'Failed to sync library', 'Sync Error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const handleTabPress = (key: string) => {
        Haptics.selectionAsync();
        setActiveTab(key);
    };

    const filteredBooks = books.filter(b => b.reading_status === activeTab);

    const renderBook = ({ item, index }: { item: LibraryBook; index: number }) => (
        <Animated.View
            layout={Layout.springify()}
            entering={FadeInDown.delay(index * 50)}
            style={styles.bookWrapper}
        >
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); router.push(`/book/${item.id}` as any); }}
                style={styles.bookCard}
            >
                <Image
                    source={{ uri: item.cover_url || 'https://via.placeholder.com/150' }}
                    style={styles.bookCover}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(15,23,42,0.9)']}
                    style={styles.cardGradient}
                >
                    <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    if (!userId) {
        return (
            <View style={styles.centerContainer}>
                <StatusBar barStyle="light-content" />
                <Text style={{ color: 'white' }}>Please Sign In</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[Palette.bgCanvas, Palette.surface1]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Library</Text>
                <Text style={styles.headerSubtitle}>{books.length} Books Collection</Text>
            </View>

            <AnimatedTabBar
                tabs={TABS}
                activeTab={activeTab}
                onTabPress={handleTabPress}
            />

            <FlatList
                data={filteredBooks}
                renderItem={renderBook}
                keyExtractor={(item) => item.id}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={{ gap: GAP }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLibrary(userId); }} tintColor={Palette.primary} />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="book-outline" size={48} color={Palette.surface2} />
                            <Text style={styles.emptyText}>No books in this list yet.</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.bgCanvas },
    centerContainer: { flex: 1, backgroundColor: Palette.bgCanvas, justifyContent: 'center', alignItems: 'center' },

    header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24 },
    headerTitle: { fontSize: 34, fontWeight: '900', color: Palette.textHigh },
    headerSubtitle: { fontSize: 14, color: Palette.textMed, marginTop: 4 },

    listContent: { paddingHorizontal: 24, paddingBottom: 100 },
    bookWrapper: { width: CARD_WIDTH, marginBottom: GAP },

    bookCard: { borderRadius: 16, overflow: 'hidden', height: CARD_WIDTH * 1.5, backgroundColor: Palette.surface1, elevation: 5 },
    bookCover: { width: '100%', height: '100%' },
    cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, paddingTop: 40 },

    bookTitle: { color: 'white', fontWeight: '700', fontSize: 13, marginBottom: 2 },
    bookAuthor: { color: Palette.textMed, fontSize: 11 },

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: Palette.textMed, marginTop: 16 }
});
