import { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalUsers: 0,
        activeUsers: 0,
        recentBooks: 0,
        topGenre: 'N/A',
    });
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            setStats({
                totalBooks: 1240,
                totalUsers: 853,
                activeUsers: 142,
                recentBooks: 12,
                topGenre: 'Sci-Fi',
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const STAT_CARDS = [
        { title: 'Total Users', value: stats.totalUsers, icon: 'people', gradient: ['#6366f1', '#a855f7'] },
        { title: 'Books Catalog', value: stats.totalBooks, icon: 'library', gradient: ['#3b82f6', '#06b6d4'] },
        { title: 'Active Now', value: stats.activeUsers, icon: 'pulse', gradient: ['#22c55e', '#10b981'] },
        { title: 'Top Genre', value: stats.topGenre, icon: 'star', gradient: ['#f59e0b', '#fbbf24'] },
    ];

    const COMMAND_ACTIONS = [
        { title: 'Verification Queue', description: 'Review pending student IDs', icon: 'shield-checkmark', color: '#ec4899', route: '/admin/verifications' },
        { title: 'User Database', description: 'Manage roles and permissions', icon: 'people-circle', color: '#a78bfa', route: '/admin/users' },
        { title: 'Content Management', description: 'Add books, edit metadata', icon: 'library', color: '#60a5fa', route: '/admin/books' },
        { title: 'System Logs', description: 'View error logs and reports', icon: 'terminal', color: '#94a3b8', route: '/admin/logs' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.glowOrb} />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchStats(); }}
                        tintColor="#6366f1"
                    />
                }
            >
                <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                    <Text style={styles.headerSubtitle}>SYSTEM ADMINISTRATOR</Text>
                    <Text style={styles.headerTitle}>Command Center</Text>
                </Animated.View>

                <View style={styles.statsGrid}>
                    {STAT_CARDS.map((stat, i) => (
                        <Animated.View key={stat.title} entering={FadeInUp.delay(100 + i * 100)} style={styles.statCard}>
                            <TouchableOpacity activeOpacity={0.8} style={styles.statCardInner}>
                                <LinearGradient colors={stat.gradient as any} style={styles.statIconCircle}>
                                    <Ionicons name={stat.icon as any} size={20} color="white" />
                                </LinearGradient>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.title}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                <Animated.Text entering={FadeInDown.delay(500)} style={styles.sectionTitle}>Management Modules</Animated.Text>

                {COMMAND_ACTIONS.map((action, i) => (
                    <Animated.View key={action.title} entering={FadeInDown.delay(600 + i * 100)}>
                        <TouchableOpacity
                            style={styles.actionRow}
                            activeOpacity={0.7}
                            onPress={() => { Haptics.selectionAsync(); router.push(action.route as any); }}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                                <Ionicons name={action.icon as any} size={24} color={action.color} />
                            </View>
                            <View style={styles.actionInfo}>
                                <Text style={styles.actionTitle}>{action.title}</Text>
                                <Text style={styles.actionDesc}>{action.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    glowOrb: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        borderRadius: 150,
    },
    content: {
        padding: 24,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 32,
        marginTop: 32,
    },
    headerSubtitle: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        width: '47%',
    },
    statCardInner: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 20,
        height: 160,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#334155',
    },
    statIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
    },
    statLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    actionDesc: {
        fontSize: 12,
        color: '#64748b',
    },
});
