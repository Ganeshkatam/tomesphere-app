import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, StatusBar, View, TextInput } from 'react-native';
import { Text } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Palette } from '@/constants/Colors';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';
import { LinearGradient } from 'expo-linear-gradient';

const TABS = [
    { key: 'following', label: 'Following' },
    { key: 'followers', label: 'Followers' },
    { key: 'find', label: 'Find People' },
];

export default function SocialScreen() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('following');
    const [searchQuery, setSearchQuery] = useState('');
    const [myId, setMyId] = useState<string | null>(null);

    useEffect(() => { checkAuth(); }, [activeTab]);

    async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setMyId(user.id);
            fetchData(user.id);
        }
    }

    async function fetchData(uid: string) {
        setLoading(true);
        try {
            let data: any[] = [];
            let error: any = null;

            if (activeTab === 'following') {
                const { data: follows, error: err } = await supabase
                    .from('user_follows')
                    .select('following_id, profiles!user_follows_following_id_fkey(*)')
                    .eq('follower_id', uid);
                data = follows?.map(f => f.profiles) || [];
                error = err;
            } else if (activeTab === 'followers') {
                const { data: follows, error: err } = await supabase
                    .from('user_follows')
                    .select('follower_id, profiles!user_follows_follower_id_fkey(*)')
                    .eq('following_id', uid);
                data = follows?.map(f => f.profiles) || [];
                error = err;
            } else {
                // Find People (All users excluding self)
                const { data: all, error: err } = await supabase
                    .from('profiles')
                    .select('*')
                    .neq('id', uid)
                    .ilike('name', `%${searchQuery}%`)
                    .limit(20);
                data = all || [];
                error = err;
            }

            if (error) throw error;
            setUsers(data);
        } catch (e: any) {
            console.error('Social Error:', e);
            const { AppAlert } = require('@/lib/alerts');
            AppAlert.error(e.message, 'Failed to load community');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const renderUser = ({ item, index }: any) => (
        <Animated.View entering={FadeInDown.delay(index * 50)} style={styles.userCard}>
            <View style={styles.row}>
                <Image
                    source={{ uri: item.avatar_url || `https://api.dicebear.com/7.x/initials/png?seed=${item.name}` }}
                    style={styles.avatar}
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.handle}>Level {Math.floor((Math.random() * 10) + 1)} Reader</Text>
                </View>

                <TouchableOpacity
                    style={[styles.actionBtn, activeTab === 'find' ? styles.btnFollow : styles.btnChat]}
                    onPress={() => {
                        if (activeTab === 'find') {
                            // Follow Logic (Mock for now, real implementation needs insert)
                        } else {
                            // Go to Chat
                            router.push(`/messages/${item.id}` as any);
                        }
                    }}
                >
                    <Ionicons
                        name={activeTab === 'find' ? "person-add" : "chatbubble-ellipses"}
                        size={18}
                        color="white"
                    />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[Palette.bgCanvas, Palette.surface1]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Community</Text>
                <Text style={styles.headerSubtitle}>Connect with fellow readers</Text>
            </View>

            <AnimatedTabBar tabs={TABS} activeTab={activeTab} onTabPress={setActiveTab} />

            {activeTab === 'find' && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={Palette.textMed} />
                        <TextInput
                            placeholder="Search readers..."
                            placeholderTextColor={Palette.textMed}
                            style={styles.input}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={() => checkAuth()}
                        />
                    </View>
                </View>
            )}

            <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); checkAuth(); }} tintColor={Palette.primary} />}
                ListEmptyComponent={!loading ? <Text style={styles.empty}>No users found.</Text> : null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.bgCanvas },
    header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24 },
    headerTitle: { fontSize: 34, fontWeight: '900', color: Palette.textHigh },
    headerSubtitle: { fontSize: 14, color: Palette.textMed, marginTop: 4 },

    searchContainer: { paddingHorizontal: 24, marginBottom: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surface1, padding: 12, borderRadius: 16, gap: 12 },
    input: { flex: 1, color: 'white', fontSize: 16 },

    list: { paddingHorizontal: 24, paddingBottom: 100 },
    userCard: { marginBottom: 12, padding: 16, backgroundColor: Palette.surface1, borderRadius: 20 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Palette.surface2 },
    info: { flex: 1 },
    name: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    handle: { color: Palette.textMed, fontSize: 13 },

    actionBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    btnFollow: { backgroundColor: Palette.primary },
    btnChat: { backgroundColor: Palette.blue },

    empty: { textAlign: 'center', color: Palette.textMed, marginTop: 40 }
});
