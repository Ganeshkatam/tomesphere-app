export interface ContentReport {
    id: string;
    reportedBy: string;
    contentType: 'review' | 'comment' | 'post' | 'profile';
    contentId: string;
    reason: string;
    details?: string;
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    createdAt: string;
}

export class ContentModerationSystem {
    private blockedWords: Set<string> = new Set([
        // Add inappropriate words
    ]);

    moderateText(text: string): { isClean: boolean; filteredText: string; violations: string[] } {
        const violations: string[] = [];
        let filteredText = text;

        // Check for blocked words
        this.blockedWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(text)) {
                violations.push(word);
                filteredText = filteredText.replace(regex, '***');
            }
        });

        // Check for spam patterns
        if (this.detectSpam(text)) {
            violations.push('spam_detected');
        }

        return {
            isClean: violations.length === 0,
            filteredText,
            violations,
        };
    }

    private detectSpam(text: string): boolean {
        // Detect excessive URLs
        const urlCount = (text.match(/https?:\/\//g) || []).length;
        if (urlCount > 3) return true;

        // Detect excessive caps
        const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
        if (capsRatio > 0.7 && text.length > 20) return true;

        // Detect excessive repetition
        const words = text.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        if (words.length > 10 && uniqueWords.size / words.length < 0.3) return true;

        return false;
    }

    async reportContent(
        reportedBy: string,
        contentType: ContentReport['contentType'],
        contentId: string,
        reason: string,
        details?: string
    ): Promise<ContentReport> {
        const report: ContentReport = {
            id: crypto.randomUUID(),
            reportedBy,
            contentType,
            contentId,
            reason,
            details,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        // Save to localStorage (would use database in production)
        const reports = this.getReports();
        reports.push(report);
        localStorage.setItem('content-reports', JSON.stringify(reports));

        return report;
    }

    getReports(): ContentReport[] {
        const stored = localStorage.getItem('content-reports');
        return stored ? JSON.parse(stored) : [];
    }

    async reviewReport(reportId: string, action: 'resolve' | 'dismiss'): Promise<boolean> {
        const reports = this.getReports();
        const report = reports.find(r => r.id === reportId);

        if (!report) return false;

        report.status = action === 'resolve' ? 'resolved' : 'dismissed';
        localStorage.setItem('content-reports', JSON.stringify(reports));

        return true;
    }

    getRiskScore(text: string): number {
        let score = 0;

        const { violations } = this.moderateText(text);
        score += violations.length * 20;

        if (this.detectSpam(text)) score += 30;

        return Math.min(100, score);
    }
}

export const moderationSystem = new ContentModerationSystem();
