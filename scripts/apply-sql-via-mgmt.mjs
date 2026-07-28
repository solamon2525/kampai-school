#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const settings = readFileSync(resolve(root, '.claude/settings.local.json'), 'utf8');
const token =
  settings.match(/SUPABASE_ACCESS_TOKEN=\\"([^\\"]+)\\"/)?.[1]
  || settings.match(/SUPABASE_ACCESS_TOKEN=([^\s"\\]+)/)?.[1]
  || settings.match(/"SUPABASE_ACCESS_TOKEN"\s*:\s*"([^"]+)"/)?.[1]
  || settings.match(/SUPABASE_ACCESS_TOKEN['":=\s]+([a-zA-Z0-9._\-]{20,})/)?.[1];

const sqlPath = process.argv[2];
if (!token || !sqlPath) {
  console.error('usage: node scripts/apply-sql-via-mgmt.mjs <file.sql>');
  process.exit(1);
}

const sql = readFileSync(resolve(root, sqlPath), 'utf8').replace(/^\uFEFF/, '');
const res = await fetch('https://api.supabase.com/v1/projects/lkpqssbqxxpasidfqhpb/database/query', {
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
  console.error(text.slice(0, 1500));
  process.exit(1);
}
console.log('ok');
