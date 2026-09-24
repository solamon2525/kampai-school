(function (root) {
'use strict';
const CATEGORY_SLUGS = Object.freeze([
  'numbers', 'colors', 'days', 'months', 'alphabet', 'animals', 'fruits', 'body',
  'shapes', 'family', 'food', 'jobs', 'weather', 'verbs', 'clothes', 'classroom',
  'house-rooms', 'toys', 'transportation', 'sports', 'places', 'instruments',
  'vegetables', 'insects', 'sea-animals', 'seasons', 'emotions', 'directions', 'birds',
]);

/** Reconcile saved orders with the current catalog without losing new categories. */
function normalizeOrder(value) {
  const saved = Array.isArray(value) ? value : [];
  return [...new Set([...saved.filter(s => CATEGORY_SLUGS.includes(s)), ...CATEGORY_SLUGS])];
}

function isOrderPayload(value) {
  return Array.isArray(value) && value.length === CATEGORY_SLUGS.length &&
    new Set(value).size === value.length && value.every(s => CATEGORY_SLUGS.includes(s));
}

function acceptsMessage(event, source, origin) {
  return !!source && event.source === source && event.origin === origin;
}
root.VocabHubOrder = Object.freeze({ CATEGORY_SLUGS, normalizeOrder, isOrderPayload, acceptsMessage });
})(globalThis);
