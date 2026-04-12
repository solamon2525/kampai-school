import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { subject, html, newsTitle } = await req.json();

        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        const FROM_EMAIL = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'news@school.ac.th';

        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set');
        }

        // Get all active subscribers from Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: subscribers, error } = await supabase
            .from('email_subscribers')
            .select('email, name')
            .eq('is_active', true);

        if (error) throw error;
        if (!subscribers || subscribers.length === 0) {
            return new Response(JSON.stringify({ sent: 0, message: 'No active subscribers' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Send email via Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: subscribers.map((s: { email: string }) => s.email),
                subject: subject || `ข่าวสารใหม่: ${newsTitle}`,
                html: html,
            }),
        });

        const result = await res.json();

        return new Response(JSON.stringify({ sent: subscribers.length, result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
