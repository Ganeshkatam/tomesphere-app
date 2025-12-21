import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name, role } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Initialize Supabase Admin client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (authError) throw authError;

        if (authUser.user) {
            // Create profile entry
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: authUser.user.id,
                    email,
                    name,
                    role: role || 'user',
                    created_at: new Date().toISOString()
                });

            if (profileError) {
                // Rollback auth user creation if profile fails (optional, but good practice)
                await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
                throw profileError;
            }
        }

        return NextResponse.json({ success: true, user: authUser.user });
    } catch (error: any) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create user' },
            { status: 500 }
        );
    }
}
