import { supabase } from './supabase';

/**
 * Persistent authentication utilities
 * Keeps users logged in across browser sessions
 */

export async function setupPersistentAuth() {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
            if (event === 'TOKEN_REFRESHED') {
                console.log('✅ Token refreshed successfully');
            }

            if (event === 'SIGNED_OUT') {
                localStorage.clear();
            }
        }
    );

    return subscription;
}

export async function refreshSessionIfNeeded() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) return null;

    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);

    // Refresh if expires in < 1 hour
    if (expiresAt && (expiresAt - now < 3600)) {
        const { data } = await supabase.auth.refreshSession();
        return data.session;
    }

    return session;
}

export async function attemptAutoLogin() {
    try {
        const session = await refreshSessionIfNeeded();
        return !!session;
    } catch (error) {
        return false;
    }
}
