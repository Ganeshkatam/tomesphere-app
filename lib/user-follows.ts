import { supabase } from './supabase';

export interface UserFollow {
    id: string;
    follower_id: string;
    following_id: string;
    created_at: string;
}

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
    const { error } = await supabase
        .from('user_follows')
        .insert({
            follower_id: followerId,
            following_id: followingId,
        });

    return !error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

    return !error;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

    return !!data;
}

export async function getFollowers(userId: string) {
    const { data } = await supabase
        .from('user_follows')
        .select(`
      id,
      created_at,
      follower:follower_id (
        id,
        email,
        profile:profiles(*)
      )
    `)
        .eq('following_id', userId);

    return data || [];
}

export async function getFollowing(userId: string) {
    const { data } = await supabase
        .from('user_follows')
        .select(`
      id,
      created_at,
      following:following_id (
        id,
        email,
        profile:profiles(*)
      )
    `)
        .eq('follower_id', userId);

    return data || [];
}

export async function getFollowerCount(userId: string): Promise<number> {
    const { count } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

    return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
    const { count } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

    return count || 0;
}
