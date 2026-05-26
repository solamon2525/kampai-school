/**
 * push.service.ts
 * Wraps Web Push API subscription + Supabase persistence.
 * VAPID public key is read from VITE_VAPID_PUBLIC_KEY.
 */
import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}

export const pushService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  getPermission(): PushPermission {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as PushPermission;
  },

  async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  },

  async getCurrentSubscription(): Promise<PushSubscription | null> {
    const reg = await this.getRegistration();
    if (!reg) return null;
    return reg.pushManager.getSubscription();
  },

  /** Subscribe the current user to push and persist to Supabase. */
  async subscribe(): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (!this.isSupported()) return { ok: false, reason: 'unsupported' };
    if (!VAPID_PUBLIC_KEY) return { ok: false, reason: 'missing VAPID public key' };

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: `permission: ${permission}` };

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) return { ok: false, reason: 'not authenticated' };

    const p256dh = arrayBufferToBase64(sub.getKey('p256dh'));
    const authKey = arrayBufferToBase64(sub.getKey('auth'));

    const { error } = await supabase.from('push_subscriptions' as any).upsert(
      {
        user_id: userResp.user.id,
        endpoint: sub.endpoint,
        p256dh,
        auth_key: authKey,
        user_agent: navigator.userAgent.slice(0, 200),
      },
      { onConflict: 'endpoint' },
    );

    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  },

  async unsubscribe(): Promise<void> {
    const sub = await this.getCurrentSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await supabase.from('push_subscriptions' as any).delete().eq('endpoint', endpoint);
  },
};
