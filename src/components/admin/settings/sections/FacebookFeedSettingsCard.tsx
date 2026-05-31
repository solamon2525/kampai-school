import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Eye, EyeOff, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle, Facebook, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import {
  useFacebookConfig,
  useSaveFacebookConfig,
  useRefreshFacebookFeed,
} from '@/hooks/useFacebookFeed';
import type { FacebookFeedStatus } from '@/services/facebook.service';

const schema = z.object({
  enabled: z.boolean(),
  sync_to_news: z.boolean(),
  page_id: z.string().trim().regex(/^\d{5,}$/u, 'Page ID ต้องเป็นตัวเลข (Facebook Page numeric ID)'),
  page_name: z.string().trim().max(80, 'ไม่เกิน 80 ตัวอักษร').optional().or(z.literal('')),
  page_url: z.string().trim().url('ต้องเป็น URL').refine(
    (v) => /^https?:\/\/(www\.)?facebook\.com\//i.test(v),
    'ต้องเป็นลิงก์ของ facebook.com',
  ).optional().or(z.literal('')),
  access_token: z.string().trim().min(20, 'Token สั้นเกินไป'),
  posts_count: z.coerce.number().int().min(1).max(10),
  refresh_interval_hours: z.coerce.number().int().min(1).max(168),
});
type FormValues = z.infer<typeof schema>;

