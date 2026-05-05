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

    // ตรวจสอบว่าผู้เรียกเป็น admin
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

    const { staffId, newPassword } = await req.json();
    if (!staffId || !newPassword) {
      return json({ error: 'staffId และ newPassword จำเป็นต้องกรอก' }, 400);
    }

    // หา user_id จาก staff_id
    const { data: link, error: linkError } = await adminClient
      .from('user_roles')
      .select('user_id')
      .eq('staff_id', staffId)
      .eq('role', 'teacher')
      .maybeSingle();

    if (linkError || !link) {
      return json({ error: 'ไม่พบ account ของครูคนนี้' }, 404);
    }

    // รีเซ็ตรหัสผ่าน
    const { error: updateError } = await adminClient.auth.admin.updateUserById(link.user_id, {
      password: newPassword,
    });

    if (updateError) return json({ error: updateError.message }, 500);

    return json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
