import { Book } from './supabase';

export type CitationFormat = 'apa' | 'mla' | 'chicago' | 'harvard';

interface CitationData {
    author: string;
    title: string;
    publisher?: string;
    year?: string;
    isbn?: string;
}

export function generateCitation(book: Book, format: CitationFormat): string {
    const year = book.release_date ? new Date(book.release_date).getFullYear().toString() : 'n.d.';

    switch (format) {
        case 'apa':
            return generateAPA(book, year);
        case 'mla':
            return generateMLA(book, year);
        case 'chicago':
            return generateChicago(book, year);
        case 'harvard':
            return generateHarvard(book, year);
        default:
            return '';
    }
}

function generateAPA(book: Book, year: string): string {
    // APA 7th Edition: Author, A. A. (Year). Title of work. Publisher.
    const authors = formatAuthorsAPA(book.author);
    const title = italicize(book.title);
    const publisher = book.publisher || 'Unknown Publisher';

    return `${authors} (${year}). ${title}. ${publisher}.`;
}

function generateMLA(book: Book, year: string): string {
    // MLA 9th Edition: Author. Title. Publisher, Year.
    const authors = formatAuthorsMLA(book.author);
    const title = italicize(book.title);
    const publisher = book.publisher || 'Unknown Publisher';

    return `${authors}. ${title}. ${publisher}, ${year}.`;
}

function generateChicago(book: Book, year: string): string {
    // Chicago 17th Edition: Author. Title. Place: Publisher, Year.
    const authors = formatAuthorsChicago(book.author);
    const title = italicize(book.title);
    const publisher = book.publisher || 'Unknown Publisher';

    return `${authors}. ${title}. ${publisher}, ${year}.`;
}

function generateHarvard(book: Book, year: string): string {
    // Harvard: Author (Year) Title. Publisher.
    const authors = formatAuthorsHarvard(book.author);
    const title = italicize(book.title);
    const publisher = book.publisher || 'Unknown Publisher';

    return `${authors} (${year}) ${title}. ${publisher}.`;
}

// Author formatting helpers
function formatAuthorsAPA(author: string): string {
    // Split multiple authors by commas or "and"
    const authors = author.split(/,|\sand\s/);
    if (authors.length === 1) {
        return formatSingleAuthorAPA(authors[0].trim());
    }
    if (authors.length === 2) {
        return `${formatSingleAuthorAPA(authors[0].trim())}, & ${formatSingleAuthorAPA(authors[1].trim())}`;
    }
    // 3+ authors: First author et al.
    return `${formatSingleAuthorAPA(authors[0].trim())}, et al.`;
}

function formatSingleAuthorAPA(name: string): string {
    const parts = name.split(' ');
    if (parts.length === 1) return name;
    const lastName = parts[parts.length - 1];
    const firstInitials = parts.slice(0, -1).map(n => n[0] + '.').join(' ');
    return `${lastName}, ${firstInitials}`;
}

function formatAuthorsMLA(author: string): string {
    const authors = author.split(/,|\sand\s/);
    if (authors.length === 1) {
        return formatSingleAuthorMLA(authors[0].trim());
    }
    if (authors.length === 2) {
        return `${formatSingleAuthorMLA(authors[0].trim())}, and ${authors[1].trim()}`;
    }
    return `${formatSingleAuthorMLA(authors[0].trim())}, et al.`;
}

function formatSingleAuthorMLA(name: string): string {
    const parts = name.split(' ');
    if (parts.length === 1) return name;
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return `${lastName}, ${firstName}`;
}

function formatAuthorsChicago(author: string): string {
    return formatAuthorsMLA(author); // Similar to MLA
}

function formatAuthorsHarvard(author: string): string {
    const authors = author.split(/,|\sand\s/);
    if (authors.length === 1) {
        return formatSingleAuthorHarvard(authors[0].trim());
    }
    if (authors.length === 2) {
        return `${formatSingleAuthorHarvard(authors[0].trim())} and ${formatSingleAuthorHarvard(authors[1].trim())}`;
    }
    return `${formatSingleAuthorHarvard(authors[0].trim())} et al.`;
}

function formatSingleAuthorHarvard(name: string): string {
    const parts = name.split(' ');
    if (parts.length === 1) return name;
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(n => n[0].toUpperCase()).join('.');
    return `${lastName}, ${initials}.`;
}

function italicize(text: string): string {
    // For plain text, we'll use underscores. In UI, this should be rendered as italic
    return `_${text}_`;
}

export function generateBibliography(books: Book[], format: CitationFormat): string {
    const citations = books.map(book => generateCitation(book, format));
    return citations.join('\n\n');
}

export function copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
}
