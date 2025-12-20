import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, StatusBar, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function GoalsScreen() {
    const [goal, setGoal] = useState('50');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGoal();
    }, []);

    async function fetchGoal() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('reading_goal')
                    .eq('id', user.id)
                    .single();
                if (data?.reading_goal) {
                    setGoal(data.reading_goal.toString());
                }
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        Haptics.selectionAsync();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({ reading_goal: parseInt(goal) })
                    .eq('id', user.id);

                if (error) throw error;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Reading goal updated!');
            }
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to update goal');
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInUp.delay(100)} style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="trophy" size={56} color="#fbbf24" />
                    </View>
                    <Text style={styles.title}>Annual Reading Challenge</Text>
                    <Text style={styles.subtitle}>How many books do you want to conquer this year?</Text>

                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            value={goal}
                            onChangeText={setGoal}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                        <Text style={styles.suffix}>Books</Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleSave}
                        style={styles.saveBtn}
                    >
                        <LinearGradient
                            colors={['#fbbf24', '#f59e0b']}
                            style={styles.saveGradient}
                        >
                            <Ionicons name="flag" size={20} color="white" />
                            <Text style={styles.saveBtnText}>Set Goal</Text>
                        </LinearGradient>
                    </TouchableOpacity>
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
        paddingTop: 48,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(251, 191, 36, 0.2)',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    input: {
        fontSize: 56,
        fontWeight: '800',
        color: '#fff',
        borderBottomWidth: 3,
        borderBottomColor: '#fbbf24',
        paddingHorizontal: 16,
        textAlign: 'center',
        minWidth: 100,
    },
    suffix: {
        fontSize: 20,
        color: '#64748b',
        marginLeft: 12,
        fontWeight: '600',
    },
    saveBtn: {
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
        width: '100%',
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    saveGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.5,
    },
});
