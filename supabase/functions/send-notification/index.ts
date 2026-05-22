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

    const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
            status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return json({ error: 'Unauthorized' }, 401);

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

        const adminClient = createClient(supabaseUrl, serviceRoleKey);

        const callerClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: userError } = await callerClient.auth.getUser();
        if (userError || !user) return json({ error: 'Unauthorized' }, 401);

        const { data: roleRow } = await adminClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

        if (!roleRow) return json({ error: 'Forbidden: ต้องเป็น admin เท่านั้น' }, 403);

        const { subject, html, newsTitle } = await req.json();

        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        const FROM_EMAIL = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'news@school.ac.th';

        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set');
        }

        const { data: subscribers, error } = await adminClient
            .from('email_subscribers')
            .select('email, name')
            .eq('is_active', true);

        if (error) throw error;
        if (!subscribers || subscribers.length === 0) {
            return json({ sent: 0, message: 'No active subscribers' });
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [FROM_EMAIL],
                bcc: subscribers.map((s: { email: string }) => s.email),
                subject: subject || `ข่าวสารใหม่: ${newsTitle}`,
                html: html,
            }),
        });

        const result = await res.json();

        return json({ sent: subscribers.length, result });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
