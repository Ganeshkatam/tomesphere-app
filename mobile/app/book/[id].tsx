import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Dimensions, TextInput, StatusBar } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase, Book } from '@/lib/supabase';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function BookDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'discuss'>('details');
    const [reviews, setReviews] = useState<any[]>([]);

    // Animation Values
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler(event => {
        scrollY.value = event.contentOffset.y;
    });

    useEffect(() => {
        fetchBook();
        fetchReviews();
    }, [id]);

    async function fetchBook() {
        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            setBook(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchReviews() {
        // Mock data for UI demo
        setReviews([
            { id: 1, user: 'Alex', rating: 5, text: 'Mind-blowing read! The ending was unexpected.', date: '2d ago' },
            { id: 2, user: 'Sarah', rating: 4, text: 'Great concepts, but a bit dense in the middle.', date: '1w ago' }
        ]);
    }

    const headerStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(scrollY.value, [0, 200], [1, 0], Extrapolate.CLAMP),
            transform: [
                { translateY: interpolate(scrollY.value, [0, 200], [0, 50], Extrapolate.CLAMP) }
            ]
        };
    });

    if (loading || !book) {
        return (
            <View style={styles.containerCenter}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Floating Back Button */}
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
            >
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Parallax Hero Section */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{ uri: book.cover_url || 'https://via.placeholder.com/300x450' }}
                        style={styles.heroBg}
                        blurRadius={20}
                    />
                    <LinearGradient
                        colors={['transparent', '#0f172a']}
                        style={styles.heroGradient}
                    />

                    <Animated.View style={[styles.heroContent, headerStyle]}>
                        <Animated.Image
                            entering={FadeInDown.delay(200)}
                            source={{ uri: book.cover_url || 'https://via.placeholder.com/300x450' }}
                            style={styles.bookPoster}
                        />
                    </Animated.View>
                </View>

                {/* Content Body */}
                <View style={styles.bodyContainer}>
                    <Animated.Text entering={FadeInUp.delay(300)} style={styles.title}>
                        {book.title}
                    </Animated.Text>
                    <Animated.Text entering={FadeInUp.delay(400)} style={styles.author}>
                        {book.author}
                    </Animated.Text>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.readButton}
                            onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
                        >
                            <Ionicons name="book" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.readButtonText}>Read Now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="bookmark-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Bento Tabs */}
                    <View style={styles.tabRow}>
                        {['details', 'reviews', 'discuss'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setActiveTab(tab as any);
                                }}
                                style={[styles.tab, activeTab === tab && styles.tabActive]}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tab Content */}
                    {activeTab === 'details' && (
                        <Animated.View entering={FadeInDown}>
                            <Text style={styles.description}>{book.description}</Text>

                            <View style={styles.statsGrid}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>GENRE</Text>
                                    <Text style={styles.statValue}>{book.genre || 'N/A'}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>LENGTH</Text>
                                    <Text style={styles.statValue}>{book.pages || 'Unknown'} pgs</Text>
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    {activeTab === 'reviews' && (
                        <Animated.View entering={FadeInDown}>
                            <View style={styles.ratingSummary}>
                                <Text style={styles.bigRating}>4.8</Text>
                                <View>
                                    <View style={{ flexDirection: 'row' }}>
                                        {[1, 2, 3, 4, 5].map(i => <Ionicons key={i} name="star" size={14} color="#fbbf24" />)}
                                    </View>
                                    <Text style={styles.ratingCount}>128 reviews</Text>
                                </View>
                            </View>

                            {reviews.map((review, i) => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={styles.reviewUser}>{review.user}</Text>
                                        <Text style={styles.reviewDate}>{review.date}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                        {[...Array(review.rating)].map((_, i) => (
                                            <Ionicons key={i} name="star" size={12} color="#fbbf24" />
                                        ))}
                                    </View>
                                    <Text style={styles.reviewText}>{review.text}</Text>
                                </View>
                            ))}
                        </Animated.View>
                    )}
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Deep Canvas
    },
    containerCenter: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 24,
        zIndex: 50,
        width: 44,
        height: 44,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 14, // Bento rounding
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    heroContainer: {
        height: 400,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroBg: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.5,
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    heroContent: {
        alignItems: 'center',
        marginTop: 60,
    },
    bookPoster: {
        width: 180,
        height: 270,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: '#1e293b',
    },
    bodyContainer: {
        paddingHorizontal: 24,
        minHeight: 500,
        marginTop: -40,
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    author: {
        color: '#94a3b8',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 32,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    readButton: {
        flex: 1,
        backgroundColor: '#4f46e5',
        height: 56,
        borderRadius: 20, // Bento
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    readButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    iconButton: {
        width: 56,
        height: 56,
        backgroundColor: '#1e293b',
        borderRadius: 20, // Bento
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        padding: 4,
        borderRadius: 16,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    tabActive: {
        backgroundColor: '#334155',
    },
    tabText: {
        color: '#94a3b8',
        fontWeight: '600',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: '800',
    },
    description: {
        color: '#cbd5e1',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    statLabel: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 4,
    },
    statValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    ratingSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 20,
    },
    bigRating: {
        fontSize: 40,
        fontWeight: '900',
        color: '#fff',
        marginRight: 16,
    },
    ratingCount: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 4,
    },
    reviewCard: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    reviewUser: {
        color: '#fff',
        fontWeight: '700',
    },
    reviewDate: {
        color: '#64748b',
        fontSize: 12,
    },
    reviewText: {
        color: '#cbd5e1',
        lineHeight: 20,
    }
});
