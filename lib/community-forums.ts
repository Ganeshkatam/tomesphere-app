import { supabase } from './supabase';

export interface ForumCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    thread_count: number;
}

export interface ForumThread {
    id: string;
    category_id: string;
    user_id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    is_locked: boolean;
    view_count: number;
    reply_count: number;
    created_at: string;
    updated_at: string;
}

export interface ForumReply {
    id: string;
    thread_id: string;
    user_id: string;
    content: string;
    likes_count: number;
    created_at: string;
}

export async function getForumCategories(): Promise<ForumCategory[]> {
    const { data } = await supabase
        .from('forum_categories')
        .select('*')
        .order('name', { ascending: true });

    return data || [];
}

export async function createThread(
    categoryId: string,
    userId: string,
    title: string,
    content: string
): Promise<ForumThread | null> {
    const { data, error } = await supabase
        .from('forum_threads')
        .insert({
            category_id: categoryId,
            user_id: userId,
            title,
            content,
            is_pinned: false,
            is_locked: false,
            view_count: 0,
            reply_count: 0,
        })
        .select()
        .single();

    return error ? null : data;
}

export async function getCategoryThreads(
    categoryId: string,
    limit: number = 20
): Promise<ForumThread[]> {
    const { data } = await supabase
        .from('forum_threads')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      )
    `)
        .eq('category_id', categoryId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(limit);

    return data || [];
}

export async function replyToThread(
    threadId: string,
    userId: string,
    content: string
): Promise<ForumReply | null> {
    const { data, error } = await supabase
        .from('forum_replies')
        .insert({
            thread_id: threadId,
            user_id: userId,
            content,
            likes_count: 0,
        })
        .select()
        .single();

    if (!error) {
        // Increment reply count
        await supabase.rpc('increment_thread_replies', { thread_id: threadId });
    }

    return error ? null : data;
}

export async function getThreadReplies(threadId: string): Promise<ForumReply[]> {
    const { data } = await supabase
        .from('forum_replies')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      )
    `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

    return data || [];
}

export async function incrementThreadViews(threadId: string): Promise<void> {
    await supabase.rpc('increment_thread_views', { thread_id: threadId });
}

export async function searchThreads(query: string): Promise<ForumThread[]> {
    const { data } = await supabase
        .from('forum_threads')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(20);

    return data || [];
}
