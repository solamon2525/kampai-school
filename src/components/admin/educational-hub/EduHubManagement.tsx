import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Edit, Trash2, ArrowLeft, FileText, Link as LinkIcon, Youtube, Type, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import {
    educationalHubService,
    formatFileSize,
    type EduHubCategory,
    type EduHubItem,
    type EduHubItemType,
} from '@/services/educational-hub.service';
import { CategoryForm } from './CategoryForm';
import { EduHubItemForm } from './EduHubItemForm';
import { GamesTab } from './GamesTab';
import { SortableCategoriesGrid } from './SortableCategoriesGrid';

type Teacher = {
    id: string;
    name: string;
    position: string | null;
    subject: string | null;
    department: string | null;
    photo_url: string | null;
    order_position: number;
};

type TeacherCard = {
    staff_id: string;
    name: string;
    position: string;
    subject: string | null;
    department: string | null;
    photo_url: string | null;
    order_position: number;
    is_hub_active: boolean;
    total_items: number;
    counts_by_category: Record<string, number>;
};

const ITEM_TYPE_ICON: Record<EduHubItemType, typeof FileText> = {
    file: FileText,
    link: LinkIcon,
    youtube: Youtube,
    text: Type,
};

const ITEM_TYPE_LABEL: Record<EduHubItemType, string> = {
    file: 'ไฟล์',
    link: 'ลิงก์',
    youtube: 'YouTube',
    text: 'ข้อความ',
};

