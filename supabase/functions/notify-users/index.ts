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
        const payload: WebhookPayload = await req.json()
        console.log(`Received webhook for table '${payload.table}'`)

        // Logic based on table
        if (payload.table === 'group_messages') {
            const message = payload.record
            // In a real app, we would query the 'group_members' table to get all user push tokens
            // For this demo, we'll log the intention
            console.log(`New message in group ${message.group_id}: ${message.content}`)

            // Example Expo Push API call (commented out as we don't have tokens)
            /*
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
                sound: 'default',
                title: 'New Study Group Message',
                body: message.content,
                data: { someData: 'goes here' },
              }),
            });
            */
        }

        return new Response(JSON.stringify({ message: 'Notification processed' }), {
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
