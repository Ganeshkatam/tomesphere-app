export class BookmarkExport {
    exportToNotion(bookmarks: any[]): string {
        return JSON.stringify(bookmarks);
    }

    exportToEvernote(bookmarks: any[]): string {
        return bookmarks.map(b => `# ${b.title}\n\n${b.note}`).join('\n\n---\n\n');
    }

    exportToObsidian(bookmarks: any[]): string {
        return bookmarks.map(b => `## [[${b.title}]]\n\n${b.note}`).join('\n\n');
    }
}

export const bookmarkExport = new BookmarkExport();
