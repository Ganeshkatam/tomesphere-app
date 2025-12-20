export interface BookAnnotation {
    id: string;
    userId: string;
    bookId: string;
    type: 'highlight' | 'note' | 'bookmark';
    content: string;
    location: {
        chapter?: string;
        page?: number;
        position?: number;
        text?: string;
    };
    color?: string;
    createdAt: string;
}

export interface ReadingSession {
    bookId: string;
    currentPosition: number;
    progress: number;
    lastRead: string;
}

export class AnnotationManager {
    private annotations: Map<string, BookAnnotation[]> = new Map();

    addHighlight(
        userId: string,
        bookId: string,
        text: string,
        location: BookAnnotation['location'],
        color: string = '#ffff00'
    ): BookAnnotation {
        const annotation: BookAnnotation = {
            id: crypto.randomUUID(),
            userId,
            bookId,
            type: 'highlight',
            content: text,
            location,
            color,
            createdAt: new Date().toISOString(),
        };

        this.saveAnnotation(annotation);
        return annotation;
    }

    addNote(
        userId: string,
        bookId: string,
        note: string,
        location: BookAnnotation['location']
    ): BookAnnotation {
        const annotation: BookAnnotation = {
            id: crypto.randomUUID(),
            userId,
            bookId,
            type: 'note',
            content: note,
            location,
            createdAt: new Date().toISOString(),
        };

        this.saveAnnotation(annotation);
        return annotation;
    }

    addBookmark(
        userId: string,
        bookId: string,
        location: BookAnnotation['location']
    ): BookAnnotation {
        const annotation: BookAnnotation = {
            id: crypto.randomUUID(),
            userId,
            bookId,
            type: 'bookmark',
            content: `Bookmark at ${location.page || location.chapter}`,
            location,
            createdAt: new Date().toISOString(),
        };

        this.saveAnnotation(annotation);
        return annotation;
    }

    private saveAnnotation(annotation: BookAnnotation): void {
        const key = `${annotation.userId}-${annotation.bookId}`;
        const existing = this.annotations.get(key) || [];
        existing.push(annotation);
        this.annotations.set(key, existing);

        // Save to localStorage
        localStorage.setItem(`annotations-${key}`, JSON.stringify(existing));
    }

    getAnnotations(userId: string, bookId: string): BookAnnotation[] {
        const key = `${userId}-${bookId}`;
        const stored = localStorage.getItem(`annotations-${key}`);

        if (stored) {
            const annotations = JSON.parse(stored);
            this.annotations.set(key, annotations);
            return annotations;
        }

        return this.annotations.get(key) || [];
    }

    deleteAnnotation(userId: string, bookId: string, annotationId: string): boolean {
        const key = `${userId}-${bookId}`;
        const annotations = this.getAnnotations(userId, bookId);
        const filtered = annotations.filter(a => a.id !== annotationId);

        this.annotations.set(key, filtered);
        localStorage.setItem(`annotations-${key}`, JSON.stringify(filtered));

        return true;
    }

    exportAnnotations(userId: string, bookId: string): string {
        const annotations = this.getAnnotations(userId, bookId);

        let output = `# Annotations for Book\n\n`;

        const highlights = annotations.filter(a => a.type === 'highlight');
        const notes = annotations.filter(a => a.type === 'note');
        const bookmarks = annotations.filter(a => a.type === 'bookmark');

        if (highlights.length > 0) {
            output += `## Highlights\n\n`;
            highlights.forEach(h => {
                output += `- "${h.content}" (${h.location.page ? `Page ${h.location.page}` : h.location.chapter})\n`;
            });
            output += '\n';
        }

        if (notes.length > 0) {
            output += `## Notes\n\n`;
            notes.forEach(n => {
                output += `**${n.location.page ? `Page ${n.location.page}` : n.location.chapter}**: ${n.content}\n\n`;
            });
        }

        if (bookmarks.length > 0) {
            output += `## Bookmarks\n\n`;
            bookmarks.forEach(b => {
                output += `- ${b.location.page ? `Page ${b.location.page}` : b.location.chapter}\n`;
            });
        }

        return output;
    }
}

export const annotationManager = new AnnotationManager();
