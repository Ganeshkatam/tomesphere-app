export interface SocialShare {
    platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'email';
    content: string;
    url: string;
}

export function shareBook(
    bookTitle: string,
    bookAuthor: string,
    platform: SocialShare['platform'],
    bookUrl?: string
): void {
    const text = `I'm reading "${bookTitle}" by ${bookAuthor} on TomeSphere!`;
    const url = bookUrl || window.location.href;

    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
        email: `mailto:?subject=${encodeURIComponent(`Check out ${bookTitle}`)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
}

export function shareReview(
    bookTitle: string,
    review: string,
    rating: number,
    platform: SocialShare['platform']
): void {
    const stars = '⭐'.repeat(rating);
    const text = `My review of "${bookTitle}": ${stars}\n\n${review.substring(0, 200)}${review.length > 200 ? '...' : ''}`;
    const url = window.location.href;

    shareBook(bookTitle, '', platform, url); // Reuse with custom text
}

export function shareReadingGoal(
    booksRead: number,
    goal: number,
    platform: SocialShare['platform']
): void {
    const percentage = Math.round((booksRead / goal) * 100);
    const text = `I've read ${booksRead} out of ${goal} books this year! (${percentage}%) 📚 Join me on TomeSphere!`;

    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?summary=${encodeURIComponent(text)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
        email: `mailto:?subject=My%20Reading%20Goal&body=${encodeURIComponent(text)}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
    }
}

export function generateShareableLink(
    type: 'book' | 'list' | 'review' | 'profile',
    id: string
): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/${type}/${id}`;
}

export function createRichShareCard(bookData: {
    title: string;
    author: string;
    cover: string;
    rating?: number;
}): string {
    return `
<meta property="og:title" content="${bookData.title}" />
<meta property="og:description" content="by ${bookData.author}" />
<meta property="og:image" content="${bookData.cover}" />
<meta property="og:type" content="book" />
<meta name="twitter:card" content="summary_large_image" />
  `.trim();
}
