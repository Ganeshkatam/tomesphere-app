export interface UserGeneratedContent {
    id: string;
    userId: string;
    type: 'review' | 'list' | 'article' | 'recommendation';
    title: string;
    content: string;
    bookReferences: string[];
    tags: string[];
    isPublic: boolean;
    likes: number;
    views: number;
    createdAt: string;
    updatedAt: string;
}

export class ContentCreationTools {
    private autosaveInterval: number = 30000; // 30 seconds
    private autosaveTimer: any = null;

    startAutosave(contentId: string, getContent: () => string): void {
        this.stopAutosave();

        this.autosaveTimer = setInterval(() => {
            const content = getContent();
            this.saveLocal(contentId, content);
        }, this.autosaveInterval);
    }

    stopAutosave(): void {
        if (this.autosaveTimer) {
            clearInterval(this.autosaveTimer);
            this.autosaveTimer = null;
        }
    }

    private saveLocal(contentId: string, content: string): void {
        localStorage.setItem(`draft-${contentId}`, JSON.stringify({
            content,
            savedAt: new Date().toISOString(),
        }));
    }

    loadDraft(contentId: string): { content: string; savedAt: string } | null {
        const stored = localStorage.getItem(`draft-${contentId}`);
        return stored ? JSON.parse(stored) : null;
    }

    deleteDraft(contentId: string): void {
        localStorage.removeItem(`draft-${contentId}`);
    }

    formatMarkdown(text: string): string {
        // Bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Headers
        text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        // Links
        text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
        // Paragraphs
        text = text.replace(/\n\n/g, '</p><p>');

        return `<p>${text}</p>`;
    }

    insertBookReference(content: string, bookId: string, bookTitle: string): string {
        const reference = `[${bookTitle}](/book/${bookId})`;
        return content + '\n\n' + reference;
    }

    generateTemplate(type: UserGeneratedContent['type']): string {
        const templates = {
            review: `# Book Review\n\n## What I Loved\n\n\n## What Could Be Better\n\n\n## Final Thoughts\n\n\n**Rating:** ⭐⭐⭐⭐⭐`,
            list: `# My Reading List\n\n## Description\n\n\n## Books\n\n1. \n2. \n3. `,
            article: `# Article Title\n\n## Introduction\n\n\n## Main Content\n\n\n## Conclusion\n\n`,
            recommendation: `# Book Recommendation\n\n## Why I Recommend This Book\n\n\n## Who Should Read It\n\n\n## Similar Books\n\n`,
        };

        return templates[type] || '';
    }

    validateContent(content: UserGeneratedContent): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!content.title || content.title.trim().length < 3) {
            errors.push('Title must be at least 3 characters');
        }

        if (!content.content || content.content.trim().length < 50) {
            errors.push('Content must be at least 50 characters');
        }

        if (content.title.length > 200) {
            errors.push('Title must be less than 200 characters');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    estimateReadingTime(content: string): number {
        const wordsPerMinute = 200;
        const words = content.trim().split(/\s+/).length;
        return Math.ceil(words / wordsPerMinute);
    }
}

export const contentTools = new ContentCreationTools();
