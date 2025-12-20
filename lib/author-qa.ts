import { supabase } from './supabase';

export interface AuthorQA {
    id: string;
    author_name: string;
    author_id?: string;
    scheduled_date: string;
    duration_minutes: number;
    status: 'upcoming' | 'live' | 'completed';
    participants_count: number;
    created_at: string;
}

export interface QAQuestion {
    id: string;
    qa_session_id: string;
    user_id: string;
    question: string;
    answer?: string;
    answered_at?: string;
    upvotes: number;
    created_at: string;
}

export async function getUpcomingQASessions(): Promise<AuthorQA[]> {
    const now = new Date().toISOString();

    const { data } = await supabase
        .from('author_qa_sessions')
        .select('*')
        .gte('scheduled_date', now)
        .eq('status', 'upcoming')
        .order('scheduled_date', { ascending: true });

    return data || [];
}

export async function joinQASession(sessionId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('qa_participants')
        .insert({
            session_id: sessionId,
            user_id: userId,
        });

    if (!error) {
        await supabase.rpc('increment_qa_participants', { session_id: sessionId });
    }

    return !error;
}

export async function submitQuestion(
    sessionId: string,
    userId: string,
    question: string
): Promise<QAQuestion | null> {
    const { data, error } = await supabase
        .from('qa_questions')
        .insert({
            qa_session_id: sessionId,
            user_id: userId,
            question,
            upvotes: 0,
        })
        .select()
        .single();

    return error ? null : data;
}

export async function upvoteQuestion(questionId: string, userId: string): Promise<boolean> {
    // Check if already upvoted
    const { data: existing } = await supabase
        .from('question_upvotes')
        .select('id')
        .eq('question_id', questionId)
        .eq('user_id', userId)
        .single();

    if (existing) return false;

    const { error } = await supabase
        .from('question_upvotes')
        .insert({ question_id: questionId, user_id: userId });

    if (!error) {
        await supabase.rpc('increment_question_upvotes', { question_id: questionId });
    }

    return !error;
}

export async function getSessionQuestions(sessionId: string): Promise<QAQuestion[]> {
    const { data } = await supabase
        .from('qa_questions')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      )
    `)
        .eq('qa_session_id', sessionId)
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: true });

    return data || [];
}

export async function answerQuestion(
    questionId: string,
    answer: string
): Promise<boolean> {
    const { error } = await supabase
        .from('qa_questions')
        .update({
            answer,
            answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);

    return !error;
}

export function getSessionStatus(session: AuthorQA): string {
    const now = new Date();
    const scheduled = new Date(session.scheduled_date);
    const endTime = new Date(scheduled.getTime() + session.duration_minutes * 60000);

    if (now < scheduled) return 'upcoming';
    if (now >= scheduled && now < endTime) return 'live';
    return 'completed';
}
