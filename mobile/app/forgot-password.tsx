import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function sendResetEmail() {
        if (!email) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSent(true);
        }
        setLoading(false);
    }

    if (sent) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.backgroundContainer}>
                    <LinearGradient
                        colors={['#0f172a', '#1e1b4b']}
                        style={StyleSheet.absoluteFill}
                    />
                </View>

                <Animated.View entering={FadeInUp} style={styles.successContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="mail-open-outline" size={64} color="#10b981" />
                    </View>
                    <Text style={styles.successTitle}>Check Your Inbox</Text>
                    <Text style={styles.successText}>
                        We've sent a secure password reset link to {'\n'}
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{email}</Text>
                    </Text>

                    <TouchableOpacity
                        style={styles.signInBtn}
                        onPress={() => router.replace('/login')}
                    >
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.signInGradient}
                        >
                            <Text style={styles.signInText}>Back to Login</Text>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
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
                <View style={[styles.glowOrb, { top: -100, right: -50, backgroundColor: '#f43f5e' }]} />
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                    <Text style={styles.logo}>🔐</Text>
                    <Text style={styles.appName}>Recovery</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200)} style={styles.formCard}>
                    <Text style={styles.formTitle}>Reset Password</Text>
                    <Text style={styles.subtitle}>Enter your email to receive a reset link.</Text>

                    <View style={styles.inputGroup}>
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

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={sendResetEmail}
                        disabled={loading}
                        style={styles.signInBtn}
                    >
                        <LinearGradient
                            colors={['#f43f5e', '#e11d48']}
                            style={styles.signInGradient}
                        >
                            <Text style={styles.signInText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
                            <Ionicons name="send" size={20} color="white" />
                        </LinearGradient>
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
    backButton: {
        top: 60,
        left: 24,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
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
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 24,
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
    signInBtn: {
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#f43f5e',
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
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    successText: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
});
