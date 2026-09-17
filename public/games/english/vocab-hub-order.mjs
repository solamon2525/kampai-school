// ESM adapter for the app and Node tests; the standalone game uses the same classic source.
import './vocab-hub-order.js';
export const { CATEGORY_SLUGS, normalizeOrder, isOrderPayload, acceptsMessage } = globalThis.VocabHubOrder;
