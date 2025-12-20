import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase, Profile } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function EditProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        avatar_url: '',
        website: '',
        location: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login');
                return;
            }
            setUser(user);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setFormData({
                    name: data.name || '',
                    bio: data.bio || '',
                    avatar_url: data.avatar_url || '',
                    website: data.website || '',
                    location: data.location || '',
                });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        Haptics.selectionAsync();
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update(formData)
                .eq('id', user.id);

            if (error) throw error;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <Animated.View entering={FadeInUp.delay(100)} style={styles.formCard}>
                    {[
                        { key: 'name', label: 'FULL NAME', icon: 'person-outline', placeholder: 'Your Name' },
                        { key: 'location', label: 'LOCATION', icon: 'location-outline', placeholder: 'City, Country' },
                        { key: 'website', label: 'WEBSITE', icon: 'link-outline', placeholder: 'https://yourwebsite.com' },
                        { key: 'avatar_url', label: 'AVATAR URL', icon: 'image-outline', placeholder: 'https://example.com/avatar.jpg' },
                    ].map((field, i) => (
                        <View key={field.key} style={styles.formGroup}>
                            <Text style={styles.label}>{field.label}</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name={field.icon as any} size={20} color="#94a3b8" />
                                <TextInput
                                    style={styles.input}
                                    value={formData[field.key as keyof typeof formData]}
                                    onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                                    placeholder={field.placeholder}
                                    placeholderTextColor="#64748b"
                                    autoCapitalize={field.key === 'name' ? 'words' : 'none'}
                                />
                            </View>
                        </View>
                    ))}

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>BIO</Text>
                        <TextInput
                            style={[styles.inputContainer, styles.textArea]}
                            value={formData.bio}
                            onChangeText={(text) => setFormData({ ...formData, bio: text })}
                            placeholder="Tell us about yourself..."
                            placeholderTextColor="#64748b"
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </Animated.View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSave}
                    disabled={saving}
                    style={styles.saveBtn}
                >
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.saveGradient}
                    >
                        <Ionicons name="checkmark-circle" size={22} color="white" />
                        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
    },
    content: {
        padding: 24,
        paddingBottom: 100,
    },
    formCard: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 24,
    },
    formGroup: {
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
    textArea: {
        height: 120,
        paddingTop: 16,
        paddingBottom: 16,
        alignItems: 'flex-start',
        color: '#fff',
        fontSize: 16,
    },
    saveBtn: {
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#10b981',
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
