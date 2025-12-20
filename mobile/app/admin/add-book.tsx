import { useState } from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function AddBook() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        genre: '',
        cover_url: '',
        file_url: '',
        description: '',
    });

    async function handleCreate() {
        if (!formData.title || !formData.author || !formData.file_url) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Please fill in the required fields (Title, Author, File URL)');
            return;
        }

        Haptics.selectionAsync();
        setLoading(true);
        try {
            const { error } = await supabase.from('books').insert([
                {
                    title: formData.title,
                    author: formData.author,
                    genre: formData.genre || 'Uncategorized',
                    cover_url: formData.cover_url || null,
                    file_url: formData.file_url,
                    description: formData.description || null,
                    is_featured: false,
                },
            ]);

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Book added successfully', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error) {
            console.error('Error adding book:', error);
            Alert.alert('Error', 'Failed to add book');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
                    <Text style={styles.title}>Add New Book</Text>
                    <Text style={styles.subtitle}>Enter the book's details below</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200)} style={styles.formCard}>
                    {[
                        { key: 'title', label: 'TITLE', icon: 'book-outline', placeholder: 'The Great Gatsby', required: true },
                        { key: 'author', label: 'AUTHOR', icon: 'person-outline', placeholder: 'F. Scott Fitzgerald', required: true },
                        { key: 'genre', label: 'GENRE', icon: 'pricetag-outline', placeholder: 'Fiction', required: false },
                        { key: 'file_url', label: 'PDF/FILE URL', icon: 'document-outline', placeholder: 'https://example.com/book.pdf', required: true },
                        { key: 'cover_url', label: 'COVER IMAGE URL', icon: 'image-outline', placeholder: 'https://example.com/cover.jpg', required: false },
                    ].map((field) => (
                        <View key={field.key} style={styles.inputGroup}>
                            <Text style={styles.label}>{field.label} {field.required && <Text style={{ color: '#f87171' }}>*</Text>}</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name={field.icon as any} size={20} color="#94a3b8" />
                                <TextInput
                                    style={styles.input}
                                    value={formData[field.key as keyof typeof formData]}
                                    onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                                    placeholder={field.placeholder}
                                    placeholderTextColor="#64748b"
                                    autoCapitalize={field.key === 'title' || field.key === 'author' ? 'words' : 'none'}
                                />
                            </View>
                        </View>
                    ))}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>DESCRIPTION</Text>
                        <TextInput
                            style={[styles.inputContainer, styles.textArea]}
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            placeholder="A brief summary..."
                            placeholderTextColor="#64748b"
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </Animated.View>

                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={loading}
                    activeOpacity={0.8}
                    style={styles.createBtn}
                >
                    <LinearGradient
                        colors={['#6366f1', '#4f46e5']}
                        style={[styles.createGradient, loading && styles.disabledBtn]}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                                <Text style={styles.createBtnText}>Add Book</Text>
                            </>
                        )}
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
    content: {
        padding: 24,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
    },
    formCard: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 24,
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
    textArea: {
        height: 120,
        paddingTop: 16,
        paddingBottom: 16,
        alignItems: 'flex-start',
        color: '#fff',
        fontSize: 16,
    },
    createBtn: {
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    createGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    createBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
