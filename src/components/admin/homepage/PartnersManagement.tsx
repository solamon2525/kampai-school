import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Building, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { EmptyBoxIllustration } from '@/components/ui/empty-illustrations';
import { CardSkeleton } from '@/components/ui/loading-skeletons';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';

interface Partner {
    id: string;
    name: string;
    logo_url: string | null;
    link_url: string | null;
    description: string | null;
    order_position: number;
    is_active: boolean;
}

export const PartnersManagement = () => {
    const [items, setItems] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Partner | null>(null);
    const [formData, setFormData] = useState({
        name: '', logo_url: '', link_url: '', description: '', is_active: true,
    });
    const { toast } = useToast();

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('partners' as any)
                .select('*')
                .order('order_position', { ascending: true });
            if (error) throw error;
            
            const fixedData = (data || []).map((p: any) => {
                if (p.logo_url && p.logo_url.includes('wikimedia.org')) {
                    if (p.name.includes('กระทรวง')) p.logo_url = '/logos/moe.png';
                    else if (p.name.includes('สพฐ')) p.logo_url = '/logos/obec.png';
                    else p.logo_url = '/logos/garuda.png';
                }
                return p;
            });
            setItems(fixedData as any);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: e.message });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', logo_url: '', link_url: '', description: '', is_active: true });
        setEditing(null);
    };

    const handleOpenDialog = (item?: Partner) => {
        if (item) {
            setEditing(item);
            setFormData({
                name: item.name, logo_url: item.logo_url || '', link_url: item.link_url || '',
                description: item.description || '', is_active: item.is_active,
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
                name: formData.name,
                logo_url: formData.logo_url || null,
                link_url: formData.link_url || null,
                description: formData.description || null,
                is_active: formData.is_active,
            };
            if (editing) {
                const { error } = await supabase.from('partners' as any).update(payload).eq('id', editing.id);
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขเรียบร้อย' });
            } else {
                const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order_position)) : 0;
                const { error } = await supabase.from('partners' as any).insert({ ...payload, order_position: maxOrder + 1 });
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
            const { error } = await supabase.from('partners' as any).delete().eq('id', id);
            if (error) throw error;
            toast({ title: 'สำเร็จ', description: 'ลบเรียบร้อย' });
            fetchItems();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: e.message });
        }
    };

    if (loading) return <div className="p-8"><CardSkeleton count={4} cols={4} /></div>;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">หน่วยงานพันธมิตร</h1>
                    <p className="text-muted-foreground mt-1">จัดการ Partner Logos ที่แสดงบนหน้าแรก</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" /> เพิ่มพันธมิตร
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'แก้ไข' : 'เพิ่มใหม่'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>ชื่อ *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>โลโก้</Label>
                                <ImageUpload
                                    bucket="school-images"
                                    value={formData.logo_url}
                                    onChange={(url) => setFormData({ ...formData, logo_url: url })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ลิงก์</Label>
                                <Input value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="space-y-2">
                                <Label>รายละเอียด</Label>
                                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
                    title="ยังไม่มีพันธมิตร"
                    description="เพิ่มหน่วยงานที่เกี่ยวข้องเพื่อแสดงบนหน้าแรก"
                    action={{ label: 'เพิ่มอันแรก', icon: Plus, onClick: () => handleOpenDialog() }}
                />
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <Card key={item.id} className={!item.is_active ? 'opacity-50' : ''}>
                            <CardContent className="p-4 text-center">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                    {item.logo_url ? (
                                        <img src={item.logo_url} alt={item.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <Building className="w-7 h-7 text-muted-foreground" />
                                    )}
                                </div>
                                <h3 className="font-bold text-sm text-foreground mb-1 line-clamp-2">{item.name}</h3>
                                {item.link_url && item.link_url !== '#' && (
                                    <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 justify-center mb-2">
                                        <ExternalLink className="w-3 h-3" /> เปิดลิงก์
                                    </a>
                                )}
                                <div className="flex gap-1 justify-center">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(item)} className="text-xs px-2">
                                        <Edit className="w-3 h-3 mr-1" />แก้ไข
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)} className="text-xs px-2">
                                        <Trash2 className="w-3 h-3 mr-1" />ลบ
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
