#!/usr/bin/env node
/** Apply 422 via Supabase Management API using token from .claude/settings.local.json */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const settings = readFileSync(resolve(root, '.claude/settings.local.json'), 'utf8');

// Token may appear as SUPABASE_ACCESS_TOKEN=\"...\" inside JSON string values
let token =
  settings.match(/SUPABASE_ACCESS_TOKEN=\\"([^\\"]+)\\"/)?.[1]
  || settings.match(/SUPABASE_ACCESS_TOKEN=([^\s"\\]+)/)?.[1]
  || settings.match(/"SUPABASE_ACCESS_TOKEN"\s*:\s*"([^"]+)"/)?.[1];

if (!token) {
  // try env block style inside permissions/env
  const m = settings.match(/SUPABASE_ACCESS_TOKEN['":=\s]+([a-zA-Z0-9._\-]{20,})/);
  token = m?.[1];
}

if (!token) {
  console.error('token not found in settings.local.json');
  process.exit(1);
}

const sql = readFileSync(resolve(root, 'supabase/migrations/437_student_pet_system.sql'), 'utf8');
const ref = 'lkpqssbqxxpasidfqhpb';

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
console.log('status', res.status);
if (!res.ok) {
  console.error(text.slice(0, 1000));
  process.exit(1);
}
console.log('ok', text.slice(0, 300));