export const EduHubManagement = () => {
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">คลังสื่อและเกมการศึกษา</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    จัดการหมวดหมู่ ดู/แก้รายการของครูแต่ละคน และมอนิเตอร์รายการทั้งหมด
                </p>
            </div>

            <Tabs defaultValue="categories" className="w-full">
                <TabsList>
                    <TabsTrigger value="categories">หมวดหมู่</TabsTrigger>
                    <TabsTrigger value="teachers">ครูทั้งหมด</TabsTrigger>
                    <TabsTrigger value="items">รายการทั้งหมด</TabsTrigger>
                    <TabsTrigger value="games">เกม HTML</TabsTrigger>
                </TabsList>

                <TabsContent value="categories"><CategoriesTab /></TabsContent>
                <TabsContent value="teachers"><TeachersTab /></TabsContent>
                <TabsContent value="items"><AllItemsTab /></TabsContent>
                <TabsContent value="games"><GamesTab /></TabsContent>
            </Tabs>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────
// TAB 1: Categories
// ──────────────────────────────────────────────────────────────────────────
const CategoriesTab = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<EduHubCategory | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['edu-hub', 'categories', 'admin'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listCategoriesAdmin();
            if (error) throw error;
            return (data ?? []) as EduHubCategory[];
        },
    });

    const handleDelete = async (cat: EduHubCategory) => {
        if (!confirm(`ลบหมวด "${cat.name}"? (จะทำไม่ได้ถ้ามีรายการอยู่)`)) return;
        const res = await educationalHubService.deleteCategory(cat.id);
        if (res.error) {
            toast({ title: 'ลบไม่ได้', description: res.error.message, variant: 'destructive' });
            return;
        }
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'categories'] });
        toast({ title: 'ลบหมวดหมู่สำเร็จ' });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                    ลากการ์ดเพื่อจัดลำดับการแสดงผลในหน้าครู (sort_order)
                </p>
                <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />เพิ่มหมวดหมู่
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center text-muted-foreground py-12">กำลังโหลด...</div>
            ) : (
                <SortableCategoriesGrid
                    categories={data ?? []}
                    onEdit={(c) => { setEditing(c); setDialogOpen(true); }}
                    onDelete={handleDelete}
                />
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</DialogTitle>
                    </DialogHeader>
                    <CategoryForm
                        initial={editing}
                        onSaved={() => setDialogOpen(false)}
                        onCancel={() => setDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────
// TAB 2: Teachers (list + drill-in to manage items)
// ──────────────────────────────────────────────────────────────────────────
const TeachersTab = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

    const { data: teachers, isLoading: loadingTeachers } = useQuery({
        queryKey: ['edu-hub', 'admin-teachers'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listAllTeachersForAdmin();
            if (error) throw error;
            return (data ?? []) as Teacher[];
        },
    });

    const { data: cards } = useQuery({
        queryKey: ['edu-hub', 'teachers'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listTeacherCards();
            if (error) throw error;
            return (data ?? []) as TeacherCard[];
        },
    });

    const cardByStaffId = useMemo(() => {
        const m = new Map<string, TeacherCard>();
        (cards ?? []).forEach((c) => m.set(c.staff_id, c));
        return m;
    }, [cards]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return teachers ?? [];
        return (teachers ?? []).filter(
            (t) => t.name.toLowerCase().includes(q) || (t.subject ?? '').toLowerCase().includes(q),
        );
    }, [teachers, search]);

    const toggleHubActive = async (teacher: Teacher, nextActive: boolean) => {
        const res = await educationalHubService.upsertProfile({
            staff_id: teacher.id,
            banner_url: null,
            hub_bio: null,
            accent_color: null,
            external_url: null,
            is_hub_active: nextActive,
        });
        if (res.error) {
            toast({ title: 'บันทึกไม่ได้', description: res.error.message, variant: 'destructive' });
            return;
        }
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'teachers'] });
        toast({ title: nextActive ? 'เปิด HUB' : 'ปิด HUB', description: teacher.name });
    };

    if (selectedTeacher) {
        return (
            <TeacherItemsManager
                teacher={selectedTeacher}
                onBack={() => setSelectedTeacher(null)}
            />
        );
    }

    return (
        <div className="space-y-4">
            <Input
                placeholder="ค้นหาชื่อครู / วิชา..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
            />

            {loadingTeachers ? (
                <div className="text-center text-muted-foreground py-12">กำลังโหลด...</div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted/30">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ครู</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">วิชา/ฝ่าย</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">รายการ</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">HUB</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((t) => {
                                        const card = cardByStaffId.get(t.id);
                                        const total = card?.total_items ?? 0;
                                        const counts = card?.counts_by_category ?? {};
                                        return (
                                            <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <PersonAvatar name={t.name} photoUrl={t.photo_url} size="sm" />
                                                        <div>
                                                            <p className="text-sm font-medium">{t.name}</p>
                                                            <p className="text-xs text-muted-foreground">{t.position}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {t.subject ?? '—'}
                                                    {t.department && (
                                                        <p className="text-xs text-muted-foreground">{t.department}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="text-xs">รวม {total}</Badge>
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                        {Object.entries(counts).slice(0, 3).map(([k, n]) => (
                                                            <span key={k} className="text-[10px] text-muted-foreground">{k}:{n}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Switch
                                                        checked={card?.is_hub_active ?? true}
                                                        onCheckedChange={(v) => toggleHubActive(t, v)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedTeacher(t)}>
                                                        จัดการรายการ
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// Sub-component: items list for one teacher (used by admin drill-in)
const TeacherItemsManager = ({ teacher, onBack }: { teacher: Teacher; onBack: () => void }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<EduHubItem | null>(null);

    const { data: items, isLoading } = useQuery({
        queryKey: ['edu-hub', 'items', teacher.id, { publishedOnly: false }],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listItemsByTeacher(teacher.id, { publishedOnly: false });
            if (error) throw error;
            return (data ?? []) as EduHubItem[];
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['edu-hub', 'categories'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listCategories();
            if (error) throw error;
            return (data ?? []) as EduHubCategory[];
        },
    });

    const handleDelete = async (item: EduHubItem) => {
        if (!confirm(`ลบ "${item.title}"?`)) return;
        const res = await educationalHubService.deleteItem(item.id);
        if (res.error) {
            toast({ title: 'ลบไม่ได้', description: res.error.message, variant: 'destructive' });
            return;
        }
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'items', teacher.id] });
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'teachers'] });
        toast({ title: 'ลบรายการสำเร็จ' });
    };

    const togglePublished = async (item: EduHubItem) => {
        const res = await educationalHubService.updateItem(item.id, { is_published: !item.is_published });
        if (res.error) {
            toast({ title: 'บันทึกไม่ได้', description: res.error.message, variant: 'destructive' });
            return;
        }
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'items', teacher.id] });
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'teachers'] });
    };

    const categoryName = (id: string) => categories?.find((c) => c.id === id)?.name ?? '—';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-1" />กลับ
                    </Button>
                    <div className="flex items-center gap-2">
                        <PersonAvatar name={teacher.name} photoUrl={teacher.photo_url} size="md" />
                        <div>
                            <p className="font-semibold">{teacher.name}</p>
                            <p className="text-xs text-muted-foreground">{teacher.position}</p>
                        </div>
                    </div>
                </div>
                <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />เพิ่มรายการ
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center text-muted-foreground py-12">กำลังโหลด...</div>
            ) : (items ?? []).length === 0 ? (
                <div className="text-center text-muted-foreground py-12">ยังไม่มีรายการ</div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ประเภท</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ชื่อรายการ</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">หมวด</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">เผยแพร่</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items!.map((item) => {
                                    const Icon = ITEM_TYPE_ICON[item.item_type];
                                    return (
                                        <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="text-[10px]">
                                                    <Icon className="h-3 w-3 mr-1" />
                                                    {ITEM_TYPE_LABEL[item.item_type]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium">{item.title}</p>
                                                {item.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                                )}
                                                {item.file_size && (
                                                    <p className="text-[10px] text-muted-foreground">{formatFileSize(item.file_size)}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs">{categoryName(item.category_id)}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => togglePublished(item)}
                                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                                                        item.is_published ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {item.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                                    {item.is_published ? 'เผยแพร่' : 'ซ่อน'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => { setEditing(item); setDialogOpen(true); }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(item)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}</DialogTitle>
                    </DialogHeader>
                    {categories && categories.length > 0 ? (
                        <EduHubItemForm
                            ownerStaffId={teacher.id}
                            categories={categories}
                            initial={editing}
                            onSaved={() => setDialogOpen(false)}
                            onCancel={() => setDialogOpen(false)}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                            กรุณาเพิ่มหมวดหมู่ก่อน (แท็บ "หมวดหมู่")
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────
// TAB 3: All items (moderation)
// ──────────────────────────────────────────────────────────────────────────
const AllItemsTab = () => {
    const [filterType, setFilterType] = useState<'all' | EduHubItemType>('all');
    const [filterCat, setFilterCat] = useState<string>('all');
    const [filterPub, setFilterPub] = useState<'all' | 'published' | 'hidden'>('all');

    const { data: items, isLoading } = useQuery({
        queryKey: ['edu-hub', 'items', 'all', filterType, filterCat, filterPub],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listAllItemsAdmin({
                categoryId: filterCat === 'all' ? undefined : filterCat,
                itemType: filterType === 'all' ? undefined : filterType,
                publishedOnly: filterPub === 'all' ? undefined : filterPub === 'published',
            });
            if (error) throw error;
            return (data ?? []) as EduHubItem[];
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['edu-hub', 'categories'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listCategories();
            if (error) throw error;
            return (data ?? []) as EduHubCategory[];
        },
    });

    const { data: teachers } = useQuery({
        queryKey: ['edu-hub', 'admin-teachers'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listAllTeachersForAdmin();
            if (error) throw error;
            return (data ?? []) as Teacher[];
        },
    });

    const teacherName = (id: string) => teachers?.find((t) => t.id === id)?.name ?? '—';
    const teacherPhoto = (id: string) => teachers?.find((t) => t.id === id)?.photo_url ?? null;
    const categoryName = (id: string) => categories?.find((c) => c.id === id)?.name ?? '—';

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | EduHubItemType)}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="ประเภท" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทุกประเภท</SelectItem>
                        <SelectItem value="file">ไฟล์</SelectItem>
                        <SelectItem value="link">ลิงก์</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="text">ข้อความ</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterCat} onValueChange={setFilterCat}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="หมวด" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทุกหมวด</SelectItem>
                        {(categories ?? []).map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterPub} onValueChange={(v) => setFilterPub(v as 'all' | 'published' | 'hidden')}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทุกสถานะ</SelectItem>
                        <SelectItem value="published">เผยแพร่</SelectItem>
                        <SelectItem value="hidden">ซ่อน</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="text-center text-muted-foreground py-12">กำลังโหลด...</div>
            ) : (items ?? []).length === 0 ? (
                <div className="text-center text-muted-foreground py-12">ไม่พบรายการ</div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted/30">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ประเภท</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ชื่อ</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ครู</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">หมวด</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">สถานะ</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">View/DL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items!.map((item) => {
                                        const Icon = ITEM_TYPE_ICON[item.item_type];
                                        return (
                                            <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="text-[10px]">
                                                        <Icon className="h-3 w-3 mr-1" />
                                                        {ITEM_TYPE_LABEL[item.item_type]}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm max-w-xs">
                                                    <p className="font-medium truncate">{item.title}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <PersonAvatar
                                                            name={teacherName(item.owner_staff_id)}
                                                            photoUrl={teacherPhoto(item.owner_staff_id)}
                                                            size="xs"
                                                        />
                                                        <span className="text-xs">{teacherName(item.owner_staff_id)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs">{categoryName(item.category_id)}</td>
                                                <td className="px-4 py-3">
                                                    {item.is_published ? (
                                                        <Badge variant="default" className="text-[10px]">เผยแพร่</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px]">ซ่อน</Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {item.view_count} / {item.download_count}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
