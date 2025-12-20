import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Image, TouchableOpacity, Alert, StatusBar, Dimensions, RefreshControl } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase, Profile } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({ total: 0, reading: 0, finished: 0, followers: 0, following: 0 });
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { checkAuth(); }, []);

    async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) { setUser(user); fetchData(user.id); }
    }

    async function fetchData(uid: string) {
        try {
            // Profile
            const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', uid).single();
            if (profileError && profileError.code !== 'PGRST116') throw profileError; // Ignore not found for new users

            if (profileData) setProfile(profileData);

            // Reading Stats
            const { data: books, error: booksError } = await supabase.from('reading_lists').select('status').eq('user_id', uid);
            if (booksError) throw booksError;

            // Network Stats
            const { count: followers, error: fError } = await supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', uid);
            const { count: following, error: ingError } = await supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', uid);

            if (fError) console.warn('Followers fetch error:', fError);
            if (ingError) console.warn('Following fetch error:', ingError);

            if (books) setStats({
                total: books.length,
                reading: books.filter(d => d.status === 'currently_reading').length,
                finished: books.filter(d => d.status === 'finished').length,
                followers: followers || 0,
                following: following || 0
            });
        } catch (e: any) {
            console.error('Profile Load Error:', e);
            const { AppAlert } = require('@/lib/alerts');
            AppAlert.error(e.message || 'Could not load profile data', 'Profile Error');
        } finally {
            setRefreshing(false);
        }
    }

    const onRefresh = () => {
        setRefreshing(true);
        if (user) fetchData(user.id);
    };

    async function handleSignOut() {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); router.replace('/login' as any); } }
        ]);
    }

    const level = Math.min(Math.floor(stats.finished / 2) + 1, 99);

    if (!user) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={[Palette.bgCanvas, Palette.surface1]} style={StyleSheet.absoluteFill} />
                <View style={styles.authBox}>
                    <View style={styles.authIconWrap}>
                        <Ionicons name="person-circle" size={100} color={Palette.primary} />
                    </View>
                    <Text style={styles.authTitle}>Welcome to TomeSphere</Text>
                    <Text style={styles.authDesc}>Sign in to continue</Text>
                    <TouchableOpacity onPress={() => router.push('/login' as any)}>
                        <LinearGradient colors={Palette.gradients.primary as any} style={styles.authBtn}>
                            <Text style={styles.authBtnText}>Sign In</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[Palette.bgCanvas, Palette.surface1, Palette.bgCanvas]} style={StyleSheet.absoluteFill} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />}
            >

                {/* ===== AVATAR SECTION ===== */}
                <Animated.View entering={FadeInDown.duration(500)} style={styles.avatarSection}>
                    <View style={styles.avatarOuter}>
                        <LinearGradient colors={[Palette.primary, '#8b5cf6', '#a855f7']} style={styles.avatarGradient}>
                            <View style={styles.avatarInner}>
                                <Image
                                    source={{ uri: profile?.avatar_url || `https://api.dicebear.com/7.x/initials/png?seed=${profile?.name || 'U'}&backgroundColor=6366f1` }}
                                    style={styles.avatar}
                                />
                            </View>
                        </LinearGradient>
                        {/* Level Badge */}
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>{level}</Text>
                        </View>
                    </View>

                    <Text style={styles.userName}>{profile?.name || 'Reader'}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>

                    {profile?.role === 'admin' && (
                        <View style={styles.adminTag}>
                            <Ionicons name="shield-checkmark" size={14} color="#fbbf24" />
                            <Text style={styles.adminTagText}>Admin</Text>
                        </View>
                    )}
                </Animated.View>

                {/* ===== NETWORK STATS ===== */}
                <Animated.View entering={FadeInUp.delay(50)} style={styles.networkRow}>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/social' as any)}>
                        <View style={styles.networkItem}>
                            <Text style={styles.networkNum}>{stats.followers}</Text>
                            <Text style={styles.networkLabel}>Followers</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.networkDivider} />
                    <TouchableOpacity onPress={() => router.push('/(tabs)/social' as any)}>
                        <View style={styles.networkItem}>
                            <Text style={styles.networkNum}>{stats.following}</Text>
                            <Text style={styles.networkLabel}>Following</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* ===== STATS ROW ===== */}
                <Animated.View entering={FadeInUp.delay(100)} style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <LinearGradient colors={Palette.gradients.blue as any} style={styles.statGradient}>
                            <Ionicons name="library" size={32} color="#fff" />
                            <Text style={styles.statNum}>{stats.total}</Text>
                            <Text style={styles.statLabel}>BOOKS</Text>
                        </LinearGradient>
                    </View>

                    <View style={[styles.statBox, styles.statBoxMain]}>
                        <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statGradient}>
                            <Ionicons name="flame" size={40} color="#fff" />
                            <Text style={styles.statNumBig}>{stats.reading}</Text>
                            <Text style={styles.statLabel}>READING</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.statBox}>
                        <LinearGradient colors={Palette.gradients.emerald as any} style={styles.statGradient}>
                            <Ionicons name="checkmark-done" size={32} color="#fff" />
                            <Text style={styles.statNum}>{stats.finished}</Text>
                            <Text style={styles.statLabel}>DONE</Text>
                        </LinearGradient>
                    </View>
                </Animated.View>

                {/* ===== ACTION BUTTONS ===== */}
                <Animated.View entering={FadeInUp.delay(200)} style={styles.actionRow}>
                    {[
                        { icon: 'create', label: 'Edit', color: Palette.primary, route: '/settings/edit-profile' },
                        { icon: 'trophy', label: 'Contests', color: Palette.coral, route: '/(tabs)/contests' },
                        { icon: 'people', label: 'Social', color: Palette.blue, route: '/(tabs)/social' },
                        { icon: 'library', label: 'Library', color: Palette.secondary, route: '/(tabs)/library' },
                    ].map(item => (
                        <TouchableOpacity
                            key={item.label}
                            style={styles.actionBtn}
                            onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: item.color }]}>
                                <Ionicons name={item.icon as any} size={24} color="#fff" />
                            </View>
                            <Text style={styles.actionLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* ===== ADMIN CARD ===== */}
                {profile?.role === 'admin' && (
                    <Animated.View entering={FadeInUp.delay(250)}>
                        <TouchableOpacity onPress={() => { Haptics.impactAsync(); router.push('/admin/dashboard' as any); }}>
                            <LinearGradient colors={['#7c3aed', '#5b21b6']} style={styles.adminCard}>
                                <Ionicons name="planet" size={32} color="#fff" />
                                <View style={styles.adminCardText}>
                                    <Text style={styles.adminCardTitle}>Admin Dashboard</Text>
                                    <Text style={styles.adminCardDesc}>Manage books & users</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* ===== MENU LIST ===== */}
                <View style={styles.menuList}>
                    {[
                        { icon: 'notifications', label: 'Notifications', color: Palette.coral, route: '/settings/notifications' },
                        { icon: 'shield-checkmark', label: 'Privacy & Security', color: Palette.blue, route: '/settings/privacy' },
                        { icon: 'help-circle', label: 'Help Center', color: Palette.orange, route: '/settings/help' },
                        { icon: 'information-circle', label: 'About', color: Palette.textMed, route: '/settings/about' },
                    ].map((item, i) => (
                        <Animated.View key={item.label} entering={FadeInUp.delay(300 + i * 50)}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
                            >
                                <View style={[styles.menuIcon, { backgroundColor: `${item.color}25` }]}>
                                    <Ionicons name={item.icon as any} size={26} color={item.color} />
                                </View>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={22} color={Palette.textLow} />
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* ===== SIGN OUT ===== */}
                <Animated.View entering={FadeInUp.delay(500)}>
                    <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                        <Ionicons name="log-out" size={24} color={Palette.coral} />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* ===== FOOTER ===== */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>TomeSphere Mobile v1.1.0</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.bgCanvas },
    scroll: { paddingBottom: 100 },

    // Avatar Section
    avatarSection: { alignItems: 'center', paddingTop: 50, paddingBottom: 20 },
    avatarOuter: { marginBottom: 20 },
    avatarGradient: { width: 140, height: 140, borderRadius: 70, padding: 5, alignItems: 'center', justifyContent: 'center' },
    avatarInner: { width: 128, height: 128, borderRadius: 64, backgroundColor: Palette.bgCanvas, padding: 4 },
    avatar: { width: '100%', height: '100%', borderRadius: 60 },
    levelBadge: { position: 'absolute', bottom: -5, right: -5, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fbbf24', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: Palette.bgCanvas },
    levelText: { color: '#000', fontSize: 20, fontWeight: '900' },
    userName: { fontSize: 32, fontWeight: '900', color: Palette.textHigh, marginBottom: 6 },
    userEmail: { fontSize: 15, color: Palette.textMed, marginBottom: 12 },
    adminTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fbbf2420', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, gap: 6 },
    adminTagText: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },

    // Network Stats
    networkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, paddingVertical: 12, backgroundColor: Palette.surface1, marginHorizontal: 40, borderRadius: 16 },
    networkItem: { alignItems: 'center', paddingHorizontal: 20 },
    networkNum: { color: Palette.textHigh, fontSize: 18, fontWeight: 'bold' },
    networkLabel: { color: Palette.textMed, fontSize: 13 },
    networkDivider: { width: 1, height: 30, backgroundColor: Palette.surface2 },

    // Stats Row
    statsRow: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 30, gap: 14 },
    statBox: { width: (width - 68) / 3, borderRadius: 24, overflow: 'hidden' },
    statBoxMain: { marginTop: -12 },
    statGradient: { alignItems: 'center', paddingVertical: 24 },
    statNum: { fontSize: 40, fontWeight: '900', color: '#ffffff', marginTop: 8 },
    statNumBig: { fontSize: 52, fontWeight: '900', color: '#ffffff', marginTop: 8 },
    statLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 2, marginTop: 4 },

    // Action Buttons
    actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 30, paddingHorizontal: 20 },
    actionBtn: { alignItems: 'center' },
    actionIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    actionLabel: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

    // Admin Card
    adminCard: { marginHorizontal: 20, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
    adminCardText: { flex: 1 },
    adminCardTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
    adminCardDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 2 },

    // Menu List
    menuList: { paddingHorizontal: 20, gap: 12, marginBottom: 24 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surface1, borderRadius: 18, padding: 18 },
    menuIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    menuLabel: { flex: 1, color: '#ffffff', fontSize: 18, fontWeight: '700' },

    // Sign Out
    signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 30, padding: 18, borderRadius: 18, backgroundColor: '#ef444415', borderWidth: 2, borderColor: '#ef444430', gap: 12 },
    signOutText: { color: '#ef4444', fontSize: 18, fontWeight: '700' },

    // Footer
    footer: { alignItems: 'center', paddingBottom: 20 },
    footerText: { color: Palette.textLow, fontSize: 14, fontWeight: '600' },

    // Auth Screen
    authBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    authIconWrap: { marginBottom: 24 },
    authTitle: { fontSize: 28, fontWeight: '900', color: Palette.textHigh, marginBottom: 8, textAlign: 'center' },
    authDesc: { fontSize: 16, color: Palette.textMed, marginBottom: 32 },
    authBtn: { paddingHorizontal: 48, paddingVertical: 18, borderRadius: 18 },
    authBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
});
