import { supabase } from './supabase';

export interface BookDiscussion {
    id: string;
    bookId: string;
    title: string;
    description: string;
    createdBy: string;
    category: 'spoiler' | 'no-spoiler' | 'theory' | 'question' | 'general';
    isPinned: boolean;
    replyCount: number;
    viewCount: number;
    lastActivityAt: string;
    createdAt: string;
}

export interface DiscussionReply {
    id: string;
    discussionId: string;
    userId: string;
    content: string;
    parentReplyId?: string;
    likes: number;
    createdAt: string;
}

export async function createDiscussion(
    userId: string,
    bookId: string,
    title: string,
    description: string,
    category: BookDiscussion['category']
): Promise<BookDiscussion | null> {
    const { data, error } = await supabase
        .from('book_discussions')
        .insert({
            book_id: bookId,
            title,
            description,
            created_by: userId,
            category,
            is_pinned: false,
            reply_count: 0,
            view_count: 0,
            last_activity_at: new Date().toISOString(),
        })
        .select()
        .single();

    return error ? null : data;
}

export async function getBookDiscussions(bookId: string): Promise<BookDiscussion[]> {
    const { data } = await supabase
        .from('book_discussions')
        .select(`
      *,
      user:created_by (
        id,
        email,
        profiles (*)
      )
    `)
        .eq('book_id', bookId)
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false });

    return data || [];
}

export async function replyToDiscussion(
    discussionId: string,
    userId: string,
    content: string,
    parentReplyId?: string
): Promise<DiscussionReply | null> {
    const { data, error } = await supabase
        .from('discussion_replies')
        .insert({
            discussion_id: discussionId,
            user_id: userId,
            content,
            parent_reply_id: parentReplyId,
            likes: 0,
        })
        .select()
        .single();

    if (!error) {
        await supabase.rpc('increment_discussion_replies', { discussion_id: discussionId });
        await supabase
            .from('book_discussions')
            .update({ last_activity_at: new Date().toISOString() })
            .eq('id', discussionId);
    }

    return error ? null : data;
}

export async function getDiscussionReplies(discussionId: string): Promise<DiscussionReply[]> {
    const { data } = await supabase
        .from('discussion_replies')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      )
    `)
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });

    return data || [];
}

export async function incrementDiscussionViews(discussionId: string): Promise<void> {
    await supabase.rpc('increment_discussion_views', { discussion_id: discussionId });
}

export function organizeRepliesAsThreads(replies: DiscussionReply[]): any[] {
    const topLevel = replies.filter(r => !r.parentReplyId);

    return topLevel.map(reply => ({
        ...reply,
        replies: getRepliesForParent(reply.id, replies),
    }));
}

function getRepliesForParent(parentId: string, allReplies: DiscussionReply[]): any[] {
    const children = allReplies.filter(r => r.parentReplyId === parentId);

    return children.map(reply => ({
        ...reply,
        replies: getRepliesForParent(reply.id, allReplies),
    }));
}
