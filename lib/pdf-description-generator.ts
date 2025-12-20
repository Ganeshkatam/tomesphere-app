import { supabase } from './supabase';

/**
 * Generate a book description from PDF content using AI
 * This extracts text from the first few pages and generates a description
 */
export async function generateDescriptionFromPDF(pdfUrl: string): Promise<string> {
    try {
        // For now, we'll use a simple approach - you can enhance this with actual PDF parsing
        // and OpenAI/Claude API integration later

        // Fetch PDF metadata or use OpenAI to analyze
        const response = await fetch('/api/generate-description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pdfUrl }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate description');
        }

        const data = await response.json();
        return data.description;
    } catch (error) {
        console.error('Error generating description:', error);
        throw error;
    }
}

/**
 * Extract basic metadata from PDF filename and generate a simple description
 * This is a fallback when AI is not available
 */
export function generateSimpleDescription(title: string, author?: string): string {
    const descriptions = [
        `"${title}" is a comprehensive guide that offers readers valuable insights${author ? ` by ${author}` : ''}. This book explores key concepts and provides practical knowledge for both beginners and experienced readers.`,

        `Dive into "${title}"${author ? ` by ${author}` : ''}, an engaging read that combines theory with real-world applications. Perfect for anyone looking to expand their understanding of the subject matter.`,

        `"${title}" presents a thorough examination of its subject${author ? `, brought to you by ${author}` : ''}. Readers will find clear explanations, useful examples, and actionable takeaways throughout.`,

        `Explore the depths of knowledge in "${title}"${author ? ` authored by ${author}` : ''}. This work offers a balanced blend of fundamental principles and advanced concepts.`,
    ];

    return descriptions[Math.floor(Math.random() * descriptions.length)];
}
