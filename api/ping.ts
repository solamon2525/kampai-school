const SUPABASE_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHFzc2JxeHhwYXNpZGZxaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyMjgsImV4cCI6MjA5MTI0MTIyOH0.X7YsSlrgYl9ifLWvgyZI04PtebK572pacadfNlmNO-A';

export default async function handler(req: any, res: any) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/school_settings?select=key&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const timestamp = new Date().toISOString();
    console.log(`[Supabase Ping] ${timestamp} — HTTP ${response.status}`);

    return res.status(200).json({
      success: response.ok,
      status: response.status,
      timestamp,
      message: response.ok ? '✅ Supabase is alive' : '⚠️ Supabase error',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
