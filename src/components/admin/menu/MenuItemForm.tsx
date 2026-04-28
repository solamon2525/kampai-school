import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MENU_ICON_OPTIONS, type MenuItem } from '@/lib/menuDefaults';
import { resolveMenuIcon } from '@/lib/menuIcons';

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: (item: MenuItem) => void;
    initial?: MenuItem | null;
    /** other items in the config — used to populate parent dropdown */
    siblings: MenuItem[];
}

const emptyItem = (): MenuItem => ({
    id: `item-${Date.now()}`,
    label: '',
    href: '',
    icon: 'FileText',
    parent: null,
    order: 0,
});

export const MenuItemForm = ({ open, onClose, onSave, initial, siblings }: Props) => {
    const [draft, setDraft] = useState<MenuItem>(emptyItem());

    useEffect(() => {
        if (open) setDraft(initial ?? emptyItem());
    }, [open, initial]);

    const update = (patch: Partial<MenuItem>) => setDraft((d) => ({ ...d, ...patch }));

    // Top-level items only (can't nest more than 2 levels)
    const possibleParents = siblings.filter((s) => s.parent === null && s.id !== draft.id);

    const handleSave = () => {
        if (!draft.label.trim()) return;
        const finalItem: MenuItem = {
            ...draft,
            href: draft.href?.trim() ? draft.href.trim() : null,
        };
        onSave(finalItem);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{initial ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="menu-label">ชื่อเมนู *</Label>
                        <Input
                            id="menu-label"
                            value={draft.label}
                            onChange={(e) => update({ label: e.target.value })}
                            placeholder="เช่น เกี่ยวกับเรา"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="menu-href">ลิงก์ (URL)</Label>
                        <Input
                            id="menu-href"
                            value={draft.href ?? ''}
                            onChange={(e) => update({ href: e.target.value })}
                            placeholder="/about — ปล่อยว่างถ้าเป็น dropdown ไม่มีลิงก์"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            เริ่มด้วย <code>/</code> สำหรับลิงก์ภายในเว็บ หรือ <code>https://</code> สำหรับลิงก์ภายนอก
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="menu-icon">ไอคอน</Label>
                        <Select value={draft.icon} onValueChange={(v) => update({ icon: v })}>
                            <SelectTrigger id="menu-icon">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                                {MENU_ICON_OPTIONS.map((name) => {
                                    const Icon = resolveMenuIcon(name);
                                    return (
                                        <SelectItem key={name} value={name}>
                                            <span className="flex items-center gap-2">
                                                <Icon className="w-4 h-4" />
                                                {name}
                                            </span>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="menu-parent">อยู่ใต้เมนูใหญ่</Label>
                        <Select
                            value={draft.parent ?? '__root__'}
                            onValueChange={(v) => update({ parent: v === '__root__' ? null : v })}
                        >
                            <SelectTrigger id="menu-parent">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__root__">— ไม่มี (เมนูระดับบนสุด) —</SelectItem>
                                {possibleParents.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                            ถ้าเลือก parent → เมนูนี้จะอยู่ใน dropdown ของ parent
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
                    <Button onClick={handleSave} disabled={!draft.label.trim()}>บันทึก</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MenuItemForm;
