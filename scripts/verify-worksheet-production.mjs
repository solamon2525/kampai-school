#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesRoot = path.join(repoRoot, 'public', 'games');

function parseEnvFile(file) {
    if (!fs.existsSync(file)) return {};
    return Object.fromEntries(
        fs.readFileSync(file, 'utf8')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#') && line.includes('='))
            .map((line) => {
                const index = line.indexOf('=');
                return [line.slice(0, index), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
            }),
    );
}

function findWorksheetUrls(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) return findWorksheetUrls(target);
        if (entry.name === '_template-worksheet.html' || !entry.name.endsWith('-worksheet.html')) return [];
        return ['/' + path.relative(path.join(repoRoot, 'public'), target).replaceAll('\\', '/')];
    });
}

const env = {
    ...parseEnvFile(path.join(repoRoot, '.env')),
    ...parseEnvFile(path.join(repoRoot, '.env.local')),
    ...process.env,
};
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('verify:worksheet:production — ต้องมี VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY ใน .env.local');
    process.exit(1);
}

const expectedUrls = findWorksheetUrls(gamesRoot).sort();
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: category, error: categoryError } = await supabase
    .from('educational_hub_categories')
    .select('id')
    .eq('category_key', 'worksheets')
    .eq('is_active', true)
    .maybeSingle();

if (categoryError || !category) {
    console.error(`verify:worksheet:production — ไม่พบหมวด worksheets ที่เปิดใช้งาน${categoryError ? `: ${categoryError.message}` : ''}`);
    process.exit(1);
}

const { data: items, error: itemsError } = await supabase
    .from('educational_hub_items')
    .select('external_url')
    .eq('category_id', category.id)
    .eq('is_published', true);

if (itemsError) {
    console.error(`verify:worksheet:production — อ่านคลังใบงานไม่ได้: ${itemsError.message}`);
    process.exit(1);
}

const actualUrls = [...new Set((items ?? []).map((item) => item.external_url).filter(Boolean))].sort();
const missing = expectedUrls.filter((item) => !actualUrls.includes(item));
const extra = actualUrls.filter((item) => !expectedUrls.includes(item));

console.log(`repo=${expectedUrls.length} production=${actualUrls.length} published=${actualUrls.length}`);
if (missing.length) console.error(`ขาดใน production:\n${missing.map((item) => `  - ${item}`).join('\n')}`);
if (extra.length) {
    console.warn(`เกินจาก repo (WARN — ไม่ fail ถ้าไม่มี missing):\n${extra.map((item) => `  - ${item}`).join('\n')}`);
}

// Fail only when repo worksheets are missing from published production catalog.
// Extra legacy URLs are warned; clean with remap/unpublish migrations when ready.
if (missing.length) {
    console.error('FAILED worksheet production parity (missing repo URLs in production)');
    process.exit(1);
}

if (extra.length) {
    console.log(`PASSED worksheet production coverage (${expectedUrls.length}/${expectedUrls.length} repo URLs published; ${extra.length} legacy extras WARN)`);
} else {
    console.log(`PASSED worksheet production parity (${expectedUrls.length}/${actualUrls.length})`);
}
