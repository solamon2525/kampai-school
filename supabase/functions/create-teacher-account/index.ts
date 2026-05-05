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

    const { staffId, email, password } = await req.json();
    if (!staffId || !email || !password) {
      return json({ error: 'staffId, email และ password จำเป็นต้องกรอก' }, 400);
    }

    // ตรวจว่า staff_id นี้มี account แล้วหรือยัง
    const { data: existing } = await adminClient
      .from('user_roles')
      .select('id')
      .eq('staff_id', staffId)
      .eq('role', 'teacher')
      .maybeSingle();

    if (existing) return json({ error: 'ครูคนนี้มี account อยู่แล้ว' }, 400);

    // สร้าง Supabase auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      const msg = createError.message.toLowerCase().includes('already')
        ? 'อีเมลนี้ถูกใช้งานแล้วในระบบ'
        : createError.message;
      return json({ error: msg }, 400);
    }

    // สร้าง user_roles row
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'teacher', staff_id: staffId });

    if (roleError) {
      // rollback: ลบ user ที่สร้างไป
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return json({ error: 'สร้าง role ไม่สำเร็จ: ' + roleError.message }, 500);
    }

    // อัปเดต staff.email ด้วย
    await adminClient.from('staff').update({ email }).eq('id', staffId);

    return json({ success: true, userId: newUser.user.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
