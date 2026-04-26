import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { EmptyBoxIllustration } from '@/components/ui/empty-illustrations';
import { CardSkeleton } from '@/components/ui/loading-skeletons';

interface Testimonial {
    id: string;
    name: string;
    role: string | null;
    quote: string;
    rating: number;
    avatar_url: string | null;
    order_position: number;
    is_active: boolean;
}

const ROLE_OPTIONS = ['ผู้ปกครอง', 'นักเรียน', 'ศิษย์เก่า', 'ครู/บุคลากร', 'อื่นๆ'];

export const TestimonialsManagement = () => {
    const [items, setItems] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Testimonial | null>(null);
    const [formData, setFormData] = useState({
        name: '', role: 'ผู้ปกครอง', quote: '', rating: 5, avatar_url: '', is_active: true,
    });
    const { toast } = useToast();

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('testimonials' as any)
                .select('*')
                .order('order_position', { ascending: true });
            if (error) throw error;
            setItems((data || []) as any);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: e.message });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', role: 'ผู้ปกครอง', quote: '', rating: 5, avatar_url: '', is_active: true });
        setEditing(null);
    };

    const handleOpenDialog = (item?: Testimonial) => {
        if (item) {
            setEditing(item);
            setFormData({
                name: item.name, role: item.role || 'ผู้ปกครอง', quote: item.quote,
                rating: item.rating, avatar_url: item.avatar_url || '', is_active: item.is_active,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name, role: formData.role, quote: formData.quote,
                rating: formData.rating, avatar_url: formData.avatar_url || null,
                is_active: formData.is_active,
            };
            if (editing) {
                const { error } = await supabase.from('testimonials' as any).update(payload).eq('id', editing.id);
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขเรียบร้อย' });
            } else {
                const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order_position)) : 0;
                const { error } = await supabase.from('testimonials' as any).insert({ ...payload, order_position: maxOrder + 1 });
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'เพิ่มเรียบร้อย' });
            }
            setIsDialogOpen(false);
            resetForm();
            fetchItems();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: e.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบหรือไม่?')) return;
        try {
            const { error } = await supabase.from('testimonials' as any).delete().eq('id', id);
            if (error) throw error;
            toast({ title: 'สำเร็จ', description: 'ลบเรียบร้อย' });
            fetchItems();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: e.message });
        }
    };

    if (loading) return <div className="p-8"><CardSkeleton count={4} cols={2} /></div>;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">เสียงจากนักเรียน/ผู้ปกครอง</h1>
                    <p className="text-muted-foreground mt-1">จัดการ Testimonials ที่แสดงบนหน้าแรก</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" /> เพิ่ม Testimonial
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'แก้ไข' : 'เพิ่มใหม่'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>ชื่อ *</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>ประเภท</Label>
                                    <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>คำพูด *</Label>
                                <Textarea value={formData.quote} onChange={(e) => setFormData({ ...formData, quote: e.target.value })} rows={3} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>คะแนน (1-5)</Label>
                                    <Select value={String(formData.rating)} onValueChange={(v) => setFormData({ ...formData, rating: parseInt(v) })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{'⭐'.repeat(n)} ({n})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>URL รูป (optional)</Label>
                                    <Input value={formData.avatar_url} onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                                <Label>แสดงบนเว็บไซต์</Label>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                                <Button type="submit">{editing ? 'บันทึก' : 'เพิ่ม'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {items.length === 0 ? (
                <EmptyState
                    illustration={<EmptyBoxIllustration />}
                    title="ยังไม่มี Testimonials"
                    description="เพิ่มเสียงจากนักเรียน/ผู้ปกครองที่ดีต่อใจให้ปรากฏหน้าแรก"
                    action={{ label: 'เพิ่มอันแรก', icon: Plus, onClick: () => handleOpenDialog() }}
                />
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <Card key={item.id} className={!item.is_active ? 'opacity-50' : ''}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <MessageCircle className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-yellow-400 text-sm">{'⭐'.repeat(item.rating)}</div>
                                        <p className="text-sm italic text-muted-foreground mt-1">"{item.quote}"</p>
                                        <p className="text-xs font-semibold text-foreground mt-2">— {item.name}{item.role ? ` (${item.role})` : ''}</p>
                                        <div className="flex gap-1 mt-3">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(item)} className="text-xs">
                                                <Edit className="w-3 h-3 mr-1" />แก้ไข
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)} className="text-xs">
                                                <Trash2 className="w-3 h-3 mr-1" />ลบ
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
