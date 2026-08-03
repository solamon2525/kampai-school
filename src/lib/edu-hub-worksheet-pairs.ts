/**
 * Media ↔ worksheet pairing for Educational Hub.
 * Convention: *-media.html ↔ *-worksheet.html, plus known seed exceptions.
 */

const EXTRA_PAIRS: Record<string, string> = {
  '/games/thai/fact-opinion.html': '/games/thai/fact-opinion-worksheet.html',
  '/games/english/phonics-chart.html': '/games/english/phonics-worksheet.html',
  '/games/science/water-cycle.html': '/games/science/water-cycle-worksheet.html',
  '/games/health/food-label-media.html': '/games/health/food-label-worksheet.html',
  '/games/math/rect-area-media.html': '/games/math/rect-area-worksheet.html',
  '/games/math/multiplication-thinking-media.html': '/games/math/multiplication-worksheet.html',
  '/games/math/long-division-thinking-media.html': '/games/math/division-worksheet.html',
  '/games/tech/code-craft/index.html': '/games/tech/coding-social-worksheet.html',
  '/games/math/decimal-media.html': '/games/math/decimal-worksheet.html',
  '/games/thai/synonym-media.html': '/games/thai/synonym-worksheet.html',
  '/games/science/moon-phases-media.html': '/games/science/moon-phases-worksheet.html',
  '/games/health/food-groups-media.html': '/games/health/food-groups-worksheet.html',
  '/games/social/good-citizen-media.html': '/games/social/good-citizen-worksheet.html',
  '/games/math/angle-media.html': '/games/math/angle-worksheet.html',
  '/games/thai/thai-implied-meaning-media.html': '/games/thai/thai-implied-meaning-worksheet.html',
  '/games/science/food-chain-media.html': '/games/science/food-chain-worksheet.html',
  '/games/health/handwash-media.html': '/games/health/handwash-worksheet.html',
  '/games/career/waste-sort-media.html': '/games/career/waste-sort-worksheet.html',
  '/games/math/number-line-media.html': '/games/math/number-line-worksheet.html',
  '/games/math/bar-chart-media.html': '/games/math/bar-chart-worksheet.html',
  '/games/science/plant-parts-media.html': '/games/science/plant-parts-worksheet.html',
  '/games/social/sufficiency-media.html': '/games/social/sufficiency-worksheet.html',
  '/games/thai/dictionary-media.html': '/games/thai/dictionary-worksheet.html',
  '/games/math/rounding.html': '/games/math/rounding-worksheet.html',
  '/games/thai/thai-narration-style-media.html': '/games/thai/thai-narration-style-worksheet.html',
  '/games/science/digestive-system-media.html': '/games/science/digestive-system-worksheet.html',
  '/games/health/bone-muscle-media.html': '/games/health/bone-muscle-worksheet.html',
  '/games/arts/color-wheel-media.html': '/games/arts/color-wheel-worksheet.html',
  '/games/math/fraction-pieces.html': '/games/math/fraction-pieces-worksheet.html',
  '/games/thai/sentence-structure.html': '/games/thai/sentence-structure-worksheet.html',
  '/games/science/states-of-matter.html': '/games/science/states-of-matter-worksheet.html',
  '/games/social/thailand-map.html': '/games/social/thailand-map-worksheet.html',
  '/games/career/community-jobs-media.html': '/games/career/community-jobs-worksheet.html',
  '/games/math/math-24-thinking-media.html': '/games/math/math-24-thinking-worksheet.html',
  '/games/thai/thai-word-types.html': '/games/thai/thai-word-types-worksheet.html',
  '/games/science/vertebrate-sort.html': '/games/science/vertebrate-sort-worksheet.html',
  '/games/social/sukhothai-timeline.html': '/games/social/sukhothai-timeline-worksheet.html',
  '/games/english/sight-words-p4.html': '/games/english/sight-words-p4-worksheet.html',
  '/games/math/short-division-thinking-media.html': '/games/math/short-division-worksheet.html',
  '/games/thai/thai-sara-chart.html': '/games/thai/thai-sara-chart-worksheet.html',
  '/games/thai/thai-matra-chart.html': '/games/thai/thai-matra-chart-worksheet.html',
  '/games/english/follow-instructions.html': '/games/english/follow-instructions-worksheet.html',
  '/games/math/times-table.html': '/games/math/times-table-worksheet.html',
  '/games/math/math-word-problem-media.html': '/games/math/math-word-problem-worksheet.html',
  '/games/math/math-word-problem-hub/index.html': '/games/math/math-word-problem-worksheet.html',
  '/games/thai/thai-script-hub/index.html': '/games/thai/thai-script-hub-worksheet.html',
  '/games/thai/thai-grammar-hub/index.html': '/games/thai/thai-grammar-hub-worksheet.html',
  '/games/thai/thai-idiom-hub/index.html': '/games/thai/thai-idiom-hub-worksheet.html',
  '/games/thai/thai-punctuation-hub/index.html': '/games/thai/thai-punctuation-hub-worksheet.html',
  '/games/thai/thai-sentence-hub/index.html': '/games/thai/thai-sentence-hub-worksheet.html',
  '/games/math/math-decimal-hub/index.html': '/games/math/math-decimal-hub-worksheet.html',
  '/games/math/math-fraction-hub/index.html': '/games/math/math-fraction-hub-worksheet.html',
  '/games/math/math-geometry-hub/index.html': '/games/math/math-geometry-hub-worksheet.html',
  '/games/thai/thai-reading-hub/index.html': '/games/thai/thai-reading-hub-worksheet.html',
  '/games/thai/thai-writing-hub/index.html': '/games/thai/thai-writing-hub-worksheet.html',
  '/games/thai/thai-poetry-hub/index.html': '/games/thai/thai-poetry-hub-worksheet.html',
  '/games/thai/thai-literature-hub/index.html': '/games/thai/thai-literature-hub-worksheet.html',
  '/games/social/social-thailand-hub/index.html': '/games/social/social-thailand-hub-worksheet.html',
  // Batch 12: dedicated hub worksheets (supersede soft-pairs) + grammar-mini
  '/games/english/grammar-mini.html': '/games/english/grammar-mini-worksheet.html',
  '/games/math/math-data-hub/index.html': '/games/math/math-data-hub-worksheet.html',
  '/games/english/english-grammar-p45-hub/index.html': '/games/english/english-grammar-p45-hub-worksheet.html',
  '/games/science/science-p45-hub/index.html': '/games/science/science-p45-hub-worksheet.html',
  '/games/thai/thai-vocab-hub/index.html': '/games/thai/thai-vocab-hub-worksheet.html',
};

