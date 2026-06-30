import type { EduHubItem } from '@/services/educational-hub.service';

export function isThaiVocabHubGame(item: EduHubItem): boolean {
  return item.game_slug === 'thai-vocab-hub'
    || (item.external_url ?? '').includes('thai-vocab-hub');
}
