import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const MOCK_GROUPS = [
    { id: '1', name: 'CS101 Intro to CS', members: 12, nextMeeting: 'Today, 4:00 PM', topic: 'Algorithms', color: '#818cf8', icon: 'code-slash' },
    { id: '2', name: 'Calculus II', members: 8, nextMeeting: 'Tomorrow, 2:00 PM', topic: 'Integration', color: '#f472b6', icon: 'hourglass' },
    { id: '3', name: 'Physics Lab', members: 4, nextMeeting: 'Fri, 10:00 AM', topic: 'Lab Report', color: '#2dd4bf', icon: 'beaker' },
    { id: '4', name: 'Economics 101', members: 24, nextMeeting: 'Mon, 9:00 AM', topic: 'Macro', color: '#facc15', icon: 'trending-up' },
];

export default function StudyGroupsScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#94a3b8" />
                    <TextInput
                        placeholder="Find a squad..."
                        placeholderTextColor="#64748b"
                        style={styles.searchInput}
                    />
                </View>
            </View>

            <FlatList
                data={MOCK_GROUPS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <Animated.View
                        entering={FadeInUp.delay(index * 100).springify()}
                        layout={Layout.springify()}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.groupCard}
                            onPress={() => Haptics.selectionAsync()}
                        >
                            <View style={[styles.iconBox, { backgroundColor: `${item.color}20` }]}>
                                <Ionicons name={item.icon as any} size={24} color={item.color} />
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.groupName}>{item.name}</Text>
                                    <View style={[styles.badge, { borderColor: item.color }]}>
                                        <Text style={[styles.badgeText, { color: item.color }]}>{item.members} Online</Text>
                                    </View>
                                </View>

                                <Text style={styles.topicText}>{item.topic}</Text>

                                <View style={styles.meetingRow}>
                                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                                    <Text style={styles.meetingText}>NEXT: {item.nextMeeting}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
            >
                <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={32} color="white" />
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
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#334155',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        color: '#fff',
        fontSize: 16,
    },
    listContent: {
        padding: 24,
        paddingTop: 0,
        gap: 16,
    },
    groupCard: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    groupName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    badge: {
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    topicText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
    },
    meetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    meetingText: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    fabGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
