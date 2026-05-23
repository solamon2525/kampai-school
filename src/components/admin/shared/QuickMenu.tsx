import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit3, GripVertical, Plus, X, RotateCcw, Save, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';
import { quickMenuService, type QuickMenuContext } from '@/services/quickMenu.service';
import {
  getCatalog, getDefaultIds, type QuickMenuOption,
} from '@/lib/quickMenuCatalog';
import { cn } from '@/lib/utils';

interface QuickMenuProps {
  context: QuickMenuContext;
}

export const QuickMenu = ({ context }: QuickMenuProps) => {
  const navigate = useNavigate();
  const { user, allowedMenus = [], isAdmin } = useAuth();
  const [editorOpen, setEditorOpen] = useState(false);

  // คำนวณแคตตาล็อกเมนูที่อนุญาตตามบทบาทและสิทธิ์การเข้าถึงจริง
  const catalog = useMemo(() => {
    if (context === 'teacher') {
      // เมนูครูพื้นฐาน
      const baseCatalog = getCatalog('teacher');
      // เมนูแอดมินหลังบ้านเฉพาะที่คุณครูได้รับสิทธิ์การเข้าถึง
      const adminCatalog = getCatalog('admin');
      const allowedAdminOptions = adminCatalog.filter((opt) => allowedMenus.includes(opt.id));
      return [...baseCatalog, ...allowedAdminOptions];
    } else {
      // context === 'admin'
      const adminCatalog = getCatalog('admin');
      if (isAdmin) {
        return adminCatalog;
      } else {
        // ครูทั่วไปที่เข้ามาหน้าหลังบ้าน -> กรองเฉพาะเมนูที่ได้รับสิทธิ์เท่านั้น
        return adminCatalog.filter((opt) => allowedMenus.includes(opt.id));
      }
    }
  }, [context, allowedMenus, isAdmin]);

  const catalogById = useMemo(() => {
    const m = new Map<string, QuickMenuOption>();
    catalog.forEach((o) => m.set(o.id, o));
    return m;
  }, [catalog]);

  const { data: selectedIds = [] } = useQuery({
    queryKey: ['quick-menu', user?.id, context],
    enabled: !!user?.id,
    queryFn: async () => {
      if (context === 'teacher') {
        const { data } = await quickMenuService.getAdminQuickMenu();
        const row = data as { menu_item_ids: string[] } | null;
        // หากแอดมินยังไม่เคยตั้งค่าอะไรเลย ให้ใช้เมนูครูเริ่มต้น
        return row?.menu_item_ids ?? getDefaultIds('teacher');
      } else {
        const { data } = await quickMenuService.get(user!.id, context);
        const row = data as { menu_item_ids: string[] } | null;
        return row?.menu_item_ids ?? getDefaultIds(context);
      }
    },
  });

  // กรองเฉพาะเมนูที่คุณครูมีสิทธิ์ใช้งานจริงเท่านั้น (สุขอนามัยของทางลัด)
  const sanitizedSelectedIds = useMemo(() => {
    const ids = selectedIds || [];
    return ids.filter(id => catalogById.has(id));
  }, [selectedIds, catalogById]);

  const items = sanitizedSelectedIds
    .map((id) => catalogById.get(id))
    .filter((x): x is QuickMenuOption => !!x);

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            เมนูลัด
          </h3>
          {context !== 'teacher' && (
            <Button variant="ghost" size="sm" onClick={() => setEditorOpen(true)} className="gap-1.5">
              <Edit3 className="w-4 h-4" />
              จัดการ
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            ยังไม่ได้เลือกเมนูลัด — กด "จัดการ" เพื่อเลือกเมนูที่ใช้บ่อย
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium text-foreground text-sm leading-tight line-clamp-2">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}

        <QuickMenuEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          context={context}
          initialIds={sanitizedSelectedIds}
          catalog={catalog}
        />
      </CardContent>
    </Card>
  );
};

// ─── Editor dialog ───────────────────────────────────────────

interface QuickMenuEditorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  context: QuickMenuContext;
  initialIds: string[];
  catalog: QuickMenuOption[];
}

