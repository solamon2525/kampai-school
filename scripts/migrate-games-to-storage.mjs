#!/usr/bin/env node
/**
 * migrate-games-to-storage.mjs
 *
 * One-shot script to migrate HTML game files from `public/games/{subject}/*.html`
 * (committed to git) into the `edu-hub-games` Supabase Storage bucket — and
 * update `educational_hub_items.external_url` to point to the new Storage URL
 * (with `?v=<timestamp>` for cache-busting).
 *
 * USAGE:
 *   # Migrate a single game (PILOT)
 *   node scripts/migrate-games-to-storage.mjs --slug=pizza-master-chef
 *
 *   # Migrate all remaining games whose external_url still starts with /games/
 *   node scripts/migrate-games-to-storage.mjs
 *
 *   # Dry-run (preview without uploading or updating DB)
 *   node scripts/migrate-games-to-storage.mjs --dry-run
 *
 * ENV REQUIRED (in .env.local or shell):
 *   VITE_SUPABASE_URL          — e.g. https://lkpqssbqxxpasidfqhpb.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  — from Supabase Dashboard → Settings → API → service_role key
 *
 * After successful migration, the original public/games/<subject>/<slug>.html
 * file in git can be deleted (the game now serves from Storage).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// ─── Parse CLI args ─────────────────────────────────────────────────────────
const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const [k, v] = a.replace(/^--/, '').split('=');
        return [k, v ?? true];
    }),
);
const slugFilter = args.slug ?? null;
const subjectFilter = args.subject ?? null;
const dryRun = !!args['dry-run'];

// ─── Load env ───────────────────────────────────────────────────────────────
// Lightweight .env.local loader (no external deps)
const envFile = resolve(REPO_ROOT, '.env.local');
if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('✗ Missing env: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('  Add them to .env.local (service_role key from Supabase Dashboard → Settings → API)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
});

const BUCKET = 'edu-hub-games';

// ─── Main ───────────────────────────────────────────────────────────────────
console.log(`▶ Migrate games to Storage (${dryRun ? 'DRY RUN' : 'LIVE'})`);
if (slugFilter) console.log(`  Filter: slug=${slugFilter}`);
if (subjectFilter) console.log(`  Filter: subject=${subjectFilter}`);

// 1. Fetch items whose external_url still points to /games/ (git-served, pre-migration)
let query = supabase
    .from('educational_hub_items')
    .select('id, title, external_url, subject')
    .like('external_url', '/games/%');

const { data: items, error: qErr } = await query;
if (qErr) {
    console.error('✗ DB query failed:', qErr.message);
    process.exit(1);
}

// 2. Parse subject + slug from URL, filter, and migrate one by one
const decoded = (items ?? []).map((it) => {
    const url = decodeURIComponent(it.external_url ?? '');
    const m = url.match(/^\/games\/([^/]+)\/(.+?)\.html$/);
    return {
        ...it,
        urlSubject: m?.[1] ?? null,
        urlSlug: m?.[2] ?? null,
    };
});

const filtered = decoded.filter((it) => {
    if (!it.urlSubject || !it.urlSlug) return false;
    if (subjectFilter && it.urlSubject !== subjectFilter) return false;
    if (slugFilter && it.urlSlug !== slugFilter) return false;
    return true;
});

if (filtered.length === 0) {
    console.log('✗ No matching items to migrate.');
    process.exit(0);
}

console.log(`▶ ${filtered.length} item(s) to migrate:`);
filtered.forEach((it) => console.log(`  - [${it.urlSubject}/${it.urlSlug}.html] ${it.title}`));

let ok = 0;
let failed = 0;
const failures = [];

for (const item of filtered) {
    const localPath = resolve(REPO_ROOT, 'public/games', item.urlSubject, `${item.urlSlug}.html`);
    if (!existsSync(localPath)) {
        console.error(`  ✗ [${item.urlSlug}] file not found: ${localPath}`);
        failed++;
        failures.push({ item, reason: 'file-not-found' });
        continue;
    }

    const fileBuf = readFileSync(localPath);
    const storagePath = `${item.urlSubject}/${item.urlSlug}.html`;

    if (dryRun) {
        console.log(`  ◌ [${item.urlSlug}] would upload ${(fileBuf.length / 1024).toFixed(1)} KB → ${storagePath}`);
        ok++;
        continue;
    }

    // Upload to Storage (upsert: true so re-runs are safe)
    const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuf, {
            upsert: true,
            contentType: 'text/html',
            cacheControl: '3600',
        });
    if (upErr) {
        console.error(`  ✗ [${item.urlSlug}] upload failed: ${upErr.message}`);
        failed++;
        failures.push({ item, reason: `upload: ${upErr.message}` });
        continue;
    }

    // Build public URL with cache-busting version
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const newUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    // Update item.external_url
    const { error: updErr } = await supabase
        .from('educational_hub_items')
        .update({ external_url: newUrl })
        .eq('id', item.id);
    if (updErr) {
        console.error(`  ✗ [${item.urlSlug}] DB update failed: ${updErr.message}`);
        failed++;
        failures.push({ item, reason: `db-update: ${updErr.message}` });
        continue;
    }

    console.log(`  ✓ [${item.urlSlug}] ${(fileBuf.length / 1024).toFixed(1)} KB → ${newUrl}`);
    ok++;
}

console.log(`\n▶ Done: ${ok} succeeded, ${failed} failed`);
if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  - ${f.item.urlSlug}: ${f.reason}`));
    process.exit(1);
}
