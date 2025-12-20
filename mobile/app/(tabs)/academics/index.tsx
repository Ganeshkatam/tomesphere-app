import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const GAP = 12;

export default function AcademicsScreen() {
    const router = useRouter();

    const features = [
        {
            id: 'study-groups',
            name: 'Study Groups',
            icon: 'people',
            gradient: ['#4f46e5', '#818cf8'],
            description: 'Collaborate with squad',
            route: '/(tabs)/academics/study-groups'
        },
        {
            id: 'textbooks',
            name: 'Textbook Exchange',
            icon: 'book',
            gradient: ['#eab308', '#facc15'],
            description: 'Trade gear & books',
            route: '/(tabs)/academics/textbooks'
        },
        {
            id: 'citations',
            name: 'Citation Gen',
            icon: 'sparkles',
            gradient: ['#f97316', '#fb923c'],
            description: 'Magic references',
            route: '/(tabs)/academics/citations'
        },
        {
            id: 'exam-prep',
            name: 'Brain Boost',
            icon: 'flash',
            gradient: ['#ef4444', '#f87171'],
            description: 'Ace every test',
            route: '/(tabs)/academics/exam-prep'
        }
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                    <Text style={styles.headerTitle}>ACADEMICS</Text>
                    <Text style={styles.headerSubtitle}>Level Up Your Intelligence</Text>
                </Animated.View>

                {/* Featured Card */}
                <Animated.View entering={FadeInDown.delay(200)}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.featuredCard}
                        onPress={() => Haptics.selectionAsync()}
                    >
                        <LinearGradient
                            colors={['#0ea5e9', '#0284c7']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.featuredContent}>
                            <View style={styles.tagBadge}>
                                <Text style={styles.tagText}>UPCOMING EXAM</Text>
                            </View>
                            <Text style={styles.featuredTitle}>Calculus II</Text>
                            <Text style={styles.featuredSubtitle}>3 days left • 85% Prepared</Text>
                        </View>
                        <Ionicons name="calculator" size={100} color="rgba(255,255,255,0.2)" style={styles.bgIcon} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Grid System */}
                <View style={styles.gridContainer}>
                    {features.map((feature, index) => (
                        <Animated.View
                            key={feature.id}
                            entering={FadeInDown.delay(300 + index * 50)}
                            style={styles.gridItem}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    router.push(feature.route as any)
                                }}
                                activeOpacity={0.8}
                                style={styles.bentoCard}
                            >
                                <View style={[styles.iconBox, { backgroundColor: feature.gradient[0] }]}>
                                    <Ionicons name={feature.icon as any} size={24} color="white" />
                                </View>

                                <View>
                                    <Text style={styles.cardTitle}>{feature.name}</Text>
                                    <Text style={styles.cardDesc}>{feature.description}</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Live Activity Feed */}
                <Animated.View entering={FadeInUp.delay(500)} style={styles.feedSection}>
                    <Text style={styles.feedTitle}>LIVE FEED</Text>

                    {[1, 2].map((i) => (
                        <View key={i} style={styles.feedItem}>
                            <View style={[styles.feedDot, { backgroundColor: i === 1 ? '#10b981' : '#f43f5e' }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.feedText}>{i === 1 ? 'John joined Physics 101' : 'New offer: Calculus Book'}</Text>
                                <Text style={styles.feedTime}>2 mins ago</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#64748b" />
                        </View>
                    ))}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Deep Canvas
    },
    scrollContent: {
        paddingTop: 60,
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: 1,
    },
    headerSubtitle: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    featuredCard: {
        marginHorizontal: 24,
        height: 180,
        borderRadius: 24,
        marginBottom: 32,
        overflow: 'hidden',
        position: 'relative',
    },
    featuredContent: {
        padding: 24,
        height: '100%',
        justifyContent: 'center',
    },
    tagBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    tagText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    featuredTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
    },
    featuredSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
        fontWeight: '600',
    },
    bgIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        transform: [{ rotate: '-15deg' }]
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 24,
        gap: GAP,
        marginBottom: 32,
    },
    gridItem: {
        width: (width - 48 - GAP) / 2,
    },
    bentoCard: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 16,
        height: 160,
        justifyContent: 'space-between',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardDesc: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
    },
    feedSection: {
        paddingHorizontal: 24,
    },
    feedTitle: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 16,
        letterSpacing: 1,
    },
    feedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 12,
    },
    feedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    feedText: {
        color: '#e2e8f0',
        fontSize: 13,
        fontWeight: '600',
    },
    feedTime: {
        color: '#64748b',
        fontSize: 11,
    }
});
