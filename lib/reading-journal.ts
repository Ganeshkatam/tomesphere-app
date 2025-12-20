import { supabase } from './supabase';

export interface ReadingNote {
    id: string;
    user_id: string;
    book_id: string;
    chapter?: string;
    page_number?: number;
    note: string;
    is_private: boolean;
    created_at: string;
    updated_at: string;
}

export async function createNote(
    userId: string,
    bookId: string,
    note: string,
    chapter?: string,
    pageNumber?: number,
    isPrivate: boolean = true
): Promise<ReadingNote | null> {
    const { data, error } = await supabase
        .from('reading_notes')
        .insert({
            user_id: userId,
            book_id: bookId,
            chapter,
            page_number: pageNumber,
            note: note.trim(),
            is_private: isPrivate,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating note:', error);
        return null;
    }

    return data;
}

export async function getBookNotes(bookId: string, userId: string): Promise<ReadingNote[]> {
    const { data } = await supabase
        .from('reading_notes')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return data || [];
}

export async function getUserNotes(userId: string, limit?: number): Promise<ReadingNote[]> {
    let query = supabase
        .from('reading_notes')
        .select('*, books(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (limit) {
        query = query.limit(limit);
    }

    const { data } = await query;
    return data || [];
}

export async function updateNote(noteId: string, note: string): Promise<boolean> {
    const { error } = await supabase
        .from('reading_notes')
        .update({
            note: note.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', noteId);

    return !error;
}

export async function deleteNote(noteId: string): Promise<boolean> {
    const { error } = await supabase
        .from('reading_notes')
        .delete()
        .eq('id', noteId);

    return !error;
}

export async function exportJournal(userId: string): Promise<string> {
    const notes = await getUserNotes(userId);

    // Format as markdown
    let markdown = '# My Reading Journal\n\n';
    markdown += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    markdown += `Total Notes: ${notes.length}\n\n---\n\n`;

    notes.forEach((note: any) => {
        markdown += `## ${note.books?.title || 'Unknown Book'}\n`;
        if (note.chapter) markdown += `**Chapter**: ${note.chapter}\n`;
        if (note.page_number) markdown += `**Page**: ${note.page_number}\n`;
        markdown += `**Date**: ${new Date(note.created_at).toLocaleDateString()}\n\n`;
        markdown += `${note.note}\n\n`;
        markdown += '---\n\n';
    });

    return markdown;
}
