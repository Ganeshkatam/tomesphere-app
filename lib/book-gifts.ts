import { supabase } from './supabase';

export interface Gift {
    id: string;
    sender_id: string;
    recipient_email: string;
    book_id: string;
    message: string;
    claimed: boolean;
    gift_code: string;
    created_at: string;
    claimed_at?: string;
}

export async function createBookGift(
    senderId: string,
    recipientEmail: string,
    bookId: string,
    message: string
): Promise<Gift | null> {
    const giftCode = generateGiftCode();

    const { data, error } = await supabase
        .from('book_gifts')
        .insert({
            sender_id: senderId,
            recipient_email: recipientEmail,
            book_id: bookId,
            message,
            gift_code: giftCode,
            claimed: false,
        })
        .select()
        .single();

    if (error) return null;

    // Send email notification (would integrate with email service)
    await sendGiftEmail(recipientEmail, giftCode, message);

    return data;
}

export async function claimGift(giftCode: string, userId: string): Promise<boolean> {
    const { data: gift } = await supabase
        .from('book_gifts')
        .select('*')
        .eq('gift_code', giftCode)
        .single();

    if (!gift || gift.claimed) return false;

    // Add book to user's library
    await supabase.from('user_books').insert({
        user_id: userId,
        book_id: gift.book_id,
        status: 'want_to_read',
    });

    // Mark as claimed
    await supabase
        .from('book_gifts')
        .update({
            claimed: true,
            claimed_at: new Date().toISOString(),
        })
        .eq('gift_code', giftCode);

    return true;
}

export async function getUserGifts(userId: string) {
    const { data } = await supabase
        .from('book_gifts')
        .select('*, books(*)')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

    return data || [];
}

function generateGiftCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
        if ((i + 1) % 4 === 0 && i < 11) code += '-';
    }
    return code;
}

async function sendGiftEmail(email: string, code: string, message: string) {
    // Would integrate with email service (SendGrid, Resend, etc.)
    console.log(`Sending gift to ${email} with code ${code}`);
}
