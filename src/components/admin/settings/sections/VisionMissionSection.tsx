import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { RichTextEditor } from '../../shared/RichTextEditor';
import { ImageUpload } from '../../shared/ImageUpload';

interface Props {
    settings: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

const ALIGN_OPTIONS = [
    { value: 'left', icon: AlignLeft, label: 'ชิดซ้าย' },
    { value: 'center', icon: AlignCenter, label: 'กึ่งกลาง' },
    { value: 'right', icon: AlignRight, label: 'ชิดขวา' },
    { value: 'justify', icon: AlignJustify, label: 'เกลี่ยเต็ม' },
] as const;

const CARDS = [
    { key: 'vision', label: 'วิสัยทัศน์' },
    { key: 'mission', label: 'พันธกิจ' },
    { key: 'values', label: 'ค่านิยม' },
    { key: 'excellence', label: 'ความเป็นเลิศ' },
] as const;

export const VisionMissionSection = ({ settings, onChange }: Props) => (
    <>
        {/* Rich text content */}
        <Card>
            <CardHeader>
                <CardTitle>วิสัยทัศน์ พันธกิจ ค่านิยม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>วิสัยทัศน์</Label>
                    <RichTextEditor
                        value={settings.school_vision || ''}
                        onChange={(val) => onChange('school_vision', val)}
                        placeholder="เป็นสถานศึกษาชั้นนำที่พัฒนาผู้เรียนให้มีความเป็นเลิศ..."
                    />
                </div>
                <div className="space-y-2">
                    <Label>พันธกิจ</Label>
                    <RichTextEditor
                        value={settings.school_mission || ''}
                        onChange={(val) => onChange('school_mission', val)}
                        placeholder="จัดการศึกษาที่มีคุณภาพ พัฒนาหลักสูตรที่ทันสมัย..."
                    />
                </div>
                <div className="space-y-2">
                    <Label>ค่านิยม</Label>
                    <RichTextEditor
                        value={settings.school_values || ''}
                        onChange={(val) => onChange('school_values', val)}
                        placeholder="ความซื่อสัตย์ ความรับผิดชอบ ความเคารพ..."
                    />
                </div>
                <div className="space-y-2">
                    <Label>ความเป็นเลิศ</Label>
                    <RichTextEditor
                        value={settings.school_excellence || ''}
                        onChange={(val) => onChange('school_excellence', val)}
                        placeholder="มุ่งมั่นสู่ความเป็นเลิศในทุกด้าน..."
                    />
                </div>
            </CardContent>
        </Card>

        {/* About Card Styles */}
        <Card>
            <CardHeader>
                <CardTitle>ตั้งค่าการ์ด 4 ใบ (หน้าเกี่ยวกับเรา)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {CARDS.map((card) => (
                    <div key={card.key} className="border rounded-xl p-4 space-y-4">
                        <p className="font-semibold text-sm text-foreground">{card.label}</p>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">รูปภาพประจำการ์ด (แทน icon)</Label>
                            <ImageUpload
                                currentImage={settings[`${card.key}_image_url`] || ''}
                                onUploadComplete={(url) => onChange(`${card.key}_image_url`, url)}
                                folder="about-cards"
                                compressionPreset="avatar"
                                bucket="school-images"
                            />
                            {settings[`${card.key}_image_url`] && (
                                <button
                                    type="button"
                                    onClick={() => onChange(`${card.key}_image_url`, '')}
                                    className="text-xs text-destructive hover:underline mt-1"
                                >
                                    ลบรูปภาพ (ใช้ icon แทน)
                                </button>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">การจัดวางข้อความ</Label>
                            <div className="flex gap-1">
                                {ALIGN_OPTIONS.map((opt) => {
                                    const isActive = (settings[`${card.key}_text_align`] || 'left') === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            title={opt.label}
                                            onClick={() => onChange(`${card.key}_text_align`, opt.value)}
                                            className={`p-2 rounded-md border transition-colors ${isActive
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                                                }`}
                                        >
                                            <opt.icon className="w-4 h-4" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">สีพื้นหลังการ์ด</Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={settings[`${card.key}_bg_color`] || '#ffffff'}
                                    onChange={(e) => onChange(`${card.key}_bg_color`, e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer border border-border"
                                />
                                <span className="text-sm text-muted-foreground">
                                    {settings[`${card.key}_bg_color`] || 'ค่าเริ่มต้น (bg-card)'}
                                </span>
                                {settings[`${card.key}_bg_color`] && (
                                    <button
                                        type="button"
                                        onClick={() => onChange(`${card.key}_bg_color`, '')}
                                        className="text-xs text-destructive hover:underline"
                                    >
                                        ล้างสี
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    </>
);
