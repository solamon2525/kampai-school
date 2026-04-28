import { useEffect, useState } from 'react';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useMenuConfig } from '@/hooks/useMenuConfig';
import {
    DEFAULT_MENU_CONFIG, type MenuConfig, type MenuItem, type NavStyle,
} from '@/lib/menuDefaults';
import { MenuItemList } from './MenuItemList';
import { MenuItemForm } from './MenuItemForm';
import { NavStyleEditor } from './NavStyleEditor';
import { NavbarPreview } from './NavbarPreview';

/**
 * MenuManager — Single source of truth for public site navigation.
 *
 * Coordinates:
 *  - MenuItemList (DnD-sortable list of top-level items + their children)
 *  - MenuItemForm (modal for add/edit)
 *  - NavStyleEditor (color + font controls)
 *  - NavbarPreview (live mock)
 *
 * Persists draft locally; only commits to DB on Save.
 */
export const MenuManager = () => {
    const { config, loading, save, saving } = useMenuConfig();

    const [draft, setDraft] = useState<MenuConfig>(DEFAULT_MENU_CONFIG);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<MenuItem | null>(null);
    const [dirty, setDirty] = useState(false);

    // Sync draft with server config when it loads / changes
    useEffect(() => {
        if (!loading) {
            setDraft(config);
            setDirty(false);
        }
    }, [config, loading]);

    const updateItems = (items: MenuItem[]) => {
        setDraft((d) => ({ ...d, items }));
        setDirty(true);
    };

    const updateStyle = (style: NavStyle) => {
        setDraft((d) => ({ ...d, style }));
        setDirty(true);
    };

    const handleAdd = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const handleEdit = (item: MenuItem) => {
        setEditing(item);
        setFormOpen(true);
    };

    const handleSaveItem = (item: MenuItem) => {
        const exists = draft.items.some((i) => i.id === item.id);
        if (exists) {
            updateItems(draft.items.map((i) => (i.id === item.id ? item : i)));
        } else {
            // New item — append with order = end of its sibling group
            const siblings = draft.items.filter((i) => i.parent === item.parent);
            const nextOrder = siblings.length;
            updateItems([...draft.items, { ...item, order: nextOrder }]);
        }
    };

    const handleSaveAll = async () => {
        try {
            await save(draft);
            setDirty(false);
            toast.success('บันทึกเมนูเรียบร้อยแล้ว');
        } catch (err) {
            console.error(err);
            toast.error('บันทึกไม่สำเร็จ — โปรดลองใหม่');
        }
    };

    const handleResetDefaults = () => {
        if (!confirm('คืนค่าเริ่มต้นทั้งหมด? (เมนูและสีจะถูกแทนที่ด้วยค่ามาตรฐาน)')) return;
        setDraft(DEFAULT_MENU_CONFIG);
        setDirty(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">จัดการเมนูเว็บไซต์</h1>
                    <p className="text-sm text-muted-foreground">
                        เพิ่ม/แก้/ลบเมนู, จัดกลุ่มเป็น dropdown, ปรับสีและฟอนต์ — ใช้ทุกหน้าของเว็บสาธารณะ
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleResetDefaults} disabled={saving}>
                        <RotateCcw className="w-4 h-4 mr-1" /> คืนค่าเริ่มต้น
                    </Button>
                    <Button onClick={handleSaveAll} disabled={!dirty || saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        บันทึก
                    </Button>
                </div>
            </div>

            {dirty && (
                <div className="text-xs px-3 py-2 rounded bg-accent-soft/30 text-foreground border border-accent-soft/50">
                    มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก — กดปุ่ม "บันทึก" เพื่อนำไปใช้กับเว็บไซต์
                </div>
            )}

            {/* Live Preview — top, full width */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">ตัวอย่างหน้าเว็บ</CardTitle>
                </CardHeader>
                <CardContent>
                    <NavbarPreview config={draft} />
                </CardContent>
            </Card>

            {/* Two-column: items list + style editor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">รายการเมนู</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MenuItemList
                            items={draft.items}
                            onChange={updateItems}
                            onEdit={handleEdit}
                            onAdd={handleAdd}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">สีและฟอนต์</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <NavStyleEditor style={draft.style} onChange={updateStyle} />
                    </CardContent>
                </Card>
            </div>

            <MenuItemForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSave={handleSaveItem}
                initial={editing}
                siblings={draft.items}
            />
        </div>
    );
};

export default MenuManager;
