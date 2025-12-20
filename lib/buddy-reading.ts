import { supabase } from './supabase';

export interface BuddyReading {
    id: string;
    book_id: string;
    organizer_id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    max_participants?: number;
    is_public: boolean;
    discussion_schedule: string;
    created_at: string;
}

export interface BuddyParticipant {
    id: string;
    buddy_reading_id: string;
    user_id: string;
    current_page: number;
    joined_at: string;
}

export interface DiscussionPost {
    id: string;
    buddy_reading_id: string;
    user_id: string;
    chapter?: string;
    page_range?: string;
    content: string;
    created_at: string;
}

export async function createBuddyReading(
    userId: string,
    bookId: string,
    title: string,
    description: string,
    startDate: string,
    endDate: string,
    discussionSchedule: string,
    isPublic: boolean = true,
    maxParticipants?: number
): Promise<BuddyReading | null> {
    const { data, error } = await supabase
        .from('buddy_readings')
        .insert({
            book_id: bookId,
            organizer_id: userId,
            title,
            description,
            start_date: startDate,
            end_date: endDate,
            discussion_schedule: discussionSchedule,
            is_public: isPublic,
            max_participants: maxParticipants,
        })
        .select()
        .single();

    if (error || !data) return null;

    // Auto-join organizer
    await joinBuddyReading(data.id, userId);

    return data;
}

export async function joinBuddyReading(buddyReadingId: string, userId: string): Promise<boolean> {
    // Check max participants
    const { data: buddyReading } = await supabase
        .from('buddy_readings')
        .select('max_participants')
        .eq('id', buddyReadingId)
        .single();

    if (buddyReading?.max_participants) {
        const { count } = await supabase
            .from('buddy_participants')
            .select('*', { count: 'exact', head: true })
            .eq('buddy_reading_id', buddyReadingId);

        if (count && count >= buddyReading.max_participants) {
            return false; // Full
        }
    }

    const { error } = await supabase
        .from('buddy_participants')
        .insert({
            buddy_reading_id: buddyReadingId,
            user_id: userId,
            current_page: 0,
        });

    return !error;
}

export async function updateReadingProgress(
    buddyReadingId: string,
    userId: string,
    currentPage: number
): Promise<boolean> {
    const { error } = await supabase
        .from('buddy_participants')
        .update({ current_page: currentPage })
        .eq('buddy_reading_id', buddyReadingId)
        .eq('user_id', userId);

    return !error;
}

export async function postDiscussion(
    buddyReadingId: string,
    userId: string,
    content: string,
    chapter?: string,
    pageRange?: string
): Promise<DiscussionPost | null> {
    const { data, error } = await supabase
        .from('discussion_posts')
        .insert({
            buddy_reading_id: buddyReadingId,
            user_id: userId,
            content,
            chapter,
            page_range: pageRange,
        })
        .select()
        .single();

    return error ? null : data;
}

export async function getActiveBuddyReadings(): Promise<BuddyReading[]> {
    const now = new Date().toISOString();

    const { data } = await supabase
        .from('buddy_readings')
        .select('*, books(*)')
        .eq('is_public', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });

    return data || [];
}

export async function getBuddyDiscussions(buddyReadingId: string): Promise<DiscussionPost[]> {
    const { data } = await supabase
        .from('discussion_posts')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      )
    `)
        .eq('buddy_reading_id', buddyReadingId)
        .order('created_at', { ascending: true });

    return data || [];
}
