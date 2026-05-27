import { useState, useMemo, useEffect, useRef } from 'react';
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
import { Edit3, GripVertical, Plus, X, RotateCcw, Save, Sparkles, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';
import { quickMenuService, type QuickMenuContext, type SharedQuickMenuRow } from '@/services/quickMenu.service';
import {
  ADMIN_QUICK_MENU_CATALOG, TEACHER_QUICK_MENU_CATALOG, getDefaultIds,
  type QuickMenuOption,
} from '@/lib/quickMenuCatalog';
import { cn } from '@/lib/utils';

interface QuickMenuProps {
  context: QuickMenuContext;
}

// แคตตาล็อกแบบรวม — ใช้แก้ id → option ได้ทั้ง admin/teacher item
const FULL_CATALOG: QuickMenuOption[] = [
  ...ADMIN_QUICK_MENU_CATALOG,
  ...TEACHER_QUICK_MENU_CATALOG,
];
const FULL_CATALOG_BY_ID = new Map(FULL_CATALOG.map((o) => [o.id, o]));

export const QuickMenu = ({ context }: QuickMenuProps) => {
  const navigate = useNavigate();
  const { user, allowedMenus = [], isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const autoAppendDoneRef = useRef(false);

  const { data: shared } = useQuery({
    queryKey: ['shared-quick-menu'],
    queryFn: async () => {
      const { data } = await quickMenuService.getShared();
      return (data as SharedQuickMenuRow | null) ?? null;
    },
  });

  const selectedIds = shared?.menu_item_ids ?? getDefaultIds('admin');
  const knownIds = shared?.known_catalog_ids ?? [];

  // ─── Auto-append: เมนูใหม่ใน catalog → เพิ่มเข้า shared list ทันที (เฉพาะแอดมิน) ───
  useEffect(() => {
    if (!isAdmin || !user?.id || shared === undefined) return;
    if (autoAppendDoneRef.current) return;

    const currentCatalogIds = ADMIN_QUICK_MENU_CATALOG.map((o) => o.id);
    const newIds = currentCatalogIds.filter((id) => !knownIds.includes(id));

    // ไม่มีอะไรใหม่และ knownIds ก็ครบแล้ว → ไม่ต้องเขียน
    if (newIds.length === 0 && knownIds.length === currentCatalogIds.length) return;

    autoAppendDoneRef.current = true;
    const appendedSelectedIds = [
      ...selectedIds,
      ...newIds.filter((id) => !selectedIds.includes(id)),
    ];
    quickMenuService
      .saveShared(user.id, appendedSelectedIds, currentCatalogIds)
      .then(({ error }) => {
        if (error) {
          autoAppendDoneRef.current = false; // retry ครั้งหน้า
          return;
        }
        queryClient.invalidateQueries({ queryKey: ['shared-quick-menu'] });
      });
  }, [isAdmin, user?.id, shared, selectedIds, knownIds, queryClient]);

  // แปลง id → option + สถานะการเข้าถึง
  const items = useMemo(() => {
    return selectedIds
      .map((id) => {
        const opt = FULL_CATALOG_BY_ID.get(id);
        if (!opt) return null;
        // แอดมิน = เข้าได้หมด
        // ครู = เข้าได้ถ้าเป็นเมนูครูพื้นฐาน หรือมีใน allowedMenus
        const isTeacherCoreItem = TEACHER_QUICK_MENU_CATALOG.some((t) => t.id === id);
        const hasAccess = isAdmin || isTeacherCoreItem || allowedMenus.includes(id);
        return { ...opt, hasAccess };
      })
      .filter((x): x is QuickMenuOption & { hasAccess: boolean } => !!x);
  }, [selectedIds, isAdmin, allowedMenus]);

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            เมนูลัด
          </h3>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setEditorOpen(true)} className="gap-1.5">
              <Edit3 className="w-4 h-4" />
              จัดการ
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {isAdmin
              ? 'ยังไม่ได้เลือกเมนูลัด — กด "จัดการ" เพื่อเลือกเมนูที่ใช้บ่อย'
              : 'ยังไม่มีเมนูลัด — แอดมินยังไม่ได้ปักหมุดเมนู'}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => item.hasAccess && navigate(item.path)}
                disabled={!item.hasAccess}
                title={
                  item.hasAccess
                    ? item.label
                    : 'คุณยังไม่มีสิทธิ์ใช้เมนูนี้ — ติดต่อแอดมินเพื่อขอสิทธิ์'
                }
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center relative',
                  item.hasAccess
                    ? 'bg-secondary hover:bg-secondary/80 cursor-pointer'
                    : 'bg-secondary/40 opacity-50 cursor-not-allowed',
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                    item.hasAccess ? 'bg-primary/10' : 'bg-muted',
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-6 h-6',
                      item.hasAccess ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'font-medium text-sm leading-tight line-clamp-2',
                    item.hasAccess ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
                {!item.hasAccess && (
                  <span className="absolute top-1.5 right-1.5 text-muted-foreground">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {isAdmin && (
          <QuickMenuEditor
            open={editorOpen}
            onOpenChange={setEditorOpen}
            initialIds={selectedIds.filter((id) => FULL_CATALOG_BY_ID.has(id))}
            knownCatalogIds={knownIds}
          />
        )}
      </CardContent>
    </Card>
  );
};

// ─── Editor dialog (admin only) ─────────────────────────────────

interface QuickMenuEditorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialIds: string[];
  knownCatalogIds: string[];
}

const QuickMenuEditor = ({ open, onOpenChange, initialIds, knownCatalogIds }: QuickMenuEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ids, setIds] = useState<string[]>(initialIds);

  // Resync เมื่อ dialog เปิด เพราะ initialIds จาก query อาจ resolve หลัง mount
  useEffect(() => {
    if (open) setIds(initialIds);
  }, [open, initialIds]);

  const catalog = ADMIN_QUICK_MENU_CATALOG;
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
    const defaults = getDefaultIds('admin');
    setIds(defaults.filter((id) => catalogById.has(id)));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('ไม่พบผู้ใช้');
      // อัปเดต known_catalog_ids ให้ตรงกับ catalog ปัจจุบันด้วย — กัน auto-append re-fire
      const currentCatalogIds = catalog.map((o) => o.id);
      const mergedKnown = Array.from(new Set([...knownCatalogIds, ...currentCatalogIds]));
      const { error } = await quickMenuService.saveShared(user.id, ids, mergedKnown);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-quick-menu'] });
      toast({ title: 'บันทึกแล้ว', description: 'เมนูลัดได้รับการอัพเดตและซิงค์ให้ครูทุกคนแล้ว' });
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
          <DialogTitle>จัดการเมนูลัด (แชร์ให้ครูทุกคน)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
