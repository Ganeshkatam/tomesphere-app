import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function AdminLayout() {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    async function checkAdminAccess() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login');
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error || profile?.role !== 'admin') {
                router.replace('/(tabs)/profile');
                return;
            }

            setAuthorized(true);
        } catch (error) {
            console.error('Admin check error:', error);
            router.replace('/(tabs)/profile');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    if (!authorized) return null;

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#0f172a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                contentStyle: {
                    backgroundColor: '#0f172a',
                },
            }}
        >
            <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard', headerLeft: () => null }} />
            <Stack.Screen name="users" options={{ title: 'User Management' }} />
            <Stack.Screen name="books" options={{ title: 'Book Management' }} />
            <Stack.Screen name="verifications" options={{ title: 'Verifications' }} />
        </Stack>
    );
}
