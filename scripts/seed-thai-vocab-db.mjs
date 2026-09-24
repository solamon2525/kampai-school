#!/usr/bin/env node
/**
 * Seed thai_vocab_categories + thai_vocab_items จาก data/*.json
 * ต้องมี SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL ใน .env.local
 * Usage: node scripts/seed-thai-vocab-db.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'public/games/thai/thai-vocab-hub/data');

function loadEnv() {
  const path = join(ROOT, '.env.local');
  if (!existsSync(path)) return {};
  const env = {};
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ ต้องมี VITE_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ใน .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);
const categories = JSON.parse(readFileSync(join(DATA_DIR, 'categories.json'), 'utf8'));

async function main() {
  console.log('📚 Seeding Thai Vocab Hub to Supabase...\n');

  const catRows = categories.map((c, i) => ({
    slug: c.slug,
    title: c.title,
    icon: c.icon ?? null,
    description: c.desc ?? null,
    sort_order: i * 10,
    updated_at: new Date().toISOString(),
  }));

  const { error: catErr } = await supabase.from('thai_vocab_categories').upsert(catRows);
  if (catErr) throw catErr;
  console.log(`✅ ${catRows.length} categories`);

  let total = 0;
  for (const cat of categories) {
    const words = JSON.parse(readFileSync(join(DATA_DIR, 'words', `${cat.slug}.json`), 'utf8'));
    const rows = words.map((w, i) => ({
      category_slug: cat.slug,
      word: w.word,
      reading: w.reading,
      meaning: w.meaning,
      emoji: w.emoji ?? null,
      grade: w.grade ?? null,
      difficulty: w.difficulty ?? null,
      indicator_code: w.indicator_code ?? null,
      classifier_for: w.classifier_for ?? null,
      pair_id: w.pair_id ?? null,
      synonym_group: w.synonym_group ?? null,
      origin_lang: w.origin_lang ?? null,
      content_status: w.content_status ?? 'approved',
      review_reason: w.review_reason ?? null,
      category_evidence: w.category_evidence ?? null,
      duplicate_rationale: w.duplicate_rationale ?? null,
      image_url: w.image_url ?? null,
      image_alt: w.image_alt ?? null,
      tags: w.tags ?? [],
      note: w.note ?? null,
      sort_order: i,
      updated_at: new Date().toISOString(),
    }));

    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const { error } = await supabase
        .from('thai_vocab_items')
        .upsert(chunk, { onConflict: 'category_slug,word,reading' });
      if (error) throw error;
    }
    total += rows.length;
    const approved = words.filter((word) => word.content_status !== 'quarantined').length;
    console.log(`  ${cat.slug}: ${approved} approved / ${rows.length} raw`);
  }

  console.log(`\n✅ รวม ${total} คำ`);
}

main().catch((e) => {
  console.error('❌', e.message || e);
  process.exit(1);
});
