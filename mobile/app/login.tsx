import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function signInWithEmail() {
        if (!email || !password) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Login Error', error.message);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)');
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />

            <View style={styles.backgroundContainer}>
                <LinearGradient
                    colors={['#0f172a', '#1e1b4b']}
                    style={StyleSheet.absoluteFill}
                />
                {/* Ambient Glow */}
                <View style={[styles.glowOrb, { top: -100, left: -50, backgroundColor: '#4f46e5' }]} />
                <View style={[styles.glowOrb, { bottom: -100, right: -50, backgroundColor: '#db2777' }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                    <Text style={styles.logo}>📚</Text>
                    <Text style={styles.appName}>TomeSphere</Text>
                    <Text style={styles.subtitle}>Your Digital Wisdom Archive</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200)} style={styles.formCard}>
                    <Text style={styles.formTitle}>Welcome Back</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>EMAIL</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor="#64748b"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PASSWORD</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#64748b"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotBtn}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={signInWithEmail}
                        disabled={loading}
                        style={styles.signInBtn}
                    >
                        <LinearGradient
                            colors={['#4f46e5', '#6366f1']}
                            style={styles.signInGradient}
                        >
                            <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.signupBtn}
                        onPress={() => router.push('/signup')}
                    >
                        <Text style={styles.signupText}>Don't have an account? <Text style={styles.signupLink}>Create one</Text></Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    glowOrb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontSize: 48,
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    formCard: {
        backgroundColor: '#1e293b',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#334155',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        color: '#fff',
        fontSize: 16,
        height: '100%',
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotText: {
        color: '#6366f1',
        fontWeight: '600',
        fontSize: 14,
    },
    signInBtn: {
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    signInGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    signInText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    signupBtn: {
        alignItems: 'center',
    },
    signupText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    signupLink: {
        color: '#fff',
        fontWeight: '700',
    },
});
