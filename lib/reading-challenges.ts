import { supabase } from './supabase';

export interface ReadingChallenge {
    id: string;
    title: string;
    description: string;
    challenge_type: 'books_count' | 'pages_count' | 'genre_diversity' | 'author_diversity';
    target: number;
    start_date: string;
    end_date: string;
    is_global: boolean;
    created_by?: string;
    participants_count: number;
    created_at: string;
}

export interface ChallengeParticipant {
    id: string;
    challenge_id: string;
    user_id: string;
    progress: number;
    joined_at: string;
    completed_at?: string;
}

export async function createChallenge(
    userId: string,
    title: string,
    description: string,
    type: ReadingChallenge['challenge_type'],
    target: number,
    startDate: string,
    endDate: string,
    isGlobal: boolean = false
): Promise<ReadingChallenge | null> {
    const { data, error } = await supabase
        .from('reading_challenges')
        .insert({
            title,
            description,
            challenge_type: type,
            target,
            start_date: startDate,
            end_date: endDate,
            is_global: isGlobal,
            created_by: userId,
            participants_count: 1,
        })
        .select()
        .single();

    if (error || !data) return null;

    // Auto-join creator
    await joinChallenge(data.id, userId);

    return data;
}

export async function joinChallenge(challengeId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('challenge_participants')
        .insert({
            challenge_id: challengeId,
            user_id: userId,
            progress: 0,
        });

    if (!error) {
        // Increment participant count
        await supabase.rpc('increment', {
            table_name: 'reading_challenges',
            row_id: challengeId,
            field: 'participants_count',
        });
    }

    return !error;
}

export async function updateChallengeProgress(
    challengeId: string,
    userId: string,
    progress: number
): Promise<boolean> {
    const { error } = await supabase
        .from('challenge_participants')
        .update({ progress })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

    // Check if completed
    const { data: challenge } = await supabase
        .from('reading_challenges')
        .select('target')
        .eq('id', challengeId)
        .single();

    if (challenge && progress >= challenge.target) {
        await supabase
            .from('challenge_participants')
            .update({ completed_at: new Date().toISOString() })
            .eq('challenge_id', challengeId)
            .eq('user_id', userId);
    }

    return !error;
}

export async function getGlobalChallenges(): Promise<ReadingChallenge[]> {
    const { data } = await supabase
        .from('reading_challenges')
        .select('*')
        .eq('is_global', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('participants_count', { ascending: false });

    return data || [];
}

export async function getUserChallenges(userId: string): Promise<ReadingChallenge[]> {
    const { data } = await supabase
        .from('challenge_participants')
        .select('reading_challenges(*), progress, completed_at')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

    return data?.map((d: any) => ({ ...d.reading_challenges, progress: d.progress })) || [];
}
