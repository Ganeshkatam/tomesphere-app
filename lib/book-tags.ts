import { supabase } from './supabase';

export interface BookTag {
    id: string;
    book_id: string;
    user_id: string;
    tag: string;
    created_at: string;
}

export interface TagStats {
    tag: string;
    count: number;
}

export async function getUserTags(userId: string, bookId?: string): Promise<string[]> {
    let query = supabase
        .from('book_tags')
        .select('tag')
        .eq('user_id', userId);

    if (bookId) {
        query = query.eq('book_id', bookId);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return Array.from(new Set(data.map(t => t.tag)));
}

export async function addTag(userId: string, bookId: string, tag: string): Promise<boolean> {
    const { error } = await supabase
        .from('book_tags')
        .insert({
            user_id: userId,
            book_id: bookId,
            tag: tag.toLowerCase().trim(),
        });

    return !error;
}

export async function removeTag(userId: string, bookId: string, tag: string): Promise<boolean> {
    const { error } = await supabase
        .from('book_tags')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .eq('tag', tag.toLowerCase().trim());

    return !error;
}

export async function getPopularTags(limit: number = 20): Promise<TagStats[]> {
    const { data, error } = await supabase
        .from('book_tags')
        .select('tag');

    if (error || !data) return [];

    // Count occurrences
    const tagCounts = new Map<string, number>();
    data.forEach(item => {
        const count = tagCounts.get(item.tag) || 0;
        tagCounts.set(item.tag, count + 1);
    });

    // Convert to array and sort
    const stats = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    return stats;
}

export const suggestedTags = [
    'favorites',
    'to-read',
    'currently-reading',
    'want-to-buy',
    'recommended',
    'must-read',
    'quick-read',
    'beach-read',
    'comfort-read',
    'mind-blowing',
    'emotional',
    'inspirational',
    'educational',
    'reference',
    'gift-idea',
];
