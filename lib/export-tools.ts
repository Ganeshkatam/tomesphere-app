export interface DataExport {
    format: 'csv' | 'json' | 'pdf' | 'markdown';
    data: any;
    filename: string;
}

export class DataExportTools {
    exportToCSV(data: any[], filename: string): void {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header =>
                JSON.stringify(row[header] || '')
            ).join(','))
        ].join('\n');

        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }

    exportToJSON(data: any, filename: string): void {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }

    exportToMarkdown(data: any, filename: string): void {
        let markdown = '';

        if (Array.isArray(data)) {
            // Table format
            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                markdown += '| ' + headers.join(' | ') + ' |\n';
                markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

                data.forEach(row => {
                    markdown += '| ' + headers.map(h => row[h] || '').join(' | ') + ' |\n';
                });
            }
        } else {
            // Object format
            markdown = this.objectToMarkdown(data);
        }

        this.downloadFile(markdown, `${filename}.md`, 'text/markdown');
    }

    private objectToMarkdown(obj: any, level: number = 1): string {
        let md = '';

        for (const [key, value] of Object.entries(obj)) {
            md += '#'.repeat(level) + ` ${key}\n\n`;

            if (typeof value === 'object' && !Array.isArray(value)) {
                md += this.objectToMarkdown(value, level + 1);
            } else if (Array.isArray(value)) {
                value.forEach(item => {
                    md += `- ${typeof item === 'object' ? JSON.stringify(item) : item}\n`;
                });
                md += '\n';
            } else {
                md += `${value}\n\n`;
            }
        }

        return md;
    }

    private downloadFile(content: string, filename: string, mimeType: string): void {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    exportReadingData(userId: string, books: any[]): void {
        const exportData = {
            user: userId,
            exportDate: new Date().toISOString(),
            totalBooks: books.length,
            books: books.map(book => ({
                title: book.title,
                author: book.author,
                genre: book.genre,
                finishedDate: book.finished_at,
                rating: book.rating,
                pages: book.pages,
            })),
        };

        this.exportToJSON(exportData, `reading-data-${new Date().toISOString().split('T')[0]}`);
    }

    exportStatistics(stats: any): void {
        this.exportToMarkdown(stats, `reading-statistics-${new Date().toISOString().split('T')[0]}`);
    }
}

export const exportTools = new DataExportTools();
