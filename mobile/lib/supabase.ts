import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        SecureStore.deleteItemAsync(key);
    },
};

// Supabase configuration
const supabaseUrl = 'https://qusuvzwycdmnecixzsgc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1c3V2end5Y2RtbmVjaXh6c2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMTY0MDAsImV4cCI6MjA3OTg5MjQwMH0.rrTm1dBtPoIHphAdP6HdJKZGUoUbD17Hmn7G1sM9o1Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Types (Mirrored from web app)
export interface Profile {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    avatar_url?: string;
    bio?: string;
    reading_goal?: number;
    created_at: string;
    updated_at: string;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    genre: string;
    description?: string;
    release_date?: string;
    cover_url?: string;
    pdf_url?: string;
    isbn?: string;
    pages?: number;
    publisher?: string;
    language?: string;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
}

export interface ReadingList {
    id: string;
    book_id: string;
    user_id: string;
    status: 'want_to_read' | 'currently_reading' | 'finished';
    created_at: string;
    updated_at: string;
}
