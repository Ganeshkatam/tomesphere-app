import { supabase } from './supabase';

export interface ActivityFeed {
    id: string;
    userId: string;
    activityType: 'finished_book' | 'started_book' | 'joined_club' | 'posted_review' | 'achieved_badge';
    description: string;
    metadata: any;
    isPublic: boolean;
    createdAt: string;
}

export async function createActivity(
    userId: string,
    type: ActivityFeed['activityType'],
    description: string,
    metadata: any = {},
    isPublic: boolean = true
): Promise<ActivityFeed | null> {
    const { data, error } = await supabase
        .from('activity_feed')
        .insert({
            user_id: userId,
            activity_type: type,
            description,
            metadata,
            is_public: isPublic,
        })
        .select()
        .single();

    return error ? null : data;
}

export async function getActivityFeed(userId: string, limit: number = 20): Promise<ActivityFeed[]> {
    // Get activities from user and their followers
    const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

    const followingIds = following?.map(f => f.following_id) || [];
    const userIds = [userId, ...followingIds];

    const { data } = await supabase
        .from('activity_feed')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      )
    `)
        .in('user_id', userIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

export async function getUserActivities(userId: string, limit: number = 10): Promise<ActivityFeed[]> {
    const { data } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

export function formatActivityDescription(activity: ActivityFeed): string {
    const templates = {
        finished_book: `Finished reading "${activity.metadata.bookTitle}"`,
        started_book: `Started reading "${activity.metadata.bookTitle}"`,
        joined_club: `Joined "${activity.metadata.clubName}" book club`,
        posted_review: `Reviewed "${activity.metadata.bookTitle}"`,
        achieved_badge: `Earned the "${activity.metadata.badgeName}" badge`,
    };

    return templates[activity.activityType] || activity.description;
}
