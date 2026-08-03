#!/usr/bin/env node
/**
 * School-wide indicator_games coverage (paged — PostgREST truncates at 1000).
 * Prefer RPC indicator_coverage_summary after mig 449.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  try {
    const raw = readFileSync('.env.local', 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const v = m[2].replace(/^"|"$/g, '').trim();
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  } catch {
    /* ignore */
  }
}

loadEnvLocal();
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase URL/key in env');
  process.exit(1);
}

const s = createClient(url, key);

const { data: rpc, error: rpcErr } = await s.rpc('indicator_coverage_summary');
if (!rpcErr && rpc) {
  console.log(JSON.stringify({ source: 'rpc', ...rpc }, null, 2));
  process.exit(0);
}

async function fetchAll(table, cols, filter) {
  const page = 1000;
  let from = 0;
  const out = [];
  for (;;) {
    let q = s.from(table).select(cols).range(from, from + page - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < page) break;
    from += page;
  }
  return out;
}

const inds = await fetchAll('curriculum_indicators', 'id,subject_key,grade', (q) =>
  q.eq('is_active', true),
);
const maps = await fetchAll('indicator_games', 'indicator_id,edu_hub_item_id');
const covered = new Set(maps.map((m) => m.indicator_id));
let c = 0;
const by = {};
for (const i of inds) {
  const ok = covered.has(i.id);
  if (ok) c += 1;
  const k = `${i.subject_key}|${i.grade}`;
  by[k] = by[k] || { t: 0, c: 0 };
  by[k].t += 1;
  if (ok) by[k].c += 1;
}
const gaps = Object.entries(by)
  .map(([k, v]) => ({ k, ...v, pct: Math.round((1000 * v.c) / v.t) / 10 }))
  .filter((x) => x.pct < 80)
  .sort((a, b) => a.pct - b.pct);

console.log(
  JSON.stringify(
    {
      source: 'paged',
      rpcError: rpcErr?.message ?? null,
      total: inds.length,
      covered: c,
      pct: Math.round((1000 * c) / inds.length) / 10,
      linkedItems: new Set(maps.map((m) => m.edu_hub_item_id)).size,
      gapBuckets: gaps.length,
      worst: gaps.slice(0, 15),
    },
    null,
    2,
  ),
);
