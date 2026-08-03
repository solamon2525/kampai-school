#!/usr/bin/env node
/** Apply migration 437 via pg (needs SUPABASE_DB_PASSWORD or DATABASE_URL) */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'tmp-pg/package.json'));
const { Client } = require('pg');

const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const sql = readFileSync(resolve(root, 'supabase/migrations/437_student_pet_system.sql'), 'utf8');

const password = process.env.SUPABASE_DB_PASSWORD
  || env.match(/SUPABASE_DB_PASSWORD="?([^\r\n"]+)/)?.[1];
const databaseUrl = process.env.DATABASE_URL
  || env.match(/DATABASE_URL="?([^\r\n"]+)/)?.[1];

if (!password && !databaseUrl) {
  console.error('Set SUPABASE_DB_PASSWORD or DATABASE_URL in env / .env.local');
  process.exit(2);
}

const connectionString = databaseUrl
  || `postgresql://postgres.lkpqssbqxxpasidfqhpb:${encodeURIComponent(password)}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`;

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log('connected');
await client.query(sql);
console.log('applied 437_student_pet_system');
await client.end();