const STATUS_BADGE: Record<FacebookFeedStatus, { label: string; tone: string }> = {
  ok: { label: 'เชื่อมต่อสำเร็จ', tone: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
  token_expired: { label: 'Token หมดอายุ', tone: 'border-amber-500 text-amber-700 bg-amber-50' },
  rate_limited: { label: 'ถูกจำกัดการเรียก', tone: 'border-amber-500 text-amber-700 bg-amber-50' },
  error: { label: 'เกิดข้อผิดพลาด', tone: 'border-red-500 text-red-700 bg-red-50' },
};

const maskToken = (t: string) =>
  t.length <= 8 ? '•'.repeat(t.length) : `${'•'.repeat(t.length - 4)}${t.slice(-4)}`;

export const FacebookFeedSettingsCard = () => {
  const { toast } = useToast();
  const { data: config, isLoading } = useFacebookConfig();
  const save = useSaveFacebookConfig();
  const refresh = useRefreshFacebookFeed();
  const [revealToken, setRevealToken] = useState(false);
  const [tokenDirty, setTokenDirty] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      enabled: true,
      sync_to_news: false,
      page_id: '',
      page_name: '',
      page_url: '',
      access_token: '',
      posts_count: 3,
      refresh_interval_hours: 6,
    },
  });

  useEffect(() => {
    if (!config) return;
    form.reset({
      enabled: config.enabled,
      sync_to_news: config.sync_to_news ?? false,
      page_id: config.page_id,
      page_name: config.page_name ?? '',
      page_url: config.page_url ?? '',
      access_token: config.access_token,
      posts_count: config.posts_count,
      refresh_interval_hours: config.refresh_interval_hours,
    });
    setTokenDirty(false);
    setRevealToken(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.id]);

  const onSubmit = async (values: FormValues) => {
    try {
      await save.mutateAsync({
        page_id: values.page_id,
        page_name: values.page_name || null,
        page_url: values.page_url || null,
        access_token: values.access_token,
        enabled: values.enabled,
        sync_to_news: values.sync_to_news,
        posts_count: values.posts_count,
        refresh_interval_hours: values.refresh_interval_hours,
      });
      toast({ title: 'บันทึกการตั้งค่า Facebook แล้ว' });
      setTokenDirty(false);
      setRevealToken(false);
    } catch (e) {
      toast({
        title: 'บันทึกไม่สำเร็จ',
        description: (e as Error)?.message ?? 'unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    try {
      const res = await refresh.mutateAsync();
      if (res.ok) {
        toast({
          title: 'ดึงโพสต์ใหม่สำเร็จ',
          description: typeof res.fetched_count === 'number'
            ? `อัปเดต ${res.fetched_count} โพสต์`
            : undefined,
        });
      } else {
        toast({
          title: res.status === 'token_expired' ? 'Token หมดอายุ' : 'ดึงโพสต์ไม่สำเร็จ',
          description: res.error ?? 'unknown',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'ดึงโพสต์ไม่สำเร็จ',
        description: (e as Error)?.message ?? 'unknown',
        variant: 'destructive',
      });
    }
  };

  const statusKey = config?.last_status as FacebookFeedStatus | null | undefined;
  const statusInfo = statusKey ? STATUS_BADGE[statusKey] : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-[#1877F2]" />
            ฟีดข่าว Facebook
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            ดึงโพสต์ล่าสุดจาก Facebook Page ของโรงเรียนมาแสดงที่หน้าแรก
          </p>
        </div>
        {statusInfo ? (
          <Badge variant="outline" className={`shrink-0 ${statusInfo.tone}`}>
            {statusKey === 'ok'
              ? <CheckCircle2 className="w-3 h-3 mr-1" />
              : <AlertTriangle className="w-3 h-3 mr-1" />}
            {statusInfo.label}
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลด...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>แสดงฟีด Facebook บนหน้าแรก</FormLabel>
                      <FormDescription className="text-xs">
                        ปิดสวิตช์เพื่อซ่อน widget โดยไม่ลบการตั้งค่า
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sync_to_news"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>แปลงโพสต์เป็นข่าวอัตโนมัติ</FormLabel>
                      <FormDescription className="text-xs">
                        เปิดเพื่อให้โพสต์ใหม่จากเพจกลายเป็นข่าวเผยแพร่ในหน้า "ข่าวสาร" โดยอัตโนมัติ
                        (หมวด "ข่าวจาก Facebook") — ลบข่าวที่ไม่ต้องการได้ภายหลัง
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="page_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook Page ID</FormLabel>
                      <FormControl>
                        <Input placeholder="เช่น 123456789012345" inputMode="numeric" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Numeric Page ID — หาได้จาก Page Settings → About → Page Transparency
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="page_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อ Page (แสดงบน badge)</FormLabel>
                      <FormControl>
                        <Input placeholder="เช่น โรงเรียนคำไผ่วิทยา" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="page_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook Page URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.facebook.com/your-page" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      ใช้สำหรับลิงก์ "ดูเพิ่มเติม" ใต้ widget
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="access_token"
                render={({ field }) => {
                  const showFull = revealToken || tokenDirty || !field.value;
                  return (
                    <FormItem>
                      <FormLabel>Page Access Token (Long-Lived)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type={showFull ? 'text' : 'password'}
                            value={
                              showFull
                                ? field.value
                                : maskToken(field.value || '')
                            }
                            onChange={(e) => {
                              setTokenDirty(true);
                              field.onChange(e.target.value);
                            }}
                            onFocus={() => setRevealToken(true)}
                            placeholder="EAAB..."
                            autoComplete="off"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setRevealToken((v) => !v)}
                            title={revealToken ? 'ซ่อน' : 'แสดง'}
                          >
                            {revealToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        ใช้ Long-Lived Page Access Token (ไม่หมดอายุง่าย){' '}
                        <a
                          href="https://developers.facebook.com/docs/facebook-login/guides/access-tokens#pagetokens"
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          วิธีสร้าง Token <ExternalLink className="w-3 h-3" />
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="posts_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จำนวนโพสต์ที่แสดง</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={10} {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">1–10 โพสต์</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="refresh_interval_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รีเฟรชอัตโนมัติทุก (ชั่วโมง)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={168} {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">1–168 ชั่วโมง (7 วัน)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {config?.last_fetched_at || config?.last_error ? (
                <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-xs">
                  {config?.last_fetched_at ? (
                    <p>
                      <span className="font-medium">ดึงล่าสุด:</span>{' '}
                      {formatDistanceToNow(parseISO(config.last_fetched_at), {
                        locale: th,
                        addSuffix: true,
                      })}
                    </p>
                  ) : null}
                  {config?.last_error ? (
                    <p className="text-red-700">
                      <span className="font-medium">Error:</span> {config.last_error}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> กำลังบันทึก...</>
                  ) : (
                    'บันทึก'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refresh.isPending || !config}
                >
                  {refresh.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> กำลังดึง...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-1" /> รีเฟรชเดี๋ยวนี้</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};
