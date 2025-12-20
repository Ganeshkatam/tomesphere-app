import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, Image, TouchableOpacity, View, StatusBar, RefreshControl } from 'react-native';
import { Text } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Palette } from '@/constants/Colors';
import { router } from 'expo-router';

export default function ContestsScreen() {
    const [contests, setContests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { fetchContests(); }, []);

    const fetchContests = async () => {
        try {
            const { data, error } = await supabase
                .from('contests')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) throw error;
            if (data) setContests(data);
        } catch (e: any) {
            console.error('Contests Error:', e);
            const { AppAlert } = require('@/lib/alerts');
            AppAlert.error(e.message || 'Failed to load contests', 'Connection Error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderItem = ({ item, index }: any) => {
        const isActive = item.status === 'active';

        return (
            <Animated.View entering={FadeInUp.delay(index * 100)}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => {/* Navigate to detail */ }}>
                    <View style={styles.card}>
                        {/* Status Badge */}
                        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeUpcoming]}>
                            <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                        </View>

                        {/* Image */}
                        <Image
                            source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800' }}
                            style={styles.cardImage}
                        />

                        {/* Gradient Overlay */}
                        <LinearGradient colors={['transparent', 'rgba(15, 23, 42, 0.95)']} style={styles.gradient} />

                        {/* Content */}
                        <View style={styles.content}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="calendar-outline" size={16} color={Palette.textMed} />
                                    <Text style={styles.metaText}>{new Date(item.start_date).toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="trophy-outline" size={16} color={Palette.orange} />
                                    <Text style={[styles.metaText, { color: Palette.orange }]}>{item.prize_xp} XP</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.joinBtn}>
                                <Text style={styles.joinBtnText}>View Details</Text>
                                <Ionicons name="arrow-forward" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Live Challenges</Text>
                <Text style={styles.headerSubtitle}>Compete, earn XP, and win badges</Text>
            </View>

            <FlatList
                data={contests}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchContests(); }} tintColor={Palette.primary} />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="trophy-outline" size={64} color={Palette.surface2} />
                            <Text style={styles.emptyText}>No contests available right now</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.bgCanvas },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    headerTitle: { fontSize: 32, fontWeight: '900', color: Palette.textHigh },
    headerSubtitle: { fontSize: 16, color: Palette.textMed, marginTop: 4 },
    list: { padding: 20, paddingBottom: 100 },

    card: { height: 280, borderRadius: 24, overflow: 'hidden', marginBottom: 20, backgroundColor: Palette.surface1, borderWidth: 1, borderColor: Palette.surface2 },
    cardImage: { width: '100%', height: '100%' },
    gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },

    badge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, zIndex: 10 },
    badgeActive: { backgroundColor: Palette.secondary },
    badgeUpcoming: { backgroundColor: Palette.blue },
    badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

    content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
    cardTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 12 },
    metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { color: Palette.textMed, fontSize: 14, fontWeight: '600' },

    joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.primary, paddingVertical: 12, borderRadius: 16, gap: 8 },
    joinBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: Palette.textMed, marginTop: 16, fontSize: 16 }
});
