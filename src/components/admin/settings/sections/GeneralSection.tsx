import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { ImageUpload } from '../../shared/ImageUpload';

interface Props {
    settings: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

export const GeneralSection = ({ settings, onChange }: Props) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                ข้อมูลทั่วไป
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Logo โรงเรียน</Label>
                <div className="flex items-start gap-4">
                    <ImageUpload
                        currentImage={settings.school_logo_url || ''}
                        onUploadComplete={(url) => onChange('school_logo_url', url)}
                        folder="logo"
                        compressionPreset="avatar"
                        bucket="school-images"
                    />
                    <p className="text-xs text-muted-foreground pt-2">
                        แนะนำรูปสี่เหลี่ยมจัตุรัส<br />
                        PNG พื้นใส จะแสดงในวงกลมที่ Navbar<br />
                        ถ้าไม่อัปโหลดจะใช้ตัวอักษรย่อ
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="school_name">ชื่อโรงเรียน</Label>
                <Input
                    id="school_name"
                    value={settings.school_name || ''}
                    onChange={(e) => onChange('school_name', e.target.value)}
                    placeholder="โรงเรียน..."
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="school_tagline">คำขวัญ/Tagline</Label>
                <Input
                    id="school_tagline"
                    value={settings.school_tagline || ''}
                    onChange={(e) => onChange('school_tagline', e.target.value)}
                    placeholder="ก้าวสู่อนาคตด้วยปัญญา"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="academic_year">ปีการศึกษาปัจจุบัน</Label>
                <Input
                    id="academic_year"
                    value={settings.academic_year || ''}
                    onChange={(e) => onChange('academic_year', e.target.value)}
                    placeholder="2568"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="school_description">คำอธิบายโรงเรียน (แสดงใน Hero Section)</Label>
                <textarea
                    id="school_description"
                    value={settings.school_description || ''}
                    onChange={(e) => onChange('school_description', e.target.value)}
                    placeholder="สถาบันการศึกษาชั้นนำระดับมัธยมศึกษา..."
                    className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                />
            </div>
        </CardContent>
    </Card>
);
