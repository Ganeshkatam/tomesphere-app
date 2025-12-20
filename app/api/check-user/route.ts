import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email)
            .single();

        return NextResponse.json({ exists: !!data && !error });
    } catch (error) {
        console.error('Check user error:', error);
        return NextResponse.json({ exists: false });
    }
}
