// Vercel Cron → triggers the facebook-fetch edge function on a schedule so the
// Facebook feed (and auto-synced news rows) stay fresh without an admin visit.
// Auth: Vercel adds `Authorization: Bearer ${CRON_SECRET}` to cron invocations;
// the edge function itself is unlocked via the matching `x-cron-secret` header.
const SUPABASE_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHFzc2JxeHhwYXNpZGZxaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyMjgsImV4cCI6MjA5MTI0MTIyOH0.X7YsSlrgYl9ifLWvgyZI04PtebK572pacadfNlmNO-A';

export default async function handler(req: any, res: any) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(500).json({ success: false, error: 'CRON_SECRET not configured' });
  }
  if (req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/facebook-fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-cron-secret': cronSecret,
      },
      body: '{}',
    });

    const result = await response.json().catch(() => ({}));
    const timestamp = new Date().toISOString();
    console.log(`[Facebook Sync] ${timestamp} — HTTP ${response.status}`, result);

    return res.status(200).json({ success: response.ok, status: response.status, result, timestamp });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
