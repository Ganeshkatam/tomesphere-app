import { supabase } from './supabase';

export interface BookTrailer {
    id: string;
    book_id: string;
    title: string;
    video_url: string;
    thumbnail_url: string;
    duration_seconds: number;
    views_count: number;
    created_at: string;
}

export async function getBookTrailers(bookId: string): Promise<BookTrailer[]> {
    const { data } = await supabase
        .from('book_trailers')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

    return data || [];
}

export async function getTrendingTrailers(limit: number = 10): Promise<BookTrailer[]> {
    const { data } = await supabase
        .from('book_trailers')
        .select('*, book:book_id (*)')
        .order('views_count', { ascending: false })
        .limit(limit);

    return data || [];
}

export async function incrementTrailerViews(trailerId: string): Promise<void> {
    await supabase.rpc('increment_trailer_views', { trailer_id: trailerId });
}

export function getVideoEmbedUrl(videoUrl: string): string {
    // Convert various video URLs to embed format
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = extractYouTubeId(videoUrl);
        return `https://www.youtube.com/embed/${videoId}`;
    }
    if (videoUrl.includes('vimeo.com')) {
        const videoId = videoUrl.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}`;
    }
    return videoUrl;
}

function extractYouTubeId(url: string): string {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return '';
}

export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
