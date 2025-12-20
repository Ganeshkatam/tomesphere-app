import { supabase } from './supabase';

export type MembershipTier = 'free' | 'basic' | 'premium' | 'ultimate';

export interface MembershipPlan {
    tier: MembershipTier;
    name: string;
    price: number;
    features: string[];
    limits: {
        booksPerMonth: number;
        listsMax: number;
        clubsMax: number;
        storageGB: number;
    };
}

export const membershipPlans: Record<MembershipTier, MembershipPlan> = {
    free: {
        tier: 'free',
        name: 'Free Reader',
        price: 0,
        features: [
            'Track up to 50 books',
            'Join 2 book clubs',
            'Basic recommendations',
            '1GB storage',
        ],
        limits: {
            booksPerMonth: 50,
            listsMax: 5,
            clubsMax: 2,
            storageGB: 1,
        },
    },
    basic: {
        tier: 'basic',
        name: 'Book Lover',
        price: 4.99,
        features: [
            'Track unlimited books',
            'Join 5 book clubs',
            'Advanced AI recommendations',
            '5GB storage',
            'Priority support',
            'Ad-free experience',
        ],
        limits: {
            booksPerMonth: -1,
            listsMax: 20,
            clubsMax: 5,
            storageGB: 5,
        },
    },
    premium: {
        tier: 'premium',
        name: 'Super Reader',
        price: 9.99,
        features: [
            'Everything in Basic',
            'Join unlimited clubs',
            'Create private clubs',
            'Advanced analytics',
            '20GB storage',
            'Early feature access',
            'Custom themes',
        ],
        limits: {
            booksPerMonth: -1,
            listsMax: -1,
            clubsMax: -1,
            storageGB: 20,
        },
    },
    ultimate: {
        tier: 'ultimate',
        name: 'Literary Master',
        price: 19.99,
        features: [
            'Everything in Premium',
            'Author Q&A access',
            'Exclusive book previews',
            'Personal reading consultant',
            '100GB storage',
            'API access',
            'White-label options',
        ],
        limits: {
            booksPerMonth: -1,
            listsMax: -1,
            clubsMax: -1,
            storageGB: 100,
        },
    },
};

export async function getUserMembership(userId: string): Promise<MembershipTier> {
    const { data } = await supabase
        .from('user_memberships')
        .select('tier')
        .eq('user_id', userId)
        .single();

    return (data?.tier as MembershipTier) || 'free';
}

export async function upgradeMembership(
    userId: string,
    newTier: MembershipTier
): Promise<boolean> {
    const { error } = await supabase
        .from('user_memberships')
        .upsert({
            user_id: userId,
            tier: newTier,
            upgraded_at: new Date().toISOString(),
        });

    return !error;
}

export function canUserPerformAction(
    userTier: MembershipTier,
    action: string,
    currentUsage: number
): boolean {
    const plan = membershipPlans[userTier];

    switch (action) {
        case 'create_list':
            return plan.limits.listsMax === -1 || currentUsage < plan.limits.listsMax;
        case 'join_club':
            return plan.limits.clubsMax === -1 || currentUsage < plan.limits.clubsMax;
        case 'add_book':
            return plan.limits.booksPerMonth === -1 || currentUsage < plan.limits.booksPerMonth;
        default:
            return true;
    }
}

export function getMembershipPerks(tier: MembershipTier): string[] {
    const plan = membershipPlans[tier];
    return plan.features;
}

export function calculateUpgradePrice(
    currentTier: MembershipTier,
    targetTier: MembershipTier
): number {
    const currentPrice = membershipPlans[currentTier].price;
    const targetPrice = membershipPlans[targetTier].price;
    return Math.max(0, targetPrice - currentPrice);
}