function conventionPair(url: string): string | null {
  if (url.endsWith('-media.html')) return url.replace(/-media\.html$/, '-worksheet.html');
  if (url.endsWith('-worksheet.html')) return url.replace(/-worksheet\.html$/, '-media.html');
  return null;
}

/** Candidate pair URLs for a given item URL (may or may not exist). */
export function guessPairedUrls(url: string): string[] {
  const out = new Set<string>();
  const viaExtra = EXTRA_PAIRS[url];
  if (viaExtra) out.add(viaExtra);
  for (const [a, b] of Object.entries(EXTRA_PAIRS)) {
    if (b === url) out.add(a);
  }
  const viaConv = conventionPair(url);
  if (viaConv) out.add(viaConv);
  out.delete(url);
  return [...out];
}

export type PairedHubLink = {
  href: string;
  label: string;
  kind: 'worksheet' | 'media';
};

/** Resolve pair only when the candidate URL is among published teacher items. */
export function resolvePairedLink(
  url: string | null | undefined,
  publishedUrls: Set<string>,
): PairedHubLink | null {
  if (!url) return null;
  for (const candidate of guessPairedUrls(url)) {
    if (!publishedUrls.has(candidate)) continue;
    const isWorksheet = candidate.includes('-worksheet.html');
    return {
      href: candidate,
      label: isWorksheet ? 'เปิดใบงาน' : 'เปิดสื่อคู่',
      kind: isWorksheet ? 'worksheet' : 'media',
    };
  }
  return null;
}

export function isWorksheetItem(url: string | null | undefined, categoryKey?: string | null): boolean {
  if (categoryKey === 'worksheets') return true;
  return !!url?.includes('-worksheet.html');
}
