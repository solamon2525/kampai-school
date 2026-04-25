import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '../../shared/ImageUpload';

interface Props {
    settings: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

export const HeroSection = ({ settings, onChange }: Props) => (
    <>
        {/* Hero Section */}
        <Card>
            <CardHeader>
                <CardTitle>ส่วน Hero (หน้าแรก)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>ภาพพื้นหลัง Hero (Fallback — ใช้เมื่อไม่มีสไลด์)</Label>
                    <ImageUpload
                        currentImage={settings.hero_image_url || ''}
                        onUploadComplete={(url) => onChange('hero_image_url', url)}
                        folder="hero"
                        compressionPreset="banner"
                        bucket="school-images"
                    />
                    <p className="text-xs text-muted-foreground">รูปนี้จะแสดงเมื่อไม่มีสไลด์ใน Hero Slideshow</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="hero_badge">ข้อความ Badge (เช่น เปิดรับสมัครนักเรียนใหม่)</Label>
                    <Input
                        id="hero_badge"
                        value={settings.hero_badge || ''}
                        onChange={(e) => onChange('hero_badge', e.target.value)}
                        placeholder="เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2568"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="hero_title_1">ข้อความหัวเรื่อง บรรทัด 1</Label>
                    <Input
                        id="hero_title_1"
                        value={settings.hero_title_1 || ''}
                        onChange={(e) => onChange('hero_title_1', e.target.value)}
                        placeholder="ก้าวสู่อนาคต"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="hero_title_2">ข้อความหัวเรื่อง บรรทัด 2 (สีเน้น)</Label>
                    <Input
                        id="hero_title_2"
                        value={settings.hero_title_2 || ''}
                        onChange={(e) => onChange('hero_title_2', e.target.value)}
                        placeholder="ด้วยปัญญา"
                    />
                </div>
            </CardContent>
        </Card>

        {/* Hero Stats */}
        <Card>
            <CardHeader>
                <CardTitle>สถิติโรงเรียน (แสดงใน Hero Section)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="stat_students">จำนวนนักเรียน</Label>
                        <Input
                            id="stat_students"
                            value={settings.stat_students || ''}
                            onChange={(e) => onChange('stat_students', e.target.value)}
                            placeholder="2,500+"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stat_students_label">Label</Label>
                        <Input
                            id="stat_students_label"
                            value={settings.stat_students_label || ''}
                            onChange={(e) => onChange('stat_students_label', e.target.value)}
                            placeholder="นักเรียน"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="stat_university">อัตราเข้ามหาวิทยาลัย</Label>
                        <Input
                            id="stat_university"
                            value={settings.stat_university || ''}
                            onChange={(e) => onChange('stat_university', e.target.value)}
                            placeholder="98%"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stat_university_label">Label</Label>
                        <Input
                            id="stat_university_label"
                            value={settings.stat_university_label || ''}
                            onChange={(e) => onChange('stat_university_label', e.target.value)}
                            placeholder="ผ่านเข้ามหาวิทยาลัย"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="stat_years">จำนวนปีก่อตั้ง</Label>
                        <Input
                            id="stat_years"
                            value={settings.stat_years || ''}
                            onChange={(e) => onChange('stat_years', e.target.value)}
                            placeholder="50+"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stat_years_label">Label</Label>
                        <Input
                            id="stat_years_label"
                            value={settings.stat_years_label || ''}
                            onChange={(e) => onChange('stat_years_label', e.target.value)}
                            placeholder="ปีแห่งความเป็นเลิศ"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    </>
);
