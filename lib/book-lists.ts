import { supabase } from './supabase';

export interface BookList {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface ListItem {
    id: string;
    list_id: string;
    book_id: string;
    added_at: string;
}

export async function createBookList(
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = false
): Promise<BookList | null> {
    const { data, error } = await supabase
        .from('book_lists')
        .insert({
            user_id: userId,
            name,
            description,
            is_public: isPublic,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating list:', error);
        return null;
    }

    return data;
}

export async function getUserLists(userId: string): Promise<BookList[]> {
    const { data, error } = await supabase
        .from('book_lists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return data || [];
}

export async function addBookToList(listId: string, bookId: string): Promise<boolean> {
    const { error } = await supabase
        .from('list_items')
        .insert({
            list_id: listId,
            book_id: bookId,
        });

    return !error;
}

export async function removeBookFromList(listId: string, bookId: string): Promise<boolean> {
    const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)
        .eq('book_id', bookId);

    return !error;
}

export async function getListBooks(listId: string) {
    const { data, error } = await supabase
        .from('list_items')
        .select(`
      id,
      book_id,
      added_at,
      books (*)
    `)
        .eq('list_id', listId);

    return data || [];
}

export async function deleteList(listId: string): Promise<boolean> {
    const { error } = await supabase
        .from('book_lists')
        .delete()
        .eq('id', listId);

    return !error;
}
