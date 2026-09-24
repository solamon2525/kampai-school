import { useEffect, useRef, type RefObject } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { vocabHubLayoutKey, vocabHubLayoutService } from '@/services/vocab-hub-layout.service';
import { acceptsMessage, isOrderPayload } from '../../public/games/english/vocab-hub-order.mjs';

/** The HTML game never receives credentials; Supabase RLS enforces writes. */
export function useVocabHubLayout(slug: string | undefined, iframe: RefObject<HTMLIFrameElement>) {
  const { isAdmin } = useAuth();
  const client = useQueryClient();
  const saving = useRef(false);
  const order = useQuery({
    queryKey: vocabHubLayoutKey, queryFn: vocabHubLayoutService.read,
    enabled: slug === 'vocab-hub', retry: 1,
  });
  const { mutateAsync } = useMutation({
    mutationFn: vocabHubLayoutService.save,
    onSuccess: async (saved) => {
      client.setQueryData(vocabHubLayoutKey, saved);
      await client.invalidateQueries({ queryKey: vocabHubLayoutKey });
    },
  });

  useEffect(() => {
    if (slug !== 'vocab-hub') return;
    const origin = window.location.origin;
    const sendState = () => iframe.current?.contentWindow?.postMessage({
      type: 'vocabHubLayoutState', order: order.data ?? [], canEdit: isAdmin,
      loading: order.isPending, error: order.isError,
    }, origin);
    const handle = async (event: MessageEvent) => {
      const frame = iframe.current?.contentWindow;
      if (!acceptsMessage(event, frame, origin) || !event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'vocabHubLayoutRequest') { sendState(); return; }
      if (event.data.type !== 'vocabHubLayoutSave' || saving.current) return;
      const requestId = event.data.requestId;
      if (typeof requestId !== 'string' || requestId.length > 80) return;
      const respond = (ok: boolean, saved?: string[]) => {
        if (iframe.current?.contentWindow === frame) frame?.postMessage({
          type: 'vocabHubLayoutSaved', requestId, ok, order: saved,
        }, origin);
      };
      if (!isAdmin || !isOrderPayload(event.data.order)) { respond(false); return; }
      saving.current = true;
      try { respond(true, await mutateAsync(event.data.order)); }
      catch { respond(false); }
      finally { saving.current = false; }
    };
    sendState();
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, [slug, iframe, isAdmin, order.data, order.isPending, order.isError, mutateAsync]);
}
