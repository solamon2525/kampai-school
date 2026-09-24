#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));
const allowedTypes = new Set(['standard', 'versus', 'orient', 'ar-zone', 'ar-hands']);
const allowedSubjects = new Set(['thai', 'math', 'english', 'science', 'social', 'health', 'arts', 'tech', 'career']);

if (args.help) usage(0);
if (!args.subject || !args.slug || !args.type) usage(1, 'ต้องระบุ --subject, --slug และ --type');
if (!allowedSubjects.has(args.subject)) fail(`subject ไม่รองรับ: ${args.subject}`);
if (!allowedTypes.has(args.type)) fail(`type ไม่รองรับ: ${args.type}`);
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug)) fail('slug ต้องเป็น lowercase kebab-case');

const typeConfig = {
  standard: { source: 'public/games/_template-folder', folder: true, format: 'เกมโฟลเดอร์มาตรฐาน' },
  versus: { source: 'public/games/_template-versus.html', folder: false, format: 'เกมแข่งขัน KampaiVersus' },
  orient: { source: 'public/games/_template-orient', folder: true, format: 'เกมปรับตามแนวจอ' },
  'ar-zone': { source: 'public/games/_template-ar', folder: true, format: 'เกม AR เคลื่อนไหวร่างกาย' },
  'ar-hands': { source: 'public/games/_template-ar-hands', folder: true, format: 'เกม AR ติดตามมือ' },
}[args.type];

const source = join(repoRoot, typeConfig.source);
const target = typeConfig.folder
  ? join(repoRoot, 'public', 'games', args.subject, args.slug)
  : join(repoRoot, 'public', 'games', args.subject, `${args.slug}.html`);
const migrationNumber = nextMigrationNumber();
const migration = join(repoRoot, 'supabase', 'migrations', `${migrationNumber}_seed_${args.slug.replaceAll('-', '_')}_game.sql`);
const externalUrl = typeConfig.folder
  ? `/games/${args.subject}/${args.slug}/index.html`
  : `/games/${args.subject}/${args.slug}.html`;
const coverUrl = typeConfig.folder
  ? `/games/${args.subject}/${args.slug}/cover.png`
  : `/games/${args.subject}/${args.slug}-cover.png`;

if (!existsSync(source)) fail(`ไม่พบ template: ${relative(repoRoot, source)}`);
if (existsSync(target)) fail(`ปลายทางมีอยู่แล้ว: ${relative(repoRoot, target)}`);
if (existsSync(migration)) fail(`migration มีอยู่แล้ว: ${relative(repoRoot, migration)}`);

const preview = {
  type: args.type,
  source: relative(repoRoot, source),
  target: relative(repoRoot, target),
  migration: relative(repoRoot, migration),
  externalUrl,
  coverUrl,
};

if (args.dryRun) {
  console.log(JSON.stringify(preview, null, 2));
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, { recursive: typeConfig.folder, errorOnExist: true });
replacePlaceholders(target, args.slug, typeConfig.folder);
writeFileSync(migration, migrationSql({
  number: migrationNumber,
  slug: args.slug,
  subject: args.subject,
  title: args.title || 'TODO: ชื่อเกมภาษาไทย',
  externalUrl,
  coverUrl,
  format: typeConfig.format,
}), 'utf8');

console.log('สร้าง scaffold แล้ว:');
console.log(JSON.stringify(preview, null, 2));
console.log('\nตรวจ TODO ทั้งหมด แล้วรัน pnpm verify:game:all -- ' + relative(repoRoot, target));

function parseArgs(values) {
  const parsed = {};
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value === '--help' || value === '-h') parsed.help = true;
    else if (value === '--dry-run') parsed.dryRun = true;
    else if (value.startsWith('--')) {
      const key = value.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (!values[i + 1] || values[i + 1].startsWith('--')) fail(`ไม่มีค่าสำหรับ ${value}`);
      parsed[key] = values[++i];
    } else fail(`argument ไม่รู้จัก: ${value}`);
  }
  return parsed;
}

function usage(code, message) {
  if (message) console.error(message);
  console.error('Usage: pnpm create:game -- --subject <subject> --slug <slug> --type standard|versus|orient|ar-zone|ar-hands [--title <ชื่อไทย>] [--dry-run]');
  process.exit(code);
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function nextMigrationNumber() {
  const dir = join(repoRoot, 'supabase', 'migrations');
  const numbers = readdirSync(dir)
    .map((name) => Number.parseInt(name.match(/^(\d{3})_/)?.[1] || '', 10))
    .filter(Number.isFinite);
  return String(Math.max(...numbers, 0) + 1).padStart(3, '0');
}

function replacePlaceholders(path, slug, isFolder) {
  const files = isFolder
    ? readdirSync(path).filter((name) => /\.(?:html|js|css|svg)$/.test(name)).map((name) => join(path, name))
    : [path];
  for (const file of files) {
    const current = readFileSync(file, 'utf8');
    const updated = current
      .replaceAll('_template-folder', slug)
      .replaceAll('_template-versus', slug)
      .replaceAll('placeholder-versus', slug)
      .replaceAll('_template-orient', slug)
      .replaceAll('_template-ar-hands', slug)
      .replaceAll('_template-ar', slug)
      .replaceAll('TODO-CHANGE-ME', slug)
      .replaceAll('CHANGE-ME', slug);
    if (updated !== current) writeFileSync(file, updated, 'utf8');
  }
}

function migrationSql({ number, slug, subject, title, externalUrl, coverUrl, format }) {
  return `-- ${number}_seed_${slug.replaceAll('-', '_')}_game.sql
-- Generated scaffold: replace every TODO before applying.
DO $$
DECLARE
  v_staff_id UUID;
  v_cat_games UUID;
  v_url TEXT := '${externalUrl}';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category games not found'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', '${title.replaceAll("'", "''")}', v_url, '${subject}', 999
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = '${slug}', tracked_game = true, is_published = true,
      thumbnail_url = '${coverUrl}', bgm_preset = 'playful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id, '${format}',
         ARRAY['TODO: ฟีเจอร์หลัก', 'KAMPAI SDK', 'Responsive 360px'],
         'v1.0.0', 'สร้างครั้งแรก — TODO: อธิบายรูปแบบเกมและการคิดคะแนน'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;
`;
}
