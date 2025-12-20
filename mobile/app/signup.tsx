import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function SignupScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function signUpWithEmail() {
        if (!name || !email || !password) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (password !== confirmPassword) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (password.length < 6) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Signup Error', error.message);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Please check your email for verification link', [
                { text: 'OK', onPress: () => router.replace('/login') }
            ]);
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
                <View style={[styles.glowOrb, { top: -100, right: -50, backgroundColor: '#06b6d4' }]} />
                <View style={[styles.glowOrb, { bottom: -100, left: -50, backgroundColor: '#8b5cf6' }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                    <Text style={styles.logo}>🚀</Text>
                    <Text style={styles.appName}>Join TomeSphere</Text>
                    <Text style={styles.subtitle}>Start Your Intellectual Journey</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200)} style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>FULL NAME</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder="Jane Doe"
                                placeholderTextColor="#64748b"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

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
                                placeholder="Create a password"
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

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CONFIRM PASSWORD</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder="Repeat password"
                                placeholderTextColor="#64748b"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={signUpWithEmail}
                        disabled={loading}
                        style={styles.signInBtn}
                    >
                        <LinearGradient
                            colors={['#0ea5e9', '#2563eb']}
                            style={styles.signInGradient}
                        >
                            <Text style={styles.signInText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
                            <Ionicons name="rocket-outline" size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.signupBtn}
                        onPress={() => router.push('/login')}
                    >
                        <Text style={styles.signupText}>Already have an account? <Text style={styles.signupLink}>Sign In</Text></Text>
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
        marginBottom: 32,
    },
    logo: {
        fontSize: 48,
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
        textAlign: 'center',
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
    inputGroup: {
        marginBottom: 16,
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
    signInBtn: {
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#0ea5e9',
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
