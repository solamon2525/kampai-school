import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    settings: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

export const AboutCurriculumSection = ({ settings, onChange }: Props) => (
    <>
        {/* Section Headers */}
        <Card>
            <CardHeader>
                <CardTitle>หัวข้อส่วนต่างๆ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="about_title_1">หัวข้อ About ส่วน 1</Label>
                        <Input
                            id="about_title_1"
                            value={settings.about_title_1 || ''}
                            onChange={(e) => onChange('about_title_1', e.target.value)}
                            placeholder="สถาบันการศึกษาที่"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="about_title_2">หัวข้อ About ส่วน 2 (สีเน้น)</Label>
                        <Input
                            id="about_title_2"
                            value={settings.about_title_2 || ''}
                            onChange={(e) => onChange('about_title_2', e.target.value)}
                            placeholder="ไว้วางใจ"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="curriculum_title_1">หัวข้อ หลักสูตร ส่วน 1</Label>
                        <Input
                            id="curriculum_title_1"
                            value={settings.curriculum_title_1 || ''}
                            onChange={(e) => onChange('curriculum_title_1', e.target.value)}
                            placeholder="หลักสูตรที่"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="curriculum_title_2">หัวข้อ หลักสูตร ส่วน 2 (สีเน้น)</Label>
                        <Input
                            id="curriculum_title_2"
                            value={settings.curriculum_title_2 || ''}
                            onChange={(e) => onChange('curriculum_title_2', e.target.value)}
                            placeholder="หลากหลาย"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="curriculum_description">คำอธิบายหลักสูตร</Label>
                    <textarea
                        id="curriculum_description"
                        value={settings.curriculum_description || ''}
                        onChange={(e) => onChange('curriculum_description', e.target.value)}
                        placeholder="เราออกแบบหลักสูตรที่ตอบโจทย์ความสนใจและเป้าหมายของนักเรียนทุกคน..."
                        className="w-full min-h-[60px] px-3 py-2 border rounded-md text-sm"
                    />
                </div>
            </CardContent>
        </Card>

        {/* Curriculum Stats */}
        <Card>
            <CardHeader>
                <CardTitle>สถิติ (หน้าหลักสูตร)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="curriculum_study_time">เวลาเรียน</Label>
                        <Input
                            id="curriculum_study_time"
                            value={settings.curriculum_study_time || ''}
                            onChange={(e) => onChange('curriculum_study_time', e.target.value)}
                            placeholder="07:30 - 15:30"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="curriculum_class_size">จำนวนนักเรียนต่อห้อง</Label>
                        <Input
                            id="curriculum_class_size"
                            value={settings.curriculum_class_size || ''}
                            onChange={(e) => onChange('curriculum_class_size', e.target.value)}
                            placeholder="30-35 คน"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="curriculum_duration">ระยะเวลาหลักสูตร</Label>
                        <Input
                            id="curriculum_duration"
                            value={settings.curriculum_duration || ''}
                            onChange={(e) => onChange('curriculum_duration', e.target.value)}
                            placeholder="6 ปี"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="curriculum_duration_label">Label ระยะเวลา</Label>
                        <Input
                            id="curriculum_duration_label"
                            value={settings.curriculum_duration_label || ''}
                            onChange={(e) => onChange('curriculum_duration_label', e.target.value)}
                            placeholder="ระยะเวลาหลักสูตร (ม.1-ม.6)"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* About Stats */}
        <Card>
            <CardHeader>
                <CardTitle>สถิติ (ส่วน About - พื้นหลังสีน้ำเงิน)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {[
                    { key: 'about_stat_1', label: 'สถิติ 1', placeholder: '50+', labelPlaceholder: 'ปีแห่งประสบการณ์' },
                    { key: 'about_stat_2', label: 'สถิติ 2', placeholder: '2,500+', labelPlaceholder: 'นักเรียนปัจจุบัน' },
                    { key: 'about_stat_3', label: 'สถิติ 3', placeholder: '200+', labelPlaceholder: 'บุคลากรคุณภาพ' },
                    { key: 'about_stat_4', label: 'สถิติ 4', placeholder: '15,000+', labelPlaceholder: 'ศิษย์เก่าทั่วประเทศ' },
                ].map((stat) => (
                    <div key={stat.key} className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor={stat.key}>{stat.label}</Label>
                            <Input
                                id={stat.key}
                                value={settings[stat.key] || ''}
                                onChange={(e) => onChange(stat.key, e.target.value)}
                                placeholder={stat.placeholder}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${stat.key}_label`}>Label</Label>
                            <Input
                                id={`${stat.key}_label`}
                                value={settings[`${stat.key}_label`] || ''}
                                onChange={(e) => onChange(`${stat.key}_label`, e.target.value)}
                                placeholder={stat.labelPlaceholder}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    </>
);
