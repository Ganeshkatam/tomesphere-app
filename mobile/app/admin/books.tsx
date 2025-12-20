import { useState, useEffect } from 'react';
import {
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase, Book } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function AdminBooks() {
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'new' | 'featured'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    useEffect(() => {
        filterBooks();
    }, [searchTerm, filter, books]);

    async function fetchBooks() {
        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBooks(data || []);
        } catch (error) {
            console.error('Error fetching books:', error);
            Alert.alert('Error', 'Failed to fetch books');
        } finally {
            setLoading(false);
        }
    }

    function filterBooks() {
        let result = books;

        if (filter === 'new') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            result = result.filter(b => new Date(b.created_at) >= sevenDaysAgo);
        } else if (filter === 'featured') {
            result = result.filter(b => b.is_featured);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                b =>
                    b.title.toLowerCase().includes(term) ||
                    b.author.toLowerCase().includes(term)
            );
        }

        setFilteredBooks(result);
    }

    async function handleToggleFeatured(book: Book) {
        Haptics.selectionAsync();
        try {
            const { error } = await supabase
                .from('books')
                .update({ is_featured: !book.is_featured })
                .eq('id', book.id);

            if (error) throw error;
            setBooks(prev =>
                prev.map(b => (b.id === book.id ? { ...b, is_featured: !b.is_featured } : b))
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to update book');
        }
    }

    async function handleDelete(bookId: string) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Delete Book', 'Are you sure? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const { error } = await supabase
                            .from('books')
                            .delete()
                            .eq('id', bookId);

                        if (error) throw error;
                        setBooks(prev => prev.filter(b => b.id !== bookId));
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete book');
                    }
                },
            },
        ]);
    }

    const renderItem = ({ item, index }: { item: Book; index: number }) => (
        <Animated.View entering={FadeInUp.delay(50 * index)} style={styles.card}>
            <Image
                source={{ uri: item.cover_url || 'https://via.placeholder.com/150' }}
                style={styles.cover}
            />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
                <View style={styles.badges}>
                    <View style={styles.genreBadge}>
                        <Text style={styles.genreText}>{item.genre}</Text>
                    </View>
                    {item.is_featured && (
                        <View style={styles.featuredBadge}>
                            <Ionicons name="star" size={10} color="#fbbf24" />
                            <Text style={styles.featuredText}>Featured</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, item.is_featured && styles.activeActionBtn]}
                    onPress={() => handleToggleFeatured(item)}
                >
                    <Ionicons
                        name={item.is_featured ? 'star' : 'star-outline'}
                        size={20}
                        color={item.is_featured ? '#fbbf24' : '#94a3b8'}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/book/${item.id}`)}
                >
                    <Ionicons name="eye-outline" size={20} color="#6366f1" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Book Library</Text>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search titles or authors..."
                        placeholderTextColor="#64748b"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
            </View>

            <View style={styles.tabs}>
                {(['all', 'new', 'featured'] as const).map(f => (
                    <TouchableOpacity
                        key={f}
                        onPress={() => { Haptics.selectionAsync(); setFilter(f); }}
                        style={[styles.tab, filter === f && styles.tabActive]}
                    >
                        <Text style={[styles.tabText, filter === f && styles.activeTabText]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filteredBooks}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="library-outline" size={64} color="#334155" />
                            <Text style={styles.emptyText}>No books found</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => { Haptics.selectionAsync(); router.push('/admin/add-book'); }}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={32} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        padding: 16,
        paddingTop: 20,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRadius: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#334155',
        backgroundColor: '#1e293b',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        color: '#fff',
        fontSize: 16,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 16,
        minWidth: 80,
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
    },
    tabActive: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    tabText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    list: {
        padding: 16,
        paddingTop: 0,
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
        backgroundColor: '#1e293b',
    },
    cover: {
        width: 60,
        height: 90,
        borderRadius: 10,
        marginRight: 16,
        backgroundColor: '#334155',
    },
    info: {
        flex: 1,
        gap: 4,
        marginRight: 8,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    author: {
        color: '#94a3b8',
        fontSize: 14,
    },
    badges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    genreBadge: {
        backgroundColor: 'rgba(99,102,241,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    genreText: {
        color: '#818cf8',
        fontSize: 11,
        fontWeight: '600',
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    featuredText: {
        color: '#fbbf24',
        fontSize: 10,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'column',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    activeActionBtn: {
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
    },
    deleteBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: '#64748b',
        textAlign: 'center',
        marginTop: 16,
        fontSize: 14,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    fabGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
