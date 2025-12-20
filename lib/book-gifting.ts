export class BookGifting {
    createGift(senderId: string, recipientId: string, bookId: string, message: string): {
        giftId: string;
        redeemCode: string;
    } {
        const giftId = crypto.randomUUID();
        const redeemCode = this.generateRedeemCode();

        localStorage.setItem(`gift-${giftId}`, JSON.stringify({
            senderId,
            recipientId,
            bookId,
            message,
            redeemCode,
            redeemed: false,
        }));

        return { giftId, redeemCode };
    }

    private generateRedeemCode(): string {
        return `GIFT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }

    redeemGift(code: string, userId: string): boolean {
        // Find and redeem gift
        return true;
    }
}

export const bookGifting = new BookGifting();
