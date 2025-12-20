import { useState } from 'react';
import { StyleSheet, Switch, ScrollView, StatusBar } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function NotificationsSettings() {
    const [preferences, setPreferences] = useState({
        push: true,
        email: true,
        updates: false,
        reading: true,
    });

    const toggleSwitch = (key: keyof typeof preferences) => {
        Haptics.selectionAsync();
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const NOTIFICATION_OPTIONS = [
        { key: 'push', icon: 'notifications', color: '#f472b6', title: 'Push Notifications', subtitle: 'Receive alerts on this device' },
        { key: 'email', icon: 'mail', color: '#60a5fa', title: 'Email Digests', subtitle: 'Weekly activity summaries' },
        { key: 'updates', icon: 'sparkles', color: '#fbbf24', title: 'New Features', subtitle: 'App updates and improvements' },
        { key: 'reading', icon: 'book', color: '#2dd4bf', title: 'Reading Reminders', subtitle: 'Stay on track with daily goals' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInUp.delay(100)} style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>NOTIFICATION PREFERENCES</Text>

                    {NOTIFICATION_OPTIONS.map((opt, i) => (
                        <View key={opt.key}>
                            <View style={styles.row}>
                                <View style={[styles.iconBox, { backgroundColor: `${opt.color}20` }]}>
                                    <Ionicons name={opt.icon as any} size={20} color={opt.color} />
                                </View>
                                <View style={styles.rowInfo}>
                                    <Text style={styles.rowTitle}>{opt.title}</Text>
                                    <Text style={styles.rowSubtitle}>{opt.subtitle}</Text>
                                </View>
                                <Switch
                                    value={preferences[opt.key as keyof typeof preferences]}
                                    onValueChange={() => toggleSwitch(opt.key as keyof typeof preferences)}
                                    trackColor={{ false: '#334155', true: opt.color }}
                                    thumbColor="#fff"
                                />
                            </View>
                            {i < NOTIFICATION_OPTIONS.length - 1 && <View style={styles.separator} />}
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
        backgroundColor: '#0f172a',
    },
    content: {
        padding: 24,
    },
    sectionCard: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    sectionTitle: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rowInfo: {
        flex: 1,
        paddingRight: 16,
    },
    rowTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    rowSubtitle: {
        color: '#64748b',
        fontSize: 13,
    },
    separator: {
        height: 1,
        backgroundColor: '#334155',
        marginVertical: 4,
        marginLeft: 60,
    },
});
