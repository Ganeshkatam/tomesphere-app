import { supabase } from './supabase';

export interface SocialPost {
    id: string;
    user_id: string;
    post_type: 'review' | 'status_update' | 'recommendation' | 'quote' | 'achievement';
    content: string;
    book_id?: string;
    rating?: number;
    visibility: 'public' | 'followers' | 'private';
    likes_count: number;
    comments_count: number;
    created_at: string;
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
}

export interface Like {
    id: string;
    post_id: string;
    user_id: string;
    created_at: string;
}

export async function createPost(
    userId: string,
    type: SocialPost['post_type'],
    content: string,
    bookId?: string,
    rating?: number,
    visibility: SocialPost['visibility'] = 'public'
): Promise<SocialPost | null> {
    const { data, error } = await supabase
        .from('social_posts')
        .insert({
            user_id: userId,
            post_type: type,
            content,
            book_id: bookId,
            rating,
            visibility,
            likes_count: 0,
            comments_count: 0,
        })
        .select()
        .single();

    return error ? null : data;
}

export async function likePost(postId: string, userId: string): Promise<boolean> {
    // Check if already liked
    const { data: existing } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

    if (existing) return false;

    const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: userId });

    if (!error) {
        await supabase.rpc('increment_post_likes', { post_id: postId });
    }

    return !error;
}

export async function addComment(
    postId: string,
    userId: string,
    content: string
): Promise<Comment | null> {
    const { data, error } = await supabase
        .from('post_comments')
        .insert({
            post_id: postId,
            user_id: userId,
            content,
        })
        .select()
        .single();

    if (!error) {
        await supabase.rpc('increment_post_comments', { post_id: postId });
    }

    return error ? null : data;
}

export async function getFeed(userId: string, limit: number = 20): Promise<SocialPost[]> {
    // Get posts from followed users + own posts
    const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

    const followingIds = following?.map(f => f.following_id) || [];
    const userIds = [userId, ...followingIds];

    const { data } = await supabase
        .from('social_posts')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      ),
      book:book_id (*)
    `)
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

export async function getPostComments(postId: string): Promise<Comment[]> {
    const { data } = await supabase
        .from('post_comments')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      )
    `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    return data || [];
}

export async function getUserPosts(userId: string, limit: number = 10): Promise<SocialPost[]> {
    const { data } = await supabase
        .from('social_posts')
        .select('*, book:book_id (*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}
