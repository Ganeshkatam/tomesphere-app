import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Get the User from the Authorization header
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const { filePath } = await req.json()

        // Input Validation
        if (!filePath || typeof filePath !== 'string') {
            return new Response(JSON.stringify({ error: 'filePath is required and must be a string' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        if (filePath.length > 1024) {
            return new Response(JSON.stringify({ error: 'filePath too long' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Prevent directory traversal attacks
        if (filePath.includes('..')) {
            return new Response(JSON.stringify({ error: 'Invalid file path' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Security: Path Scoping
        // Enforce that users can only access their own folder
        // Expected format: user_id/filename
        if (!filePath.startsWith(`${user.id}/`)) {
            console.warn(`[Security Alert] User ${user.id} attempted to access unauthorized path: ${filePath}`)
            return new Response(JSON.stringify({ error: 'Forbidden: You can only generate URLs for your own files' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        // Generate Signed URL for 60 seconds (enough to start download/view)
        const { data, error } = await supabaseClient
            .storage
            .from('academic_resources')
            .createSignedUrl(filePath, 60)

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
