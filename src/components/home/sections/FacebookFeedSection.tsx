import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Facebook, ExternalLink, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useFacebookFeedMeta,
  useFacebookPosts,
  useRefreshFacebookFeed,
} from '@/hooks/useFacebookFeed';

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const formatRelative = (iso: string) => {
  try {
    return formatDistanceToNow(parseISO(iso), { locale: th, addSuffix: true });
  } catch {
    return '';
  }
};

const stripHtml = (s: string) => s.replace(/\s+/g, ' ').trim();

export default function FacebookFeedSection() {
  const { data: meta, isLoading: metaLoading } = useFacebookFeedMeta();
  const limit = meta?.posts_count ?? 3;
  const { data: posts = [], isLoading: postsLoading } = useFacebookPosts(limit);
  const refresh = useRefreshFacebookFeed();

  // Stale-while-revalidate: if the cache is older than refresh_interval_hours,
  // kick the edge function in the background. We don't await; React Query will
  // refetch posts on the next interval / window focus.
  const isStale = useMemo(() => {
    if (!meta?.last_fetched_at) return true;
    const last = new Date(meta.last_fetched_at).getTime();
    const intervalMs = (meta.refresh_interval_hours ?? 6) * 60 * 60 * 1000;
    return Date.now() - last > intervalMs;
  }, [meta?.last_fetched_at, meta?.refresh_interval_hours]);

  useEffect(() => {
    if (!meta?.enabled || !isStale) return;
    // Only attempt when an admin is signed in — anon refresh will 401, which is fine
    // (the cron / admin "refresh now" path keeps it fresh). Don't toast on failure.
    refresh.mutate(undefined, { onError: () => {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.enabled, isStale]);

  if (metaLoading) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="bg-primary text-primary-foreground px-4 py-2">
          <span className="font-semibold text-sm flex items-center gap-2">
            <Facebook className="w-4 h-4" />
            ฟีดข่าว Facebook
          </span>
        </div>
        <div className="p-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!meta || !meta.enabled) return null;

  const pageLabel = meta.page_name?.trim();
  const pageUrl = meta.page_url?.trim();
  const tokenIssue = meta.last_status === 'token_expired';
  const otherError = meta.last_status === 'error' || meta.last_status === 'rate_limited';

  return (
    <motion.div
      key="facebook_feed"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={slideUp}
      className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
    >
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm flex items-center gap-2">
          <span className="w-1 h-4 bg-yellow-400 rounded-full inline-block" />
          ฟีดข่าว Facebook
        </span>
        {pageUrl ? (
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-xs text-yellow-300 hover:text-yellow-100 flex items-center gap-1"
          >
            ดูเพิ่มเติม <ExternalLink className="w-3 h-3" />
          </a>
        ) : null}
      </div>

      <div className="p-4">
        {/* Inner brand card */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Facebook className="w-4 h-4 text-[#1877F2]" />
              ข่าวสารจาก Facebook
            </span>
            {pageLabel ? (
              <Badge variant="outline" className="text-[10px] font-medium">
                {pageLabel}
              </Badge>
            ) : null}
          </div>

          <div className="p-3">
            {tokenIssue ? (
              <ErrorState
                message="Facebook token หมดอายุหรือไม่ถูกต้อง กรุณาเชื่อมต่อ Facebook ใหม่ในหน้าแอดมิน"
              />
            ) : posts.length === 0 ? (
              otherError ? (
                <ErrorState message="ไม่สามารถดึงข้อมูลจาก Facebook ได้ขณะนี้ ลองอีกครั้งภายหลัง" />
              ) : (
                <EmptyState />
              )
            ) : (
              <ul className="space-y-3">
                {postsLoading
                  ? null
                  : posts.map((p) => (
                      <li key={p.id}>
                        <a
                          href={p.permalink_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="group flex gap-3 hover:bg-muted/40 rounded-md p-1.5 -m-1.5 transition-colors"
                        >
                          {p.full_picture ? (
                            <img
                              src={p.full_picture}
                              alt=""
                              loading="lazy"
                              className="w-16 h-16 object-cover rounded-md flex-shrink-0 border border-border"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                              <Facebook className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary">
                              {p.message ? stripHtml(p.message) : '(ไม่มีข้อความ — ดูบน Facebook)'}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                              {formatRelative(p.created_time)}
                            </p>
                          </div>
                        </a>
                      </li>
                    ))}
              </ul>
            )}
          </div>
        </div>

        {pageUrl ? (
          <p className="mt-3 text-xs text-muted-foreground text-center">
            ดูเพิ่มเติมที่{' '}
            <a
              href={pageUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline"
            >
              {pageUrl.replace(/^https?:\/\//, '')}
            </a>
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-6 text-sm text-muted-foreground">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
      <span>{message}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีโพสต์</div>
  );
}
