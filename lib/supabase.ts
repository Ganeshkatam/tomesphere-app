import { createClient } from '@supabase/supabase-js';

// Use fallback values for build time if env vars not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Profile {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    avatar_url?: string;
    bio?: string;
    reading_goal?: number;
    location?: string;
    website?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
    phone_number?: string;
    date_of_birth?: string;
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
    pdf_url?: string; // PDF file URL
    isbn?: string;
    pages?: number;
    publisher?: string;
    language?: string;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
    series?: string;
    series_order?: number;
}

export interface Review {
    id: string;
    book_id: string;
    user_id: string;
    content: string;
    flagged: boolean;
    flagged_reason?: string;
    created_at: string;
    updated_at: string;
}

export interface Like {
    id: string;
    book_id: string;
    user_id: string;
    created_at: string;
}

export interface Rating {
    id: string;
    book_id: string;
    user_id: string;
    rating: number;
    created_at: string;
    updated_at: string;
}

export interface Comment {
    id: string;
    book_id: string;
    user_id: string;
    content: string;
    parent_id?: string;
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

export interface ActivityLog {
    id: string;
    user_id: string;
    action_type: 'like' | 'rate' | 'comment' | 'review' | 'add_to_list';
    book_id?: string;
    metadata?: any;
    created_at: string;
}

export interface Contest {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'upcoming' | 'past';
    prize_xp: number;
    image_url?: string;
    created_at: string;
}

export interface ContestParticipant {
    id: string;
    contest_id: string;
    user_id: string;
    joined_at: string;
    score: number;
    rank?: number;
}

export interface DirectMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

// Helper functions
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data as Profile;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function checkUserExists(email: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

    return { exists: !!data, error };
}
