import { View, Text } from '@/components/Themed';
import { StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function StatsScreen() {
    const stats = [
        { label: 'Books Read', value: '12', icon: 'book', color: '#60a5fa' },
        { label: 'Pages Read', value: '3,450', icon: 'documents', color: '#a78bfa' },
        { label: 'Avg. Rating', value: '4.5', icon: 'star', color: '#fbbf24' },
        { label: 'Reading Streak', value: '5 days', icon: 'flame', color: '#f87171' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.header}>Your Statistics</Text>

                <View style={styles.grid}>
                    {stats.map((stat, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInUp.delay(100 + index * 100)}
                            style={styles.card}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
                                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                            </View>
                            <Text style={styles.value}>{stat.value}</Text>
                            <Text style={styles.label}>{stat.label}</Text>
                        </Animated.View>
                    ))}
                </View>

                <Animated.View entering={FadeInUp.delay(500)} style={styles.chartPlaceholder}>
                    <Ionicons name="bar-chart" size={48} color="#475569" />
                    <Text style={styles.placeholderText}>Detailed charts coming soon!</Text>
                </Animated.View>
            </ScrollView>
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
        paddingBottom: 100,
    },
    header: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    card: {
        width: '47%',
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    value: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    chartPlaceholder: {
        height: 200,
        backgroundColor: '#1e293b',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#334155',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    placeholderText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
});
