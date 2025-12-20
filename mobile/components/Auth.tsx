import React, { useState } from 'react';
import { Alert, StyleSheet, View, AppState } from 'react-native';
import { supabase } from '../lib/supabase';

// Using standard React Native components
import {
    TextInput,
    TouchableOpacity,
    Text,
    ActivityIndicator
} from 'react-native';

AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});

export default function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) Alert.alert(error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) Alert.alert(error.message);
        else if (!session) Alert.alert('Please check your inbox for email verification!');
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>TomeSphere</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={[styles.verticallySpaced, styles.mt20]}>
                <TextInput
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder="email@address.com"
                    placeholderTextColor="#888"
                    autoCapitalize={'none'}
                    style={styles.input}
                />
            </View>
            <View style={styles.verticallySpaced}>
                <TextInput
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    autoCapitalize={'none'}
                    style={styles.input}
                />
            </View>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => signInWithEmail()}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign in</Text>
                    )}
                </TouchableOpacity>
            </View>
            <View style={styles.verticallySpaced}>
                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => signUpWithEmail()}
                    disabled={loading}
                >
                    <Text style={styles.secondaryButtonText}>Sign up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        padding: 12,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff', // Assuming dark mode default for RN template which is usually light/dark adaptive, but let's assume dark theme for checks
    },
    subtitle: {
        fontSize: 16,
        color: '#ccc',
    },
    verticallySpaced: {
        paddingTop: 4,
        paddingBottom: 4,
        alignSelf: 'stretch',
    },
    mt20: {
        marginTop: 20,
    },
    input: {
        backgroundColor: '#1E293B',
        color: '#fff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        fontSize: 16,
    },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#4F46E5', // Indigo 600
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#4F46E5',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    secondaryButtonText: {
        color: '#4F46E5',
        fontWeight: '600',
        fontSize: 16,
    },
});
