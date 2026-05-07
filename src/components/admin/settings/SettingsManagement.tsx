import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRolesManagement } from './UserRolesManagement';
import { EmailSubscribersManagement } from './EmailSubscribersManagement';
import { GeneralSection } from './sections/GeneralSection';
import { HeroSection } from './sections/HeroSection';
import { VisionMissionSection } from './sections/VisionMissionSection';
import { AboutCurriculumSection } from './sections/AboutCurriculumSection';
import { ContactSection } from './sections/ContactSection';
import { FooterSection } from './sections/FooterSection';
import { HomepageContentSection } from './sections/HomepageContentSection';

export const SettingsManagement = () => {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('school_settings')
                .select('*');

            if (error) throw error;

            const settingsMap: Record<string, string> = {};
            (data as any[])?.forEach((setting: any) => {
                settingsMap[setting.key] = setting.value || '';
            });
            setSettings(settingsMap);
        } catch {
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดการตั้งค่าได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updates = Object.entries(settings).map(([key, value]) => ({ key, value: value ?? '' }));
            const { error } = await supabase
                .from('school_settings')
                .upsert(updates as any, { onConflict: 'key' });
            if (error) throw error;
            await queryClient.invalidateQueries({ queryKey: ['school-settings'] });
            localStorage.removeItem('school_settings_cache');
            toast({ title: 'สำเร็จ', description: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' });
        } catch (err: any) {
            console.error('Settings save error:', err);
            toast({
                variant: 'destructive',
                title: 'บันทึกไม่สำเร็จ',
                description: err?.message || 'ไม่สามารถบันทึกการตั้งค่าได้ — ดู Console สำหรับรายละเอียด',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    const sectionProps = { settings, onChange: handleChange };

    return (
        <div className="p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">ตั้งค่าระบบ</h1>
                    <p className="text-muted-foreground">จัดการข้อมูลและการตั้งค่าโรงเรียน</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </Button>
            </div>

            <div className="space-y-6">
                <GeneralSection {...sectionProps} />

                {/* Hero Slideshow — shortcut to dedicated manager */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5" />
                            Hero Slideshow
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            จัดการสไลด์ (เพิ่ม ลบ เรียงลำดับ ตั้งค่าช่วงเวลา) ได้ที่:
                        </p>
                        <Link
                            to="/admin/dashboard/hero-slides"
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Hero Slides Manager →
                        </Link>
                    </CardContent>
                </Card>

                <HeroSection {...sectionProps} />
                <VisionMissionSection {...sectionProps} />
                <AboutCurriculumSection {...sectionProps} />
                <HomepageContentSection {...sectionProps} />
                <ContactSection {...sectionProps} />
                <FooterSection {...sectionProps} />

                <UserRolesManagement />
                <EmailSubscribersManagement />

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="w-4 h-4" />
                        {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
