import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const MOCK_DECKS = [
    { id: '1', title: 'Calculus Derivatives', cards: 45, mastery: 80, color: '#f59e0b' },
    { id: '2', title: 'French Vocabulary', cards: 120, mastery: 45, color: '#ec4899' },
    { id: '3', title: 'Physics Formulas', cards: 30, mastery: 95, color: '#06b6d4' },
];

export default function ExamPrepScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{
                title: 'Brain Boost',
                headerShown: true,
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '800' }
            }} />

            <ScrollView contentContainerStyle={styles.content}>

                {/* Daily Goal Card */}
                <Animated.View entering={FadeInUp.delay(100)} style={styles.goalCard}>
                    <LinearGradient
                        colors={['#ef4444', '#f87171']}
                        style={styles.goalGradient}
                    >
                        <View>
                            <Text style={styles.goalLabel}>DAILY GOAL</Text>
                            <Text style={styles.goalValue}>15 / 30 mins</Text>
                        </View>
                        <View style={styles.goalRing}>
                            <Ionicons name="flame" size={32} color="white" />
                        </View>
                    </LinearGradient>
                </Animated.View>

                <Text style={styles.sectionTitle}>YOUR DECKS</Text>

                {MOCK_DECKS.map((deck, i) => (
                    <Animated.View
                        key={deck.id}
                        entering={FadeInUp.delay(200 + i * 100)}
                        style={styles.deckRow}
                    >
                        <TouchableOpacity
                            style={styles.deckCard}
                            activeOpacity={0.9}
                            onPress={() => Haptics.selectionAsync()}
                        >
                            <View style={[styles.deckIcon, { backgroundColor: `${deck.color}20` }]}>
                                <Ionicons name="layers" size={24} color={deck.color} />
                            </View>

                            <View style={styles.deckInfo}>
                                <Text style={styles.deckTitle}>{deck.title}</Text>
                                <Text style={styles.deckMeta}>{deck.cards} cards • {deck.mastery}% Mastery</Text>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${deck.mastery}%`, backgroundColor: deck.color }]} />
                                </View>
                            </View>

                            <Ionicons name="play-circle" size={32} color="#fff" />
                        </TouchableOpacity>
                    </Animated.View>
                ))}

            </ScrollView>

            {/* Quick Start Button */}
            <TouchableOpacity
                style={styles.startBtn}
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
            >
                <Text style={styles.startBtnText}>QUICK STUDY SESSION</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        padding: 24,
    },
    goalCard: {
        height: 120,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 32,
    },
    goalGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    goalLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 1,
    },
    goalValue: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
    },
    goalRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    deckRow: {
        marginBottom: 16,
    },
    deckCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    deckIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    deckInfo: {
        flex: 1,
        marginRight: 16,
    },
    deckTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    deckMeta: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#334155',
        borderRadius: 2,
        width: '100%',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    startBtn: {
        margin: 24,
        backgroundColor: '#fff',
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startBtnText: {
        color: '#0f172a',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    }
});
