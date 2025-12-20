import { supabase } from './supabase';

export interface BookClub {
    id: string;
    name: string;
    description: string;
    created_by: string;
    is_public: boolean;
    max_members?: number;
    current_book?: string;
    created_at: string;
    updated_at: string;
}

export interface ClubMember {
    id: string;
    club_id: string;
    user_id: string;
    role: 'owner' | 'moderator' | 'member';
    joined_at: string;
}

export interface ClubEvent {
    id: string;
    club_id: string;
    title: string;
    description: string;
    event_date: string;
    meeting_link?: string;
    created_at: string;
}

export async function createBookClub(
    userId: string,
    name: string,
    description: string,
    isPublic: boolean = true
): Promise<BookClub | null> {
    const { data: club, error } = await supabase
        .from('book_clubs')
        .insert({
            name,
            description,
            created_by: userId,
            is_public: isPublic,
        })
        .select()
        .single();

    if (error || !club) return null;

    // Add creator as owner
    await supabase.from('club_members').insert({
        club_id: club.id,
        user_id: userId,
        role: 'owner',
    });

    return club;
}

export async function joinClub(clubId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('club_members')
        .insert({
            club_id: clubId,
            user_id: userId,
            role: 'member',
        });

    return !error;
}

export async function leaveClub(clubId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId);

    return !error;
}

export async function getClubMembers(clubId: string) {
    const { data } = await supabase
        .from('club_members')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      )
    `)
        .eq('club_id', clubId)
        .order('joined_at', { ascending: true });

    return data || [];
}

export async function getUserClubs(userId: string): Promise<BookClub[]> {
    const { data } = await supabase
        .from('club_members')
        .select('book_clubs!inner(*)')
        .eq('user_id', userId);

    if (!data) return [];

    return data
        .map((item: any) => item.book_clubs)
        .filter((club: any): club is BookClub => !!club);
}

export async function scheduleClubEvent(
    clubId: string,
    title: string,
    description: string,
    eventDate: string,
    meetingLink?: string
): Promise<ClubEvent | null> {
    const { data, error } = await supabase
        .from('club_events')
        .insert({
            club_id: clubId,
            title,
            description,
            event_date: eventDate,
            meeting_link: meetingLink,
        })
        .select()
        .single();

    return error ? null : data;
}
