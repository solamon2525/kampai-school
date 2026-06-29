/**
 * thai-vocab.service.ts — คลังคำศัพท์ Thai Vocab Hub (migration 278)
 */
import { supabase } from '@/integrations/supabase/client';

export type ThaiVocabWord = {
  word: string;
  reading: string;
  meaning: string;
  emoji?: string | null;
  grade?: string | null;
  difficulty?: number | null;
  indicator_code?: string | null;
};

export type ThaiVocabCategory = {
  slug: string;
  title: string;
  icon?: string | null;
  desc?: string | null;
};

export type ThaiVocabCatalog = {
  categories: ThaiVocabCategory[];
  words: Record<string, ThaiVocabWord[]>;
};

export type ThaiVocabMissed = {
  category_slug: string;
  word: string;
  reading: string | null;
  meaning: string | null;
  miss_count: number;
  last_missed_at: string;
};

export type ThaiVocabCategoryStat = {
  slug: string;
  title: string;
  item_count: number;
  with_indicator: number;
};

export type ThaiVocabImportRow = {
  category_slug: string;
  word: string;
  reading: string;
  meaning: string;
  emoji?: string;
  grade?: string;
  difficulty?: number;
  indicator_code?: string;
};

export const thaiVocabService = {
  async getCatalog(): Promise<ThaiVocabCatalog | null> {
    const { data, error } = await supabase.rpc('get_thai_vocab_catalog' as never);
    if (error) throw error;
    if (!data || typeof data !== 'object') return null;
    const d = data as { categories?: ThaiVocabCategory[]; words?: Record<string, ThaiVocabWord[]> };
    return {
      categories: d.categories ?? [],
      words: d.words ?? {},
    };
  },

  async getStats(): Promise<ThaiVocabCategoryStat[]> {
    const { data, error } = await supabase.rpc('get_thai_vocab_stats' as never);
    if (error) throw error;
    return (data ?? []) as ThaiVocabCategoryStat[];
  },

  async getMissedByCode(studentCode: string): Promise<ThaiVocabMissed[]> {
    const { data, error } = await supabase.rpc('get_thai_vocab_missed_by_code' as never, {
      p_student_code: studentCode,
    } as never);
    if (error) throw error;
    return (data ?? []) as ThaiVocabMissed[];
  },

  async recordMissedByCode(
    studentCode: string,
    categorySlug: string,
    words: ThaiVocabWord[],
  ): Promise<number> {
    const payload = words.map((w) => ({
      word: w.word,
      reading: w.reading,
      meaning: w.meaning,
    }));
    const { data, error } = await supabase.rpc('upsert_thai_vocab_missed_by_code' as never, {
      p_student_code: studentCode,
      p_category_slug: categorySlug,
      p_words: payload,
    } as never);
    if (error) throw error;
    return (data as number) ?? 0;
  },

  async upsertCategory(cat: {
    slug: string;
    title: string;
    icon?: string;
    description?: string;
    sort_order?: number;
  }) {
    const { error } = await supabase.from('thai_vocab_categories' as never).upsert({
      slug: cat.slug,
      title: cat.title,
      icon: cat.icon ?? null,
      description: cat.description ?? null,
      sort_order: cat.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    } as never);
    if (error) throw error;
  },

  async upsertItems(rows: ThaiVocabImportRow[]) {
    if (rows.length === 0) return;
    const payload = rows.map((r, i) => ({
      category_slug: r.category_slug,
      word: r.word.trim(),
      reading: r.reading.trim(),
      meaning: r.meaning.trim(),
      emoji: r.emoji?.trim() || null,
      grade: r.grade && ['ป.4', 'ป.5', 'ป.6'].includes(r.grade) ? r.grade : null,
      difficulty: r.difficulty ?? null,
      indicator_code: r.indicator_code?.trim() || null,
      sort_order: i,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('thai_vocab_items' as never).upsert(
      payload as never,
      { onConflict: 'category_slug,word,reading' } as never,
    );
    if (error) throw error;
  },

  async fetchAllItemsForExport(): Promise<ThaiVocabImportRow[]> {
    const { data, error } = await supabase
      .from('thai_vocab_items' as never)
      .select('category_slug, word, reading, meaning, emoji, grade, difficulty, indicator_code, sort_order')
      .order('category_slug')
      .order('sort_order');
    if (error) throw error;
    return ((data ?? []) as ThaiVocabImportRow[]).map((r) => ({
      category_slug: r.category_slug,
      word: r.word,
      reading: r.reading,
      meaning: r.meaning,
      emoji: r.emoji ?? undefined,
      grade: r.grade ?? undefined,
      difficulty: r.difficulty ?? undefined,
      indicator_code: r.indicator_code ?? undefined,
    }));
  },
};

/** แปลง CSV text → rows (header: category_slug,word,reading,meaning,...) */
export function parseVocabCsv(text: string): ThaiVocabImportRow[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const iCat = idx('category_slug');
  const iWord = idx('word');
  const iRead = idx('reading');
  const iMean = idx('meaning');
  if (iCat < 0 || iWord < 0 || iRead < 0 || iMean < 0) {
    throw new Error('CSV ต้องมีคอลัมน์ category_slug, word, reading, meaning');
  }

  const splitCsvLine = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        out.push(cur); cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const rows: ThaiVocabImportRow[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cols = splitCsvLine(lines[li]);
    const word = cols[iWord]?.trim();
    if (!word) continue;
    rows.push({
      category_slug: cols[iCat]?.trim() ?? '',
      word,
      reading: cols[iRead]?.trim() ?? '',
      meaning: cols[iMean]?.trim() ?? '',
      emoji: idx('emoji') >= 0 ? cols[idx('emoji')] : undefined,
      grade: idx('grade') >= 0 ? cols[idx('grade')] : undefined,
      difficulty: idx('difficulty') >= 0 ? Number(cols[idx('difficulty')]) || undefined : undefined,
      indicator_code: idx('indicator_code') >= 0 ? cols[idx('indicator_code')] : undefined,
    });
  }
  return rows.filter((r) => r.category_slug && r.reading && r.meaning);
}

export function vocabRowsToCsv(rows: ThaiVocabImportRow[]): string {
  const header = 'category_slug,word,reading,meaning,emoji,grade,difficulty,indicator_code';
  const esc = (v: string) => (v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
  const body = rows.map((r) => [
    r.category_slug,
    r.word,
    r.reading,
    r.meaning,
    r.emoji ?? '',
    r.grade ?? '',
    r.difficulty != null ? String(r.difficulty) : '',
    r.indicator_code ?? '',
  ].map(esc).join(','));
  return [header, ...body].join('\n');
}
