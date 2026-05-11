import { useEffect, useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { GripVertical, Plus, Pencil, Trash2, Timer } from 'lucide-react';

type ImageFit = 'cover' | 'contain';

interface HeroSlide {
    id: string;
    image_url: string;
    title: string | null;
    subtitle: string | null;
    link_url: string | null;
    order_position: number;
    is_active: boolean;
    image_fit: ImageFit;
}

const emptySlide = (): Omit<HeroSlide, 'id' | 'order_position'> => ({
    image_url: '',
    title: '',
    subtitle: '',
    link_url: '',
    is_active: true,
    image_fit: 'cover',
});

function SortableSlide({
    slide,
    onEdit,
    onDelete,
    onToggleActive,
}: {
    slide: HeroSlide;
    onEdit: (slide: HeroSlide) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, value: boolean) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="w-24 h-14 rounded overflow-hidden flex-shrink-0 bg-secondary">
                {slide.image_url ? (
                    <img src={slide.image_url} alt={slide.title || ''} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">ไม่มีรูป</div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{slide.title || '(ไม่มีหัวข้อ)'}</p>
                <p className="text-xs text-muted-foreground truncate">{slide.subtitle || '-'}</p>
            </div>

            <div className="flex items-center gap-2">
                <Switch
                    checked={slide.is_active}
                    onCheckedChange={(v) => onToggleActive(slide.id, v)}
                    title={slide.is_active ? 'แสดงอยู่' : 'ซ่อนอยู่'}
                />
                <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => onEdit(slide)}>
                    <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="destructive" size="icon" className="w-8 h-8" onClick={() => onDelete(slide.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}

export const HeroSlidesManagement = () => {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [form, setForm] = useState(emptySlide());
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const { settings } = useSchoolSettings();

    const saveSlideInterval = async (val: string) => {
        await supabase
            .from('school_settings')
            .upsert({ key: 'hero_slide_interval', value: val } as any, { onConflict: 'key' });
        toast({ title: 'บันทึกช่วงเวลาแล้ว' });
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchSlides = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('hero_slides')
            .select('*')
            .order('order_position', { ascending: true });
        if (error) {
            toast({ title: 'โหลดข้อมูลล้มเหลว', variant: 'destructive' });
        } else {
            setSlides(data || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchSlides(); }, []);

    const openCreate = () => {
        setEditingSlide(null);
        setForm(emptySlide());
        setDialogOpen(true);
    };

    const openEdit = (slide: HeroSlide) => {
        setEditingSlide(slide);
        setForm({
            image_url: slide.image_url,
            title: slide.title || '',
            subtitle: slide.subtitle || '',
            link_url: slide.link_url || '',
            is_active: slide.is_active,
            image_fit: slide.image_fit === 'contain' ? 'contain' : 'cover',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.image_url) {
            toast({ title: 'กรุณาอัปโหลดรูปภาพ', variant: 'destructive' });
            return;
        }
        setSaving(true);
        if (editingSlide) {
            const { error } = await supabase
                .from('hero_slides')
                .update({ ...form, title: form.title || null, subtitle: form.subtitle || null, link_url: form.link_url || null })
                .eq('id', editingSlide.id);
            if (error) {
                toast({ title: 'บันทึกล้มเหลว', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'บันทึกสำเร็จ' });
                setDialogOpen(false);
                fetchSlides();
            }
        } else {
            const maxPos = slides.length > 0 ? Math.max(...slides.map(s => s.order_position)) + 1 : 0;
            const { error } = await supabase
                .from('hero_slides')
                .insert({ ...form, title: form.title || null, subtitle: form.subtitle || null, link_url: form.link_url || null, order_position: maxPos });
            if (error) {
                toast({ title: 'เพิ่มล้มเหลว', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'เพิ่ม slide สำเร็จ' });
                setDialogOpen(false);
                fetchSlides();
            }
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบ slide นี้?')) return;
        const { error } = await supabase.from('hero_slides').delete().eq('id', id);
        if (error) {
            toast({ title: 'ลบล้มเหลว', variant: 'destructive' });
        } else {
            setSlides(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleToggleActive = async (id: string, value: boolean) => {
        await supabase.from('hero_slides').update({ is_active: value }).eq('id', id);
        setSlides(prev => prev.map(s => s.id === id ? { ...s, is_active: value } : s));
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = slides.findIndex(s => s.id === active.id);
        const newIndex = slides.findIndex(s => s.id === over.id);
        const reordered = arrayMove(slides, oldIndex, newIndex);
        setSlides(reordered);

        // Persist new order
        await Promise.all(
            reordered.map((s, idx) =>
                supabase.from('hero_slides').update({ order_position: idx }).eq('id', s.id)
            )
        );
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">จัดการ Hero Slides</h1>
                    <p className="text-muted-foreground">สไลด์แสดงในหน้าแรกของเว็บไซต์</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่ม Slide
                </Button>
            </div>

            {/* Interval Setting */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Timer className="w-4 h-4" />
                        ตั้งค่าการแสดงสไลด์
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Label className="whitespace-nowrap text-sm">ช่วงเวลาสไลด์</Label>
                        <select
                            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={settings.hero_slide_interval || '5'}
                            onChange={(e) => saveSlideInterval(e.target.value)}
                        >
                            {[2, 3, 4, 5, 6, 7, 8, 10].map(n => (
                                <option key={n} value={String(n)}>{n} วินาที</option>
                            ))}
                        </select>
                        <span className="text-xs text-muted-foreground">เวลาที่แต่ละสไลด์แสดงก่อนเปลี่ยนภาพ</span>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">กำลังโหลด...</div>
            ) : slides.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                        <p className="mb-4">ยังไม่มี slide กด "เพิ่ม Slide" เพื่อเริ่มต้น</p>
                        <Button onClick={openCreate} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่ม Slide แรก
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <span>{slides.length} slides</span>
                            <span className="text-xs font-normal text-muted-foreground">(ลาก GripVertical เพื่อเรียงลำดับ)</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                {slides.map(slide => (
                                    <SortableSlide
                                        key={slide.id}
                                        slide={slide}
                                        onEdit={openEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </CardContent>
                </Card>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingSlide ? 'แก้ไข Slide' : 'เพิ่ม Slide ใหม่'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label className="mb-1 block">รูปภาพ *</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                                แนะนำขนาด <span className="font-medium text-foreground">1920 × 1080 px</span> (16:9) · JPG/PNG/WebP สูงสุด 5MB · ระบบจะปรับขนาดและบีบอัดให้อัตโนมัติ
                            </p>
                            <ImageUpload
                                onUploadComplete={(url) => setForm(f => ({ ...f, image_url: url }))}
                                currentImage={form.image_url}
                                bucket="school-images"
                                folder="hero-slides"
                                compressionPreset="banner"
                            />
                        </div>
                        <div>
                            <Label htmlFor="slide-fit" className="mb-1.5 block">การแสดงรูป</Label>
                            <select
                                id="slide-fit"
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={form.image_fit}
                                onChange={e => setForm(f => ({ ...f, image_fit: e.target.value === 'contain' ? 'contain' : 'cover' }))}
                            >
                                <option value="cover">เต็มจอ (อาจถูก crop ขอบ) — เหมาะกับรูป 16:9</option>
                                <option value="contain">พอดีกรอบ (เห็นเต็มใบ + พื้นหลังเบลอ) — เหมาะกับรูปสัดส่วนอื่น</option>
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="slide-title" className="mb-1.5 block">หัวข้อ</Label>
                            <Input
                                id="slide-title"
                                value={form.title || ''}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="เช่น ยินดีต้อนรับสู่โรงเรียน..."
                            />
                        </div>
                        <div>
                            <Label htmlFor="slide-subtitle" className="mb-1.5 block">คำอธิบาย</Label>
                            <Input
                                id="slide-subtitle"
                                value={form.subtitle || ''}
                                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                                placeholder="คำอธิบายสั้นๆ"
                            />
                        </div>
                        <div>
                            <Label htmlFor="slide-link" className="mb-1.5 block">ลิงก์ (ถ้ามี)</Label>
                            <Input
                                id="slide-link"
                                value={form.link_url || ''}
                                onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="slide-active"
                                checked={form.is_active}
                                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
                            />
                            <Label htmlFor="slide-active">แสดงบนเว็บไซต์</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
