#!/usr/bin/env node
/**
 * Export thai_vocab_items จาก Supabase → data/words/*.json (เฟส G)
 * Usage: node scripts/sync-thai-vocab-db-to-json.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
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
const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('❌ ต้องมี VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY ใน .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);
const categories = JSON.parse(readFileSync(join(DATA_DIR, 'categories.json'), 'utf8'));

async function main() {
  console.log('⬇️  Sync DB → JSON...\n');
  let total = 0;

  for (const cat of categories) {
    const { data, error } = await supabase
      .from('thai_vocab_items')
      .select('word, reading, meaning, emoji, grade, difficulty, indicator_code, classifier_for, pair_id, synonym_group, origin_lang, tags, note, content_status, review_reason, category_evidence, duplicate_rationale, image_url, image_alt, sort_order')
      .eq('category_slug', cat.slug)
      .order('sort_order');
    if (error) throw error;

    const rows = (data ?? []).map((r) => {
      const o = {
        word: r.word,
        reading: r.reading,
        meaning: r.meaning,
      };
      if (r.emoji) o.emoji = r.emoji;
      if (r.grade) o.grade = r.grade;
      if (r.difficulty != null) o.difficulty = r.difficulty;
      if (r.indicator_code) o.indicator_code = r.indicator_code;
      if (r.classifier_for) o.classifier_for = r.classifier_for;
      if (r.pair_id) o.pair_id = r.pair_id;
      if (r.synonym_group) o.synonym_group = r.synonym_group;
      if (r.origin_lang) o.origin_lang = r.origin_lang;
      if (r.note) o.note = r.note;
      if (r.tags?.length) o.tags = r.tags;
      if (r.content_status && r.content_status !== 'approved') o.content_status = r.content_status;
      if (r.review_reason) o.review_reason = r.review_reason;
      if (r.category_evidence) o.category_evidence = r.category_evidence;
      if (r.duplicate_rationale) o.duplicate_rationale = r.duplicate_rationale;
      if (r.image_url) o.image_url = r.image_url;
      if (r.image_alt) o.image_alt = r.image_alt;
      return o;
    });

    const outPath = join(DATA_DIR, 'words', `${cat.slug}.json`);
    writeFileSync(outPath, JSON.stringify(rows, null, 2) + '\n', 'utf8');
    total += rows.length;
    console.log(`  ${cat.slug}: ${rows.length} คำ`);
  }

  console.log(`\n✅ รวม ${total} คำ → รัน pnpm build:vocab`);
}

main().catch((e) => {
  console.error('❌', e.message || e);
  process.exit(1);
});