const QuickMenuEditor = ({ open, onOpenChange, context, initialIds, catalog }: QuickMenuEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ids, setIds] = useState<string[]>(initialIds);

  // Resync ids กับ initialIds ทุกครั้งที่ dialog เปิด (initialIds จาก parent query
  // อาจ resolve หลัง mount → handleOpenChange เดิมไม่ trigger บน controlled open prop)
  useEffect(() => {
    if (open) setIds(initialIds);
  }, [open, initialIds]);

  const catalogById = useMemo(() => {
    const m = new Map<string, QuickMenuOption>();
    catalog.forEach((o) => m.set(o.id, o));
    return m;
  }, [catalog]);

  const groupedAvailable = useMemo(() => {
    const groups = new Map<string, QuickMenuOption[]>();
    for (const opt of catalog) {
      const arr = groups.get(opt.group) ?? [];
      arr.push(opt);
      groups.set(opt.group, arr);
    }
    return Array.from(groups.entries());
  }, [catalog]);

  const selectedSet = new Set(ids);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx !== -1 && newIdx !== -1) setIds(arrayMove(ids, oldIdx, newIdx));
  };

  const addId = (id: string) => setIds((cur) => (cur.includes(id) ? cur : [...cur, id]));
  const removeId = (id: string) => setIds((cur) => cur.filter((x) => x !== id));
  const resetDefault = () => {
    const defaults = getDefaultIds(context);
    const validDefaults = defaults.filter((id) => catalog.some((opt) => opt.id === id));
    setIds(validDefaults);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('ไม่พบผู้ใช้');
      const { error } = await quickMenuService.save(user.id, context, ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-menu'] });
      toast({ title: 'บันทึกแล้ว', description: 'เมนูลัดของคุณได้รับการอัพเดต' });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ variant: 'destructive', title: 'บันทึกไม่สำเร็จ', description: err.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>จัดการเมนูลัด</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section 1: เมนูที่เลือก */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">เมนูที่เลือก ({ids.length})</h4>
              <Button variant="ghost" size="sm" onClick={resetDefault} className="gap-1.5 text-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                ใช้ค่าเริ่มต้น
              </Button>
            </div>
            {ids.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                ยังไม่มีเมนูที่เลือก
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {ids.map((id, idx) => {
                      const opt = catalogById.get(id);
                      if (!opt) return null;
                      return <SortableRow key={id} id={id} index={idx} option={opt} onRemove={() => removeId(id)} />;
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Section 2: เมนูทั้งหมด (เพิ่ม) */}
          <div>
            <h4 className="text-sm font-semibold mb-2">
              เมนูทั้งหมด{' '}
              <span className="text-muted-foreground font-normal">
                (เลือก {ids.length}/{catalog.length})
              </span>
            </h4>
            <div className="space-y-3">
              {groupedAvailable.map(([group, opts]) => {
                const groupSelected = opts.filter((o) => selectedSet.has(o.id)).length;
                return (
                  <div key={group}>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {group}{' '}
                      <span className="opacity-70">
                        ({groupSelected}/{opts.length})
                      </span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {opts.map((opt) => {
                        const isSelected = selectedSet.has(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => (isSelected ? removeId(opt.id) : addId(opt.id))}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors',
                              isSelected
                                ? 'bg-primary/10 border border-primary/40 text-primary ring-1 ring-primary/20'
                                : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                            )}
                            title={isSelected ? 'กำลังแสดงในเมนูลัด — คลิกเพื่อเอาออก' : 'คลิกเพื่อเพิ่มเข้าเมนูลัด'}
                          >
                            <opt.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 truncate">{opt.label}</span>
                            {isSelected ? (
                              <span className="text-[10px] font-semibold text-primary bg-primary/15 px-1.5 py-0.5 rounded shrink-0">
                                ใช้อยู่
                              </span>
                            ) : (
                              <Plus className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Sortable row in editor ─────────────────────────────────

interface SortableRowProps {
  id: string;
  index: number;
  option: QuickMenuOption;
  onRemove: () => void;
}

const SortableRow = ({ id, index, option, onRemove }: SortableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-2.5 border rounded-lg bg-background select-none',
        isDragging && 'shadow-lg ring-2 ring-primary/50 z-10'
      )}
    >
      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
        {index + 1}
      </span>
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none flex-shrink-0"
        title="ลากเพื่อจัดเรียง"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <option.icon className="w-4 h-4 flex-shrink-0 text-primary" />
      <span className="flex-1 text-sm font-medium truncate">{option.label}</span>
      <span className="text-xs text-muted-foreground hidden sm:inline">{option.group}</span>
      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        title="ลบออก"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
