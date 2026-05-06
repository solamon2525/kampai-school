import { useEffect, useState } from 'react';
import { Save, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TickerNewsItem {
  id: string;
  title: string;
  ticker_order: number | null;
}

const SortableItem = ({ item }: { item: TickerNewsItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 p-3 bg-card rounded-lg border border-border select-none',
        isDragging && 'opacity-50 shadow-lg z-10'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
        aria-label="ลาก"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <span className="text-sm flex-1 truncate">{item.title}</span>
    </div>
  );
};

export const TickerManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings, refetch: refetchSettings } = useSchoolSettings();

  const [speed, setSpeed] = useState(settings.ticker_speed_seconds || '30');
  const [gap, setGap] = useState(settings.ticker_gap_px || '60');
  const [pauseHover, setPauseHover] = useState(
    (settings.ticker_pause_on_hover ?? 'true') !== 'false'
  );
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setSpeed(settings.ticker_speed_seconds || '30');
    setGap(settings.ticker_gap_px || '60');
    setPauseHover((settings.ticker_pause_on_hover ?? 'true') !== 'false');
  }, [settings.ticker_speed_seconds, settings.ticker_gap_px, settings.ticker_pause_on_hover]);

  const saveSettings = async () => {
    setSavingSettings(true);
    const updates = [
      { key: 'ticker_speed_seconds', value: speed },
      { key: 'ticker_gap_px', value: gap },
      { key: 'ticker_pause_on_hover', value: pauseHover ? 'true' : 'false' },
    ];
    const { error } = await supabase
      .from('school_settings')
      .upsert(updates as any, { onConflict: 'key' });
    setSavingSettings(false);
    if (error) {
      toast({ title: 'บันทึกตั้งค่าล้มเหลว', description: error.message, variant: 'destructive' });
      return;
    }
    refetchSettings();
    toast({ title: 'บันทึกการตั้งค่าแล้ว' });
  };

  // Ticker items — query from news table
  const { data: tickerNews = [], isLoading: loadingItems } = useQuery({
    queryKey: ['ticker-news-admin'],
    queryFn: async () => {
      const { data } = await supabase
        .from('news')
        .select('id, title, ticker_order')
        .eq('published', true)
        .eq('show_in_ticker', true)
        .order('ticker_order', { ascending: true, nullsFirst: false })
        .order('published_at', { ascending: false });
      return (data ?? []) as TickerNewsItem[];
    },
  });

  const [items, setItems] = useState<TickerNewsItem[]>([]);
  useEffect(() => { setItems(tickerNews); }, [tickerNews]);

  const reorderMutation = useMutation({
    mutationFn: async (ordered: TickerNewsItem[]) => {
      await Promise.all(
        ordered.map((item, i) =>
          supabase.from('news').update({ ticker_order: i + 1 } as any).eq('id', item.id)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticker-news-admin'] });
      queryClient.invalidateQueries({ queryKey: ['ticker-items'] });
      toast({ title: 'บันทึกลำดับแล้ว' });
    },
    onError: (err: Error) => {
      toast({ title: 'บันทึกล้มเหลว', description: err.message, variant: 'destructive' });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const newOrder = arrayMove(items, oldIndex, newIndex);
    setItems(newOrder);
    reorderMutation.mutate(newOrder);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>การตั้งค่าตัววิ่งข่าว</CardTitle>
          <CardDescription>
            ตั้งค่าความเร็ว/ระยะห่างของตัววิ่งข่าว — ข่าวที่จะวิ่งกำหนดในเมนู <strong>ข่าวสาร</strong> (เปิด Switch &quot;แสดงในตัววิ่งข่าว&quot; ในแต่ละข่าว สูงสุด 5)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>ความเร็ว (วินาทีต่อรอบ)</Label>
              <Input type="number" min={5} max={300} value={speed} onChange={(e) => setSpeed(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">ค่ามาก = ช้าลง (default: 30)</p>
            </div>
            <div>
              <Label>ระยะห่างระหว่างหัวข้อ (px)</Label>
              <Input type="number" min={8} max={300} value={gap} onChange={(e) => setGap(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">default: 60</p>
            </div>
            <div className="flex flex-col justify-between">
              <Label>หยุดเมื่อ hover</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch checked={pauseHover} onCheckedChange={setPauseHover} />
                <span className="text-sm">{pauseHover ? 'เปิด' : 'ปิด'}</span>
              </div>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={savingSettings}>
            <Save className="w-4 h-4 mr-2" />
            {savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>จัดลำดับข่าวในตัววิ่ง</CardTitle>
          <CardDescription>
            ลากเพื่อเรียงลำดับ — ข่าวที่ติ๊ก &quot;แสดงในตัววิ่งข่าว&quot; จะปรากฏที่นี่
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingItems ? (
            <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีข่าวที่เลือกไว้ — ไปที่เมนู ข่าวสาร แล้วเปิด Switch &quot;แสดงในตัววิ่งข่าว&quot;</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map(item => (
                    <SortableItem key={item.id} item={item} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TickerManagement;
