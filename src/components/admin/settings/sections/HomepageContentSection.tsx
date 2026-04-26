import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';

interface Props {
    settings: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

interface Quicklink {
    icon: string;
    label: string;
    href: string;
}

const DEFAULT_QUICKLINKS: Quicklink[] = [
    { icon: '📰', label: 'ข่าวสาร',    href: '/news' },
    { icon: '🖼️', label: 'แกลเลอรี่', href: '/gallery' },
    { icon: '📄', label: 'เอกสาร',    href: '/documents' },
    { icon: '📝', label: 'สมัครเรียน', href: '/enrollment' },
];

export const HomepageContentSection = ({ settings, onChange }: Props) => {
    // Quicklinks JSON state
    const [quicklinks, setQuicklinks] = useState<Quicklink[]>(DEFAULT_QUICKLINKS);

    useEffect(() => {
        const raw = settings.quicklinks_json;
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) setQuicklinks(parsed);
            } catch { /* ignore */ }
        }
    }, [settings.quicklinks_json]);

    const updateQuicklink = (i: number, key: keyof Quicklink, value: string) => {
        const next = quicklinks.map((q, idx) => idx === i ? { ...q, [key]: value } : q);
        setQuicklinks(next);
        onChange('quicklinks_json', JSON.stringify(next));
    };

    const addQuicklink = () => {
        const next = [...quicklinks, { icon: '🔗', label: 'ลิงก์ใหม่', href: '/' }];
        setQuicklinks(next);
        onChange('quicklinks_json', JSON.stringify(next));
    };

    const removeQuicklink = (i: number) => {
        const next = quicklinks.filter((_, idx) => idx !== i);
        setQuicklinks(next);
        onChange('quicklinks_json', JSON.stringify(next));
    };

    return (
        <>
            {/* Intro Video */}
            <Card>
                <CardHeader>
                    <CardTitle>🎬 วิดีโอแนะนำโรงเรียน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="intro_video_url">YouTube Embed URL</Label>
                        <Input
                            id="intro_video_url"
                            value={settings.intro_video_url || ''}
                            onChange={(e) => onChange('intro_video_url', e.target.value)}
                            placeholder="https://www.youtube.com/embed/VIDEO_ID"
                        />
                        <p className="text-xs text-muted-foreground">
                            ใช้ฟอร์ม embed (เช่น https://www.youtube.com/embed/xxxx) ไม่ใช่ watch URL — ถ้าว่างจะแสดง thumbnail ตัวอย่าง
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Thumbnail (ใช้เมื่อยังไม่ใส่ video URL)</Label>
                        <ImageUpload
                            bucket="school-images"
                            value={settings.intro_video_thumbnail || ''}
                            onChange={(url) => onChange('intro_video_thumbnail', url)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Quicklinks */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>🔗 เมนูด่วน (Quicklinks)</CardTitle>
                    <Button type="button" size="sm" onClick={addQuicklink} className="gap-1">
                        <Plus className="w-4 h-4" /> เพิ่ม
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {quicklinks.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <Input
                                value={q.icon}
                                onChange={(e) => updateQuicklink(i, 'icon', e.target.value)}
                                placeholder="📰"
                                className="w-16 text-center"
                            />
                            <Input
                                value={q.label}
                                onChange={(e) => updateQuicklink(i, 'label', e.target.value)}
                                placeholder="ชื่อเมนู"
                                className="flex-1"
                            />
                            <Input
                                value={q.href}
                                onChange={(e) => updateQuicklink(i, 'href', e.target.value)}
                                placeholder="/path-or-url"
                                className="flex-1"
                            />
                            <Button type="button" size="sm" variant="destructive" onClick={() => removeQuicklink(i)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                        Icon ใช้ emoji ได้เลย (เช่น 📰 🖼️ 📄 📝 🎓 📞) — link เป็น path ภายใน (`/news`) หรือ external URL
                    </p>
                </CardContent>
            </Card>

            {/* OBEC Links Visibility */}
            <Card>
                <CardHeader>
                    <CardTitle>🖥️ ระบบ OBEC E-Services</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="obec_links_visible">ซ่อนระบบ (comma-separated keys)</Label>
                        <Input
                            id="obec_links_visible"
                            value={settings.obec_links_visible || ''}
                            onChange={(e) => onChange('obec_links_visible', e.target.value)}
                            placeholder="เช่น school-mis,obec-asset,amss"
                        />
                        <p className="text-xs text-muted-foreground">
                            Keys ที่ใช้ได้: dmc, school-lunch, cct, school-mis, emis, obec-asset, amss, dpa — ถ้าว่างจะแสดงทุกระบบ
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};
