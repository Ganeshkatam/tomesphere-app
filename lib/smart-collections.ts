import { Book } from './supabase';

export interface SmartCollection {
    id: string;
    name: string;
    description: string;
    rules: CollectionRule[];
    bookCount: number;
    autoUpdate: boolean;
}

export interface CollectionRule {
    field: 'genre' | 'author' | 'year' | 'pages' | 'rating' | 'tags';
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
    value: any;
}

export function createSmartCollection(
    name: string,
    description: string,
    rules: CollectionRule[]
): SmartCollection {
    return {
        id: crypto.randomUUID(),
        name,
        description,
        rules,
        bookCount: 0,
        autoUpdate: true,
    };
}

export function evaluateBook(book: Book, rules: CollectionRule[]): boolean {
    return rules.every(rule => {
        const bookValue = (book as any)[rule.field];

        switch (rule.operator) {
            case 'equals':
                return bookValue === rule.value;
            case 'contains':
                return String(bookValue).toLowerCase().includes(String(rule.value).toLowerCase());
            case 'greater':
                return Number(bookValue) > Number(rule.value);
            case 'less':
                return Number(bookValue) < Number(rule.value);
            case 'between':
                return Number(bookValue) >= rule.value[0] && Number(bookValue) <= rule.value[1];
            default:
                return false;
        }
    });
}

export function getCollectionBooks(collection: SmartCollection, allBooks: Book[]): Book[] {
    return allBooks.filter(book => evaluateBook(book, collection.rules));
}

export const PRESET_COLLECTIONS: Omit<SmartCollection, 'id' | 'bookCount'>[] = [
    {
        name: 'Quick Reads',
        description: 'Books under 200 pages',
        rules: [{ field: 'pages', operator: 'less', value: 200 }],
        autoUpdate: true,
    },
    {
        name: 'Epic Novels',
        description: 'Books over 500 pages',
        rules: [{ field: 'pages', operator: 'greater', value: 500 }],
        autoUpdate: true,
    },
    {
        name: 'Modern Classics',
        description: 'Books from 2000-2020',
        rules: [{ field: 'year', operator: 'between', value: [2000, 2020] }],
        autoUpdate: true,
    },
];
