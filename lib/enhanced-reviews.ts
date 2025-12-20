import { supabase } from './supabase';

export interface EnhancedReview {
    id: string;
    user_id: string;
    book_id: string;
    rating: number;
    review_text: string;
    video_url?: string;
    has_spoilers: boolean;
    helpful_count: number;
    funny_count: number;
    insightful_count: number;
    created_at: string;
    updated_at: string;
}

export interface ReviewReaction {
    id: string;
    review_id: string;
    user_id: string;
    reaction_type: 'helpful' | 'funny' | 'insightful';
    created_at: string;
}

export async function createReview(
    userId: string,
    bookId: string,
    rating: number,
    reviewText: string,
    hasSpoilers: boolean = false,
    videoUrl?: string
): Promise<EnhancedReview | null> {
    const { data, error } = await supabase
        .from('enhanced_reviews')
        .insert({
            user_id: userId,
            book_id: bookId,
            rating,
            review_text: reviewText,
            video_url: videoUrl,
            has_spoilers: hasSpoilers,
            helpful_count: 0,
            funny_count: 0,
            insightful_count: 0,
        })
        .select()
        .single();

    return error ? null : data;
}

export async function addReaction(
    reviewId: string,
    userId: string,
    reactionType: 'helpful' | 'funny' | 'insightful'
): Promise<boolean> {
    // Check if already reacted
    const { data: existing } = await supabase
        .from('review_reactions')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType)
        .single();

    if (existing) return false; // Already reacted

    const { error } = await supabase
        .from('review_reactions')
        .insert({
            review_id: reviewId,
            user_id: userId,
            reaction_type: reactionType,
        });

    if (!error) {
        // Increment count
        const field = `${reactionType}_count`;
        await supabase.rpc('increment_review_reaction', {
            review_id: reviewId,
            reaction_field: field,
        });
    }

    return !error;
}

export async function getBookReviews(bookId: string, limit: number = 10) {
    const { data } = await supabase
        .from('enhanced_reviews')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      )
    `)
        .eq('book_id', bookId)
        .order('helpful_count', { ascending: false })
        .limit(limit);

    return data || [];
}

export async function getUserReactions(reviewId: string, userId: string) {
    const { data } = await supabase
        .from('review_reactions')
        .select('reaction_type')
        .eq('review_id', reviewId)
        .eq('user_id', userId);

    return data?.map(r => r.reaction_type) || [];
}
