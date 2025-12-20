import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const MOCK_REQUESTS = [
    { id: '1', name: 'John Doe', university: 'Stanford University', email: 'john@stanford.edu', document: 'https://via.placeholder.com/400x250' },
    { id: '2', name: 'Jane Smith', university: 'MIT', email: 'jane@mit.edu', document: 'https://via.placeholder.com/400x250' },
    { id: '3', name: 'Mike Ross', university: 'Harvard', email: 'mike@harvard.edu', document: 'https://via.placeholder.com/400x250' },
];

export default function VerificationQueue() {
    const [requests, setRequests] = useState(MOCK_REQUESTS);
    const [currentIndex, setCurrentIndex] = useState(0);

    const activeRequest = requests[currentIndex];

    const translateX = useSharedValue(0);
    const cardRotate = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { rotate: `${interpolate(translateX.value, [-width, width], [-15, 15])}deg` }
        ]
    }));

    const handleSwipe = (direction: 'left' | 'right') => {
        Haptics.notificationAsync(direction === 'right' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
        console.log(`Swiped ${direction} on ${activeRequest.name}`);
        setCurrentIndex(prev => prev + 1);
        translateX.value = 0;
    };

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = e.translationX;
        })
        .onEnd((e) => {
            if (e.translationX > 150) {
                runOnJS(handleSwipe)('right');
            } else if (e.translationX < -150) {
                runOnJS(handleSwipe)('left');
            } else {
                translateX.value = withSpring(0);
            }
        });

    if (currentIndex >= requests.length) {
        return (
            <View style={styles.doneContainer}>
                <StatusBar barStyle="light-content" />
                <View style={styles.doneIcon}>
                    <Ionicons name="checkmark" size={48} color="#4ade80" />
                </View>
                <Text style={styles.doneTitle}>All Caught Up!</Text>
                <Text style={styles.doneSubtitle}>No more pending verification requests.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.doneBtn}>
                    <Text style={styles.doneBtnText}>Return to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verification Queue</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.cardArea}>
                {requests.length > currentIndex + 1 && (
                    <View style={styles.stackedCard} />
                )}

                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[cardRotate, styles.activeCard]}>
                        <Image
                            source={{ uri: activeRequest.document }}
                            style={styles.cardImage}
                            resizeMode="cover"
                        />
                        <LinearGradient colors={['transparent', '#0f172a']} style={styles.cardGradient} />

                        <View style={styles.cardContent}>
                            <View>
                                <View style={styles.cardBadge}>
                                    <Text style={styles.cardBadgeText}>STUDENT ID</Text>
                                </View>
                                <Text style={styles.cardName}>{activeRequest.name}</Text>
                                <Text style={styles.cardUni}>{activeRequest.university}</Text>

                                <View style={styles.emailRow}>
                                    <Ionicons name="mail" size={16} color="#94a3b8" />
                                    <Text style={styles.emailText}>{activeRequest.email}</Text>
                                </View>
                            </View>

                            <View style={styles.swipeHint}>
                                <Text style={styles.swipeHintLabel}>SWIPE ACTIONS</Text>
                                <View style={styles.swipeActions}>
                                    <View style={styles.swipeAction}>
                                        <Ionicons name="arrow-back" size={12} color="#f87171" />
                                        <Text style={styles.rejectText}>REJECT</Text>
                                    </View>
                                    <View style={styles.swipeAction}>
                                        <Text style={styles.approveText}>APPROVE</Text>
                                        <Ionicons name="arrow-forward" size={12} color="#4ade80" />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </GestureDetector>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity onPress={() => handleSwipe('left')} style={styles.rejectBtn}>
                    <Ionicons name="close" size={32} color="#f87171" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.reloadBtn}>
                    <Ionicons name="reload" size={20} color="#94a3b8" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleSwipe('right')} style={styles.approveBtn}>
                    <Ionicons name="checkmark" size={32} color="#4ade80" />
                </TouchableOpacity>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18,
    },
    cardArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stackedCard: {
        position: 'absolute',
        width: '85%',
        height: '60%',
        backgroundColor: '#1e293b',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#334155',
        transform: [{ scale: 0.9 }, { translateY: 20 }],
    },
    activeCard: {
        width: width * 0.9,
        height: '70%',
        backgroundColor: '#1e293b',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#334155',
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '50%',
        backgroundColor: '#334155',
    },
    cardGradient: {
        position: 'absolute',
        top: 0,
        width: '100%',
        height: '50%',
    },
    cardContent: {
        padding: 24,
        flex: 1,
        justifyContent: 'space-between',
    },
    cardBadge: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    cardBadgeText: {
        color: '#818cf8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    cardName: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    cardUni: {
        color: '#94a3b8',
        fontSize: 16,
        marginBottom: 16,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 12,
    },
    emailText: {
        color: '#cbd5e1',
        fontSize: 14,
    },
    swipeHint: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    swipeHintLabel: {
        color: '#475569',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    swipeActions: {
        flexDirection: 'row',
        gap: 16,
    },
    swipeAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rejectText: {
        color: '#f87171',
        fontWeight: '700',
        fontSize: 10,
    },
    approveText: {
        color: '#4ade80',
        fontWeight: '700',
        fontSize: 10,
    },
    controls: {
        paddingBottom: 40,
        paddingTop: 24,
        paddingHorizontal: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rejectBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reloadBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    approveBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    doneIcon: {
        width: 96,
        height: 96,
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    doneTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
    },
    doneSubtitle: {
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 32,
    },
    doneBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    doneBtnText: {
        color: '#fff',
        fontWeight: '700',
    },
});
