import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import type { PageBlock, StatItem } from './types';

interface Props {
    block: PageBlock;
    onChange: (updated: PageBlock) => void;
}

export const BlockEditor = ({ block, onChange }: Props) => {
    const set = (key: string, value: string | StatItem[]) => {
        onChange({ ...block, props: { ...block.props, [key]: value } });
    };

    if (block.type === 'text') {
        return (
            <div className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">หัวข้อ (ถ้ามี)</Label>
                    <Input
                        value={block.props.title || ''}
                        onChange={(e) => set('title', e.target.value)}
                        placeholder="หัวข้อส่วนนี้"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">เนื้อหา</Label>
                    <textarea
                        value={block.props.content || ''}
                        onChange={(e) => set('content', e.target.value)}
                        placeholder="เนื้อหา..."
                        className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm bg-background"
                    />
                </div>
            </div>
        );
    }

    if (block.type === 'image') {
        return (
            <div className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">รูปภาพ</Label>
                    <ImageUpload
                        currentImage={block.props.image_url || ''}
                        onUploadComplete={(url) => set('image_url', url)}
                        folder="page-builder"
                        compressionPreset="banner"
                        bucket="school-images"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">คำบรรยาย (ถ้ามี)</Label>
                    <Input
                        value={block.props.caption || ''}
                        onChange={(e) => set('caption', e.target.value)}
                        placeholder="คำบรรยายรูปภาพ"
                    />
                </div>
            </div>
        );
    }

    if (block.type === 'banner') {
        return (
            <div className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">หัวข้อ</Label>
                    <Input
                        value={block.props.title || ''}
                        onChange={(e) => set('title', e.target.value)}
                        placeholder="หัวข้อ Banner"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">คำอธิบาย</Label>
                    <Input
                        value={block.props.subtitle || ''}
                        onChange={(e) => set('subtitle', e.target.value)}
                        placeholder="คำอธิบายเพิ่มเติม"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs">ข้อความปุ่ม (CTA)</Label>
                        <Input
                            value={block.props.cta_text || ''}
                            onChange={(e) => set('cta_text', e.target.value)}
                            placeholder="เช่น สมัครเรียน"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">ลิงก์ปุ่ม</Label>
                        <Input
                            value={block.props.cta_url || ''}
                            onChange={(e) => set('cta_url', e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (block.type === 'stats') {
        const stats: StatItem[] = block.props.stats || [{ value: '', label: '' }];
        return (
            <div className="space-y-3">
                <Label className="text-xs">รายการสถิติ</Label>
                {stats.map((stat, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <Input
                            value={stat.value}
                            onChange={(e) => {
                                const next = [...stats];
                                next[i] = { ...next[i], value: e.target.value };
                                set('stats', next);
                            }}
                            placeholder="ค่า (เช่น 50+)"
                            className="w-28"
                        />
                        <Input
                            value={stat.label}
                            onChange={(e) => {
                                const next = [...stats];
                                next[i] = { ...next[i], label: e.target.value };
                                set('stats', next);
                            }}
                            placeholder="Label"
                            className="flex-1"
                        />
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => set('stats', stats.filter((_, j) => j !== i))}
                        >
                            ลบ
                        </Button>
                    </div>
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => set('stats', [...stats, { value: '', label: '' }])}
                >
                    + เพิ่มสถิติ
                </Button>
            </div>
        );
    }

    if (block.type === 'map') {
        return (
            <div className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">หัวข้อแผนที่ (ถ้ามี)</Label>
                    <Input
                        value={block.props.map_title || ''}
                        onChange={(e) => set('map_title', e.target.value)}
                        placeholder="ที่ตั้งโรงเรียน"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Google Maps Embed URL</Label>
                    <Input
                        value={block.props.embed_url || ''}
                        onChange={(e) => set('embed_url', e.target.value)}
                        placeholder="https://www.google.com/maps/embed?pb=..."
                    />
                    <p className="text-xs text-muted-foreground">
                        Google Maps → Share → Embed a map → คัดลอก src="..." ออกมา
                    </p>
                </div>
            </div>
        );
    }

    return null;
};
