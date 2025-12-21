import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE'
    table: string
    record: any
    schema: string
    old_record: any
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Security: Validate Webhook Secret
        const secret = req.headers.get('x-webhook-secret')
        const expectedSecret = Deno.env.get('WEBHOOK_SECRET')

        if (!expectedSecret || secret !== expectedSecret) {
            console.warn('[Security Alert] Unauthorized webhook attempt: Invalid or missing secret')
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const payload: WebhookPayload = await req.json()

        // Input Validation: Whitelist Tables
        const ALLOWED_TABLES = ['group_messages']
        if (!ALLOWED_TABLES.includes(payload.table)) {
            console.warn(`[Security Alert] Webhook received for unauthorized table: ${payload.table}`)
            return new Response(JSON.stringify({ error: 'Table not allowed' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        console.log(`Received secure webhook for table '${payload.table}'`)

        // Logic based on table
        if (payload.table === 'group_messages') {
            const message = payload.record
            // Securely access secrets if needed (e.g., EXPO_ACCESS_TOKEN)
            // const expoToken = Deno.env.get('EXPO_ACCESS_TOKEN')

            // In a real app, we would query the 'group_members' table to get all user push tokens
            // For this demo, we'll log the intention
            // Sanitize log to not leak sensitive message content if strict logging is required
            console.log(`New message in group ${message.group_id} processed.`)

            // Example Expo Push API call (commented out as we don't have tokens)
            /*
            await fetch('https://exp.host/--/api/v2/push/send', {
              // ...
            });
            */
        }

        return new Response(JSON.stringify({ message: 'Notification processed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Webhook error:', error.message)
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
