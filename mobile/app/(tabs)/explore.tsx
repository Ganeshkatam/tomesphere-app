import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TextInput, Image, TouchableOpacity, RefreshControl, Dimensions, StatusBar } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase, Book } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_WIDTH = (width - 48 - (COLUMN_COUNT - 1) * 12) / COLUMN_COUNT;

export default function ExploreScreen() {
    const [books, setBooks] = useState<Book[]>([]);
    const [search, setSearch] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string>('All');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchBooks();
    }, []);

    async function fetchBooks() {
        const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
        if (data) setBooks(data);
        setRefreshing(false);
    }

    const filteredBooks = books.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.author.toLowerCase().includes(search.toLowerCase());
        const matchesGenre = selectedGenre === 'All' || b.genre === selectedGenre;
        return matchesSearch && matchesGenre;
    });

    const genres = ['All', 'Fiction', 'Sci-Fi', 'Romance', 'Mystery', 'History', 'Tech'];

    const renderBook = ({ item, index }: { item: Book, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 50)} style={{ width: CARD_WIDTH, marginBottom: 16 }}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/book/${item.id}` as any);
                }}
                style={styles.bookCard}
            >
                <Image source={{ uri: item.cover_url || '' }} style={styles.bookCover} />
                <View style={styles.bookMeta}>
                    <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover</Text>
                <Text style={styles.headerSubtitle}>Find your next obsession.</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput
                    placeholder="Search by title, author..."
                    placeholderTextColor="#64748b"
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <View style={styles.genreContainer}>
                <FlatList
                    horizontal
                    data={genres}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.genreList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.selectionAsync();
                                setSelectedGenre(item);
                            }}
                            style={[
                                styles.genreButton,
                                selectedGenre === item && styles.genreButtonActive
                            ]}
                        >
                            <Text style={[
                                styles.genreText,
                                selectedGenre === item && styles.genreTextActive
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            <FlatList
                data={filteredBooks}
                renderItem={renderBook}
                keyExtractor={item => item.id}
                numColumns={COLUMN_COUNT}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBooks(); }} tintColor="#4f46e5" />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Deep Canvas
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
    },
    headerTitle: {
        fontSize: 40,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 16,
        marginHorizontal: 24,
        paddingHorizontal: 16,
        height: 56,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    genreContainer: {
        marginVertical: 24,
    },
    genreList: {
        paddingHorizontal: 24,
        gap: 12,
    },
    genreButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    genreButtonActive: {
        backgroundColor: '#fff',
    },
    genreText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
    genreTextActive: {
        color: '#0f172a',
        fontWeight: '700',
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    bookCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        overflow: 'hidden',
    },
    bookCover: {
        width: '100%',
        aspectRatio: 2 / 3,
        resizeMode: 'cover',
    },
    bookMeta: {
        padding: 8,
    },
    bookTitle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 2,
    },
    bookAuthor: {
        color: '#94a3b8',
        fontSize: 9,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.6)',
        marginTop: 16,
    },
});
