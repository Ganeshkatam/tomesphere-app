import { supabase } from './supabase';

export interface ReadingGoal {
    id: string;
    user_id: string;
    year: number;
    target_books: number;
    books_read: number;
    created_at: string;
}

export async function getReadingGoal(userId: string, year: number = new Date().getFullYear()): Promise<ReadingGoal | null> {
    const { data, error } = await supabase
        .from('reading_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .single();

    if (error || !data) return null;
    return data;
}

export async function createReadingGoal(userId: string, targetBooks: number, year: number = new Date().getFullYear()): Promise<ReadingGoal | null> {
    const { data, error } = await supabase
        .from('reading_goals')
        .insert({
            user_id: userId,
            year,
            target_books: targetBooks,
            books_read: 0,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating goal:', error);
        return null;
    }

    return data;
}

export async function updateReadingGoal(goalId: string, booksRead: number): Promise<boolean> {
    const { error } = await supabase
        .from('reading_goals')
        .update({ books_read: booksRead })
        .eq('id', goalId);

    return !error;
}

export function calculateProgress(booksRead: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(Math.round((booksRead / target) * 100), 100);
}

export function getProjectedFinish(booksRead: number, target: number): string {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const daysPassed = Math.floor((now.getTime() - yearStart.getTime()) / 86400000);

    if (booksRead === 0 || daysPassed === 0) {
        return 'On track';
    }

    const rate = booksRead / daysPassed;
    const daysNeeded = Math.ceil((target - booksRead) / rate);
    const projectedDate = new Date(now.getTime() + daysNeeded * 86400000);
    const yearEnd = new Date(now.getFullYear(), 11, 31);

    if (projectedDate <= yearEnd) {
        return `On track! (${projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    } else {
        const booksBehind = Math.ceil(target - (rate * 365));
        return `${booksBehind} books behind`;
    }
}
