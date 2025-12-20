import { supabase } from './supabase';

export interface BookRelease {
    id: string;
    book_id: string;
    release_date: string;
    is_confirmed: boolean;
    preorder_available: boolean;
    announcement_date: string;
    created_at: string;
}

export async function getUpcomingReleases(limit: number = 20): Promise<BookRelease[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
        .from('book_releases')
        .select('*, book:book_id (*)')
        .gte('release_date', today)
        .order('release_date', { ascending: true })
        .limit(limit);

    return data || [];
}

export async function getReleasesByMonth(year: number, month: number): Promise<BookRelease[]> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data } = await supabase
        .from('book_releases')
        .select('*, book:book_id (*)')
        .gte('release_date', startDate)
        .lte('release_date', endDate)
        .order('release_date', { ascending: true });

    return data || [];
}

export async function setReleaseReminder(
    userId: string,
    bookId: string,
    releaseDate: string
): Promise<boolean> {
    const { error } = await supabase
        .from('release_reminders')
        .insert({
            user_id: userId,
            book_id: bookId,
            release_date: releaseDate,
            reminded: false,
        });

    return !error;
}

export async function getReleaseReminders(userId: string): Promise<any[]> {
    const { data } = await supabase
        .from('release_reminders')
        .select('*, book:book_id (*)')
        .eq('user_id', userId)
        .eq('reminded', false)
        .gte('release_date', new Date().toISOString().split('T')[0])
        .order('release_date', { ascending: true });

    return data || [];
}

export function groupReleasesByMonth(releases: BookRelease[]) {
    const grouped: Record<string, BookRelease[]> = {};

    releases.forEach(release => {
        const date = new Date(release.release_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(release);
    });

    return grouped;
}

export function getMonthName(monthNumber: number): string {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || '';
}

export function getDaysUntilRelease(releaseDate: string): number {
    const release = new Date(releaseDate);
    const today = new Date();
    const diffTime = release.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
