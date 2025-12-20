import { supabase } from './supabase';

export interface UserProfile {
    userId: string;
    username: string;
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    location?: string;
    website?: string;
    favoriteGenres: string[];
    readingGoal?: number;
    isPrivate: boolean;
    stats: {
        booksRead: number;
        reviewsWritten: number;
        followers: number;
        following: number;
    };
    badges: string[];
    createdAt: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data } = await supabase
        .from('profiles')
        .select(`
      *,
      user_stats(*)
    `)
        .eq('user_id', userId)
        .single();

    if (!data) return null;

    return {
        userId: data.user_id,
        username: data.username,
        displayName: data.display_name,
        bio: data.bio,
        avatarUrl: data.avatar_url,
        location: data.location,
        website: data.website,
        favoriteGenres: data.favorite_genres || [],
        readingGoal: data.reading_goal,
        isPrivate: data.is_private,
        stats: data.user_stats || {
            booksRead: 0,
            reviewsWritten: 0,
            followers: 0,
            following: 0,
        },
        badges: data.badges || [],
        createdAt: data.created_at,
    };
}

export async function updateProfile(
    userId: string,
    updates: Partial<UserProfile>
): Promise<boolean> {
    const { error } = await supabase
        .from('profiles')
        .update({
            username: updates.username,
            display_name: updates.displayName,
            bio: updates.bio,
            avatar_url: updates.avatarUrl,
            location: updates.location,
            website: updates.website,
            favorite_genres: updates.favoriteGenres,
            reading_goal: updates.readingGoal,
            is_private: updates.isPrivate,
        })
        .eq('user_id', userId);

    return !error;
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

    if (error) return null;

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    return publicUrl;
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
    if (username.length < 3) {
        return { valid: false, error: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
        return { valid: false, error: 'Username must be less than 20 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    return { valid: true };
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
    const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

    return !data;
}

export function getProfileCompleteness(profile: UserProfile): number {
    let score = 0;
    const fields = [
        profile.username,
        profile.displayName,
        profile.bio,
        profile.avatarUrl,
        profile.location,
        profile.favoriteGenres.length > 0,
        profile.readingGoal,
    ];

    fields.forEach(field => {
        if (field) score += 100 / fields.length;
    });

    return Math.round(score);
}
