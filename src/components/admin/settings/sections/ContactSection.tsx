import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { parseMapInput, isEmbedUrl } from '@/utils/mapUtils';

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
                        <textarea
                            id="google_maps_embed"
                            value={settings.google_maps_embed || ''}
                            onChange={(e) => {
                                const raw = e.target.value;
                                // ถ้าวางก้อน <iframe> มา ดึงเฉพาะ src= ออกมาให้อัตโนมัติ
                                const parsed = parseMapInput(raw);
                                if (raw.trim().toLowerCase().startsWith('<iframe') && parsed.embedUrl) {
                                    onChange('google_maps_embed', parsed.embedUrl);
                                } else {
                                    onChange('google_maps_embed', raw);
                                }
                            }}
                            placeholder="https://www.google.com/maps/embed?pb=..."
                            rows={3}
                            className="w-full min-h-[72px] px-3 py-2 border rounded-md text-sm font-mono"
                        />
                        {(() => {
                            const v = (settings.google_maps_embed || '').trim();
                            if (!v) return (
                                <p className="text-xs text-muted-foreground">
                                    Google Maps → Share → <b>Embed a map</b> → Copy HTML แล้ววางที่นี่ (ระบบจะดึง URL ให้อัตโนมัติ)
                                </p>
                            );
                            if (isEmbedUrl(v)) return (
                                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> URL ถูกต้อง พร้อมแสดงบนเว็บ
                                </p>
                            );
                            return (
                                <div className="text-xs flex items-start gap-1.5 p-2 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
                                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <b>URL นี้ embed ไม่ได้</b> — ลิงก์ที่ขึ้นต้นด้วย <code>maps.app.goo.gl</code> หรือ <code>maps.google.com/place/</code> เป็น share link ที่ Google บล็อกใน iframe<br />
                                        วิธีที่ถูก: เปิด Google Maps → กด <b>Share</b> → แท็บ <b>Embed a map</b> → กด Copy HTML → วางที่ช่องนี้
                                    </div>
                                </div>
                            );
                        })()}
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
