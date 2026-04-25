import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface Props {
    settings: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

export const ContactSection = ({ settings, onChange }: Props) => {
    const socialLinks: { platform: string; url: string }[] = (() => {
        try {
            return settings.social_links ? JSON.parse(settings.social_links) : [];
        } catch {
            return [];
        }
    })();

    const updateSocialLinks = (links: { platform: string; url: string }[]) => {
        onChange('social_links', JSON.stringify(links));
    };

    return (
        <>
            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle>ข้อมูลติดต่อ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="contact_phone">เบอร์โทรศัพท์</Label>
                        <Input
                            id="contact_phone"
                            value={settings.contact_phone || ''}
                            onChange={(e) => onChange('contact_phone', e.target.value)}
                            placeholder="02-xxx-xxxx"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact_email">อีเมล</Label>
                        <Input
                            id="contact_email"
                            type="email"
                            value={settings.contact_email || ''}
                            onChange={(e) => onChange('contact_email', e.target.value)}
                            placeholder="info@school.ac.th"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact_hours">เวลาทำการ</Label>
                        <Input
                            id="contact_hours"
                            value={settings.contact_hours || ''}
                            onChange={(e) => onChange('contact_hours', e.target.value)}
                            placeholder="จันทร์ - ศุกร์ 07:30 - 16:30 น."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact_address">ที่อยู่</Label>
                        <textarea
                            id="contact_address"
                            value={settings.contact_address || ''}
                            onChange={(e) => onChange('contact_address', e.target.value)}
                            placeholder="123 ถนน... เขต... จังหวัด..."
                            className="w-full min-h-[60px] px-3 py-2 border rounded-md text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="google_maps_embed">Google Maps Embed URL</Label>
                        <Input
                            id="google_maps_embed"
                            value={settings.google_maps_embed || ''}
                            onChange={(e) => onChange('google_maps_embed', e.target.value)}
                            placeholder="https://www.google.com/maps/embed?pb=..."
                        />
                        <p className="text-xs text-muted-foreground">
                            คัดลอก URL จาก Google Maps → Share → Embed a map
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
                <CardHeader>
                    <CardTitle>โซเชียลมีเดีย</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {socialLinks.map((link, index) => (
                        <div key={index} className="flex gap-4 items-start">
                            <div className="w-1/3">
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={link.platform}
                                    onChange={(e) => {
                                        const newLinks = [...socialLinks];
                                        newLinks[index] = { ...newLinks[index], platform: e.target.value };
                                        updateSocialLinks(newLinks);
                                    }}
                                >
                                    <option value="facebook">Facebook</option>
                                    <option value="line">Line</option>
                                    <option value="youtube">Youtube</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="twitter">Twitter/X</option>
                                    <option value="tiktok">TikTok</option>
                                    <option value="website">Website</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <Input
                                    value={link.url}
                                    onChange={(e) => {
                                        const newLinks = [...socialLinks];
                                        newLinks[index] = { ...newLinks[index], url: e.target.value };
                                        updateSocialLinks(newLinks);
                                    }}
                                    placeholder="URL (เช่น https://facebook.com/...)"
                                />
                            </div>
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => updateSocialLinks(socialLinks.filter((_, i) => i !== index))}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        onClick={() => updateSocialLinks([...socialLinks, { platform: 'facebook', url: '' }])}
                    >
                        + เพิ่มโซเชียลมีเดีย
                    </Button>
                </CardContent>
            </Card>

            {/* Documents */}
            <Card>
                <CardHeader>
                    <CardTitle>เอกสารดาวน์โหลด</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="academic_calendar_url">ลิงก์ปฏิทินการศึกษา (PDF)</Label>
                        <Input
                            id="academic_calendar_url"
                            value={settings.academic_calendar_url || ''}
                            onChange={(e) => onChange('academic_calendar_url', e.target.value)}
                            placeholder="https://..."
                        />
                        <p className="text-xs text-muted-foreground">
                            ใส่ลิงก์ไฟล์ PDF (เช่นจาก Google Drive) หากไม่ใส่ ปุ่มดาวน์โหลดจะไม่ทำงาน
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};
