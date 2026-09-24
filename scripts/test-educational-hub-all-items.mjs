import assert from 'node:assert/strict';
import { collectAllEducationalHubItems } from '../src/services/educational-hub-pagination.ts';

const sourceItems = Array.from({ length: 245 }, (_, index) => ({
  id: `item-${index + 1}`,
  title: `Item ${index + 1}`,
}));
const calls = [];

const result = await collectAllEducationalHubItems(async ({ limit, offset, ...filters }) => {
  calls.push({ limit, offset, ...filters });
  return {
    data: sourceItems.slice(offset, offset + limit),
    count: sourceItems.length,
    error: null,
  };
}, {
  categoryId: 'media-category',
  search: 'plant',
  subjects: ['science'],
  grades: ['p4'],
  tags: ['ภาพ'],
  types: ['link'],
  sort: 'popular',
});

assert.equal(result.error, null);
assert.equal(result.count, 245);
assert.equal(result.data.length, 245);
assert.equal(new Set(result.data.map((item) => item.id)).size, 245);
assert.deepEqual(calls.map(({ limit, offset }) => ({ limit, offset })), [
  { limit: 120, offset: 0 },
  { limit: 120, offset: 120 },
  { limit: 120, offset: 240 },
]);
assert.ok(calls.every((call) => call.categoryId === 'media-category'));
assert.ok(calls.every((call) => call.search === 'plant'));
assert.ok(calls.every((call) => call.sort === 'popular'));
assert.ok(calls.every((call) => call.subjects?.[0] === 'science'));
assert.ok(calls.every((call) => call.grades?.[0] === 'p4'));
assert.ok(calls.every((call) => call.tags?.[0] === 'ภาพ'));
assert.ok(calls.every((call) => call.types?.[0] === 'link'));

const duplicateResult = await collectAllEducationalHubItems(async ({ limit, offset }) => ({
  data: offset === 240
    ? [sourceItems[0], ...sourceItems.slice(offset + 1, offset + limit)]
    : sourceItems.slice(offset, offset + limit),
  count: sourceItems.length,
  error: null,
}), { categoryId: 'media-category' });

assert.ok(duplicateResult.error instanceof Error);
assert.equal(duplicateResult.data.length, 0);

const failedResult = await collectAllEducationalHubItems(async ({ limit, offset }) => {
  if (offset === 120) {
    return { data: [], count: sourceItems.length, error: new Error('network failed') };
  }
  return {
    data: sourceItems.slice(offset, offset + limit),
    count: sourceItems.length,
    error: null,
  };
}, { categoryId: 'media-category' });

assert.equal(failedResult.error?.message, 'network failed');
assert.equal(failedResult.data.length, 0);

console.log('Educational Hub all-items batching passed (245 unique items, 120-row chunks, failures rejected).');
