import { supabase } from './supabase';

export interface LiveEvent {
    id: string;
    title: string;
    description: string;
    event_type: 'author_reading' | 'book_discussion' | 'workshop' | 'book_launch';
    host_id: string;
    scheduled_date: string;
    duration_minutes: number;
    meeting_url?: string;
    max_participants?: number;
    participants_count: number;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    created_at: string;
}

export async function getUpcomingEvents(limit: number = 10): Promise<LiveEvent[]> {
    const now = new Date().toISOString();

    const { data } = await supabase
        .from('live_events')
        .select('*')
        .gte('scheduled_date', now)
        .in('status', ['scheduled', 'live'])
        .order('scheduled_date', { ascending: true })
        .limit(limit);

    return data || [];
}

export async function createEvent(
    hostId: string,
    title: string,
    description: string,
    eventType: LiveEvent['event_type'],
    scheduledDate: string,
    durationMinutes: number,
    meetingUrl?: string,
    maxParticipants?: number
): Promise<LiveEvent | null> {
    const { data, error } = await supabase
        .from('live_events')
        .insert({
            title,
            description,
            event_type: eventType,
            host_id: hostId,
            scheduled_date: scheduledDate,
            duration_minutes: durationMinutes,
            meeting_url: meetingUrl,
            max_participants: maxParticipants,
            participants_count: 0,
            status: 'scheduled',
        })
        .select()
        .single();

    return error ? null : data;
}

export async function registerForEvent(eventId: string, userId: string): Promise<boolean> {
    // Check max participants
    const { data: event } = await supabase
        .from('live_events')
        .select('max_participants, participants_count')
        .eq('id', eventId)
        .single();

    if (event?.max_participants && event.participants_count >= event.max_participants) {
        return false; // Event full
    }

    const { error } = await supabase
        .from('event_registrations')
        .insert({
            event_id: eventId,
            user_id: userId,
        });

    if (!error) {
        await supabase.rpc('increment_event_participants', { event_id: eventId });
    }

    return !error;
}

export async function getUserEvents(userId: string): Promise<LiveEvent[]> {
    const { data } = await supabase
        .from('event_registrations')
        .select('live_events(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return data?.map((d: any) => d.live_events).filter(Boolean) || [];
}

export function getEventStatus(event: LiveEvent): 'upcoming' | 'live' | 'ended' {
    const now = new Date();
    const start = new Date(event.scheduled_date);
    const end = new Date(start.getTime() + event.duration_minutes * 60000);

    if (now < start) return 'upcoming';
    if (now >= start && now < end) return 'live';
    return 'ended';
}

export function getTimeUntilEvent(scheduledDate: string): string {
    const now = new Date();
    const event = new Date(scheduledDate);
    const diff = event.getTime() - now.getTime();

    if (diff < 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
