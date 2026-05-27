import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { dashboardLayoutService, type WidgetConfig } from '@/services/dashboard-layout.service';
import { cn } from '@/lib/utils';

export interface DashboardWidget {
  id: string;
  title: string;
  description?: string;
  render: () => ReactNode;
  /** Always shown — user can't hide. */
  pinned?: boolean;
}

interface CustomizableDashboardProps {
  widgets: DashboardWidget[];
  /** Local storage key for cache fallback when offline. */
  storageKey?: string;
}

export const CustomizableDashboard = ({ widgets, storageKey = 'kampai_dashboard_layout' }: CustomizableDashboardProps) => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: serverLayout = [] } = useQuery({
    queryKey: ['dashboard-layout'],
    queryFn: () => dashboardLayoutService.getMine().catch(() => [] as WidgetConfig[]),
    staleTime: 60_000,
  });

  // Merge stored layout with widget catalog (covers new widgets added since user last edited)
  const merged = useMemo<WidgetConfig[]>(() => {
    const known = new Set(serverLayout.map((w) => w.id));
    const ordered: WidgetConfig[] = serverLayout
      .filter((w) => widgets.some((dw) => dw.id === w.id))
      .map((w) => ({ ...w }));
    for (const dw of widgets) {
      if (!known.has(dw.id)) ordered.push({ id: dw.id, hidden: false });
    }
    return ordered;
  }, [serverLayout, widgets]);

  const [draft, setDraft] = useState<WidgetConfig[]>(merged);
  useEffect(() => setDraft(merged), [merged]);

  const visibleConfigs = (editing ? draft : merged).filter((c) =>
    widgets.some((w) => w.id === c.id) && (editing || !c.hidden || widgets.find((w) => w.id === c.id)?.pinned),
  );

  const save = useMutation({
    mutationFn: () => dashboardLayoutService.saveMine(draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-layout'] });
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setEditing(false);
      toast.success('บันทึก layout แล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = draft.findIndex((w) => w.id === active.id);
    const newIndex = draft.findIndex((w) => w.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setDraft(arrayMove(draft, oldIndex, newIndex));
  };

  const toggleHidden = (id: string) => {
    setDraft((d) => d.map((w) => (w.id === id ? { ...w, hidden: !w.hidden } : w)));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Settings2 className="w-4 h-4 mr-1.5" />
              จัด layout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>จัด layout แดชบอร์ดของคุณ</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">ลากเพื่อสลับลำดับ + กดตาเพื่อซ่อน/แสดง widget</p>
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={draft.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                  {draft.map((cfg) => {
                    const widget = widgets.find((w) => w.id === cfg.id);
                    if (!widget) return null;
                    return (
                      <SortableRow
                        key={cfg.id}
                        id={cfg.id}
                        title={widget.title}
                        description={widget.description}
                        hidden={!!cfg.hidden}
                        pinned={!!widget.pinned}
                        onToggle={() => toggleHidden(cfg.id)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setDraft(merged); setEditing(false); }}>ยกเลิก</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                บันทึก
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {visibleConfigs.map((cfg) => {
          const widget = widgets.find((w) => w.id === cfg.id);
          if (!widget) return null;
          return <div key={cfg.id}>{widget.render()}</div>;
        })}
      </div>
    </div>
  );
};

const SortableRow = ({
  id,
  title,
  description,
  hidden,
  pinned,
  onToggle,
}: {
  id: string;
  title: string;
  description?: string;
  hidden: boolean;
  pinned: boolean;
  onToggle: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md border border-border bg-card',
        hidden && 'opacity-50',
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {description && <p className="text-[10px] text-muted-foreground truncate">{description}</p>}
      </div>
      <button onClick={onToggle} disabled={pinned} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
        {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};
