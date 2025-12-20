import { supabase } from './supabase';

export interface ReadingGroup {
    id: string;
    name: string;
    description: string;
    createdBy: string;
    isPrivate: boolean;
    memberCount: number;
    currentBook?: string;
    schedule: string;
    meetingDay: string;
    createdAt: string;
}

export async function createReadingGroup(
    userId: string,
    name: string,
    description: string,
    isPrivate: boolean = false,
    schedule: string = 'weekly',
    meetingDay: string = 'Sunday'
): Promise<ReadingGroup | null> {
    const { data, error } = await supabase
        .from('reading_groups')
        .insert({
            name,
            description,
            created_by: userId,
            is_private: isPrivate,
            schedule,
            meeting_day: meetingDay,
            member_count: 1,
        })
        .select()
        .single();

    if (error || !data) return null;

    // Auto-join creator
    await joinReadingGroup(data.id, userId);

    return data as ReadingGroup;
}

export async function joinReadingGroup(groupId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('group_members')
        .insert({
            group_id: groupId,
            user_id: userId,
            role: 'member',
        });

    if (!error) {
        await supabase.rpc('increment_group_members', { group_id: groupId });
    }

    return !error;
}

export async function getDiscoverGroups(): Promise<ReadingGroup[]> {
    const { data } = await supabase
        .from('reading_groups')
        .select('*')
        .eq('is_private', false)
        .order('member_count', { ascending: false })
        .limit(20);

    return data || [];
}

export async function getUserGroups(userId: string): Promise<ReadingGroup[]> {
    const { data } = await supabase
        .from('group_members')
        .select('reading_groups(*)')
        .eq('user_id', userId);

    return data?.map((d: any) => d.reading_groups).filter(Boolean) || [];
}

export async function setGroupBook(groupId: string, bookId: string): Promise<boolean> {
    const { error } = await supabase
        .from('reading_groups')
        .update({ current_book: bookId })
        .eq('id', groupId);

    return !error;
}
