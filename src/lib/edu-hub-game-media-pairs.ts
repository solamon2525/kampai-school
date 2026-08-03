/**
 * Game ↔ teaching media pairing for PlayGame "ดูสื่อก่อน" + การ์ดคลังเกม.
 * Keys = game_slug (or path segment). Values = media URL under /games/.
 */

export const GAME_MEDIA_PAIRS: Record<string, string> = {
  'thai-sara-run': '/games/thai/thai-sara-chart.html',
  fishing: '/games/thai/thai-matra-chart.html',
  pizza: '/games/math/fraction-pieces.html',
  'fraction-garden': '/games/math/fraction-pieces.html',
  'fraction-adventure': '/games/math/fraction-pieces.html',
  'attack-on-noun': '/games/thai/thai-word-types.html',
  'digestive-ar': '/games/science/digestive-system-media.html',
  'handwash-order': '/games/health/handwash-media.html',
  'sentence-craft': '/games/thai/sentence-structure.html',
  'food-chain': '/games/science/food-chain-media.html',
  'waste-sort': '/games/career/waste-sort-media.html',
  'sci-sort': '/games/science/states-of-matter.html',
  'sink-float': '/games/science/states-of-matter.html',
  'solid-3d': '/games/math/geometry-3d-media.html',
  'net-3d': '/games/math/geometry-3d-media.html',
  'block-3d': '/games/math/geometry-3d-media.html',
  cashier: '/games/math/thai-money-media.html',
  'coin-exchange': '/games/math/thai-money-media.html',
  'plate-builder': '/games/health/food-groups-media.html',
  'color-wheel': '/games/arts/color-wheel-media.html',
  'water-cycle': '/games/science/water-cycle.html',
  rounding: '/games/math/rounding.html',
  'number-line': '/games/math/number-line-media.html',
  'math-hand-raising': '/games/math/times-table.html',
  'multiply-race': '/games/math/times-table.html',
  'multiply-burst': '/games/math/times-table.html',
  'sight-words-p4': '/games/english/sight-words-p4.html',
  'grammar-mini': '/games/english/grammar-mini.html',
  'phonics-pop': '/games/english/phonics-chart.html',
  'phonics-chart': '/games/english/phonics-chart.html',
  'follow-instructions': '/games/english/follow-instructions.html',
  'vertebrate-sort': '/games/science/vertebrate-sort.html',
  'moon-phases': '/games/science/moon-phases-media.html',
  'plant-parts': '/games/science/plant-parts-media.html',
  'good-citizen': '/games/social/good-citizen-media.html',
  'thailand-map': '/games/social/thailand-map.html',
  sufficiency: '/games/social/sufficiency-media.html',
  'sukhothai-timeline': '/games/social/sukhothai-timeline.html',
  'community-jobs': '/games/career/community-jobs-media.html',
  'angle-media': '/games/math/angle-media.html',
  'food-label': '/games/health/food-label-media.html',
  'bone-muscle': '/games/science/human-organs-media.html',
  'human-organs': '/games/science/human-organs-media.html',
  'waipot': '/games/thai/synonym-media.html',
  'word-ninja-noun': '/games/thai/thai-word-types.html',
  'thai-literature-hub': '/games/thai/literature-short-media.html',
  // Phase 11–13 look-before pairs
  'rhythm-master': '/games/arts/rhythm-music-media.html',
  'visual-arts': '/games/arts/visual-elements-media.html',
  'home-crafts': '/games/career/home-crafts-media.html',
  'school-garden': '/games/career/school-garden-media.html',
  'food-nutrition': '/games/career/food-nutrition-media.html',
  'algorithm-unplugged': '/games/tech/algorithm-unplugged-media.html',
  'data-presentation': '/games/tech/data-presentation-media.html',
  'thai-geography': '/games/social/thai-geography-media.html',
  'citizen-duties': '/games/social/citizen-duties-p123-media.html',
  'living-nonliving': '/games/science/living-nonliving-media.html',
  'materials-around': '/games/science/materials-around-media.html',
  'alphabet-phonics': '/games/english/alphabet-phonics-media.html',
  'sight-words-daily': '/games/english/sight-words-daily-media.html',
  'electric-circuit': '/games/science/electric-circuit-media.html',
  'body-systems-p6': '/games/science/body-systems-p6-media.html',
  'english-tenses-p6': '/games/english/english-tenses-p6-media.html',
  'english-reading-p6': '/games/english/english-reading-p6-media.html',
  'economics-p6': '/games/social/economics-p6-media.html',
  'percent-ratio': '/games/math/percent-ratio-media.html',
  'simple-equation': '/games/math/simple-equation-media.html',
  'rhetoric-literature-p6': '/games/thai/rhetoric-literature-p6-media.html',
  'bar-chart': '/games/math/bar-chart-media.html',
  'rect-area': '/games/math/rect-area-media.html',
  'clock-media': '/games/math/clock-media.html',
  'light-properties': '/games/science/light-properties-media.html',
  'classroom-english': '/games/english/classroom-english-media.html',
  'brush-teeth': '/games/health/brush-teeth-media.html',
  // Salvage / remaining look-before pairs (Phase 16 hygiene)
  dictionary: '/games/thai/dictionary-media.html',
  'thai-narration-style': '/games/thai/thai-narration-style-media.html',
  'thai-implied-meaning': '/games/thai/thai-implied-meaning-media.html',
  'literature-short': '/games/thai/literature-short-media.html',
  decimal: '/games/math/decimal-media.html',
  'thai-calendar': '/games/social/thai-calendar-media.html',
  'sight-words-p123': '/games/english/sight-words-p123-media.html',
  'numbers-1-100': '/games/math/numbers-1-100-media.html',
  'add-sub-within-100': '/games/math/add-sub-within-100-media.html',
  'basic-shapes-p12': '/games/math/basic-shapes-p12-media.html',
  'word-blend': '/games/thai/word-blend-media.html',
  'basic-vocab-p12': '/games/thai/basic-vocab-p12-media.html',
  'read-write-fluency': '/games/thai/read-write-fluency-media.html',
  'multiplication-thinking': '/games/math/multiplication-thinking-media.html',
  'short-division-thinking': '/games/math/short-division-thinking-media.html',
  'long-division-thinking': '/games/math/long-division-thinking-media.html',
  'math-24-thinking': '/games/math/math-24-thinking-media.html',
  'divide-by-2-thinking': '/games/math/divide-by-2-thinking-media.html',
  'bone-muscle-media': '/games/health/bone-muscle-media.html',
};

export type GameMediaPair = {
  mediaUrl: string;
  label: string;
};

/** Resolve paired teaching media for a playable game slug. */
export function resolveGameMediaPair(gameSlug: string | null | undefined): GameMediaPair | null {
  if (!gameSlug) return null;
  const key = gameSlug.trim().toLowerCase();
  const mediaUrl = GAME_MEDIA_PAIRS[key] ?? GAME_MEDIA_PAIRS[gameSlug];
  if (!mediaUrl) return null;
  return { mediaUrl, label: 'ดูสื่อก่อน' };
}

/** Hub card button shape (matches edu-hub-worksheet-pairs PairedHubLink). */
export function resolveGameMediaHubLink(
  gameSlug: string | null | undefined,
): { href: string; label: string; kind: 'media' } | null {
  const pair = resolveGameMediaPair(gameSlug);
  if (!pair) return null;
  return { href: pair.mediaUrl, label: pair.label, kind: 'media' };
}
