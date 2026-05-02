import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '../shared/ImageUpload';
import { RichTextEditor } from '../shared/RichTextEditor';
import type { NewsItem } from './NewsManagement';

interface NewsFormProps {
    news?: NewsItem | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export const NewsForm = ({ news, onSuccess, onCancel }: NewsFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [sendEmail, setSendEmail] = useState(false);
    const [tickerCount, setTickerCount] = useState(0);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        title: news?.title || '',
        excerpt: news?.excerpt || '',
        content: news?.content || '',
        category: news?.category || '',
        cover_image_url: news?.cover_image_url || '',
        published: news?.published || false,
        is_pinned: news?.is_pinned || false,
        show_in_ticker: news?.show_in_ticker || false,
        ticker_order: news?.ticker_order ?? null as number | null,
        external_links: news?.external_links || [] as { title: string; url: string }[],
    });

    useEffect(() => {
        fetchCategories();
        fetchTickerCount();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('news_categories' as any)
                .select('name')
                .order('name');

            if (error) throw error;
            setCategories(data?.map((c) => c.name) || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchTickerCount = async () => {
        const { count } = await supabase
            .from('news')
            .select('id', { count: 'exact', head: true })
            .eq('show_in_ticker', true)
            .eq('published', true);
        setTickerCount(count ?? 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Auto-assign ticker_order ตอน admin เพิ่งติ๊ก show_in_ticker (append ท้าย)
            const tickerOrderToSave =
                formData.show_in_ticker && formData.ticker_order == null
                    ? tickerCount
                    : formData.show_in_ticker
                        ? formData.ticker_order
                        : null;

            const dataToSave = {
                ...formData,
                ticker_order: tickerOrderToSave,
                published_at: formData.published ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            };

            if (news) {
                // Update existing news
                const { error } = await supabase
                    .from('news')
                    .update(dataToSave)
                    .eq('id', news.id);

                if (error) throw error;

                toast({
                    title: 'บันทึกสำเร็จ',
                    description: 'แก้ไขข่าวสารเรียบร้อยแล้ว',
                });
            } else {
                // Create new news
                const { error } = await supabase.from('news').insert({
                    ...dataToSave,
                    sort_order: 0,
                    views: 0,
                });

                if (error) throw error;

                toast({
                    title: 'สร้างสำเร็จ',
                    description: 'เพิ่มข่าวสารใหม่เรียบร้อยแล้ว',
                });
            }

            // Send email notification if checked and published
            if (sendEmail && formData.published) {
                try {
                    await supabase.functions.invoke('send-notification', {
                        body: {
                            newsTitle: formData.title,
                            subject: `ข่าวสารใหม่: ${formData.title}`,
                            html: `<h2>${formData.title}</h2><p>${formData.excerpt || ''}</p>`,
                        },
                    });
                } catch (emailErr) {
                    console.warn('Email notification failed:', emailErr);
                }
            }

            onSuccess();
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">
                                {news ? 'แก้ไขข่าวสาร' : 'เพิ่มข่าวสารใหม่'}
                            </CardTitle>
                            <CardDescription>
                                กรอกข้อมูลข่าวสารให้ครบถ้วน
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={onCancel}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            ย้อนกลับ
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                หัวข้อข่าว <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="ระบุหัวข่าว"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">
                                หมวดหมู่ <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                                required
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="เลือกหมวดหมู่" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-2">
                            <Label htmlFor="excerpt">
                                คำโปรย <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="excerpt"
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                placeholder="สรุปข่าวสาร 1-2 บรรทัด"
                                rows={3}
                                required
                            />
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            <Label>
                                เนื้อหา <span className="text-destructive">*</span>
                            </Label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(value) => setFormData({ ...formData, content: value })}
                                placeholder="เขียนเนื้อหาข่าวสาร..."
                            />
                        </div>

                        {/* Cover Image */}
                        <div className="space-y-2">
                            <Label>รูปปก</Label>
                            <ImageUpload
                                currentImage={formData.cover_image_url}
                                onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url })}
                                bucket="images"
                                folder="news"
                                compressionPreset="cover"
                            />
                        </div>

                        {/* External Links */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>ลิ้งค์ภายนอก (ถ้ามี)</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFormData({
                                        ...formData,
                                        external_links: [...(formData.external_links || []), { title: '', url: '' }]
                                    })}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    เพิ่มลิ้งค์
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {formData.external_links?.map((link, index) => (
                                    <div key={index} className="flex gap-3 items-start p-3 bg-secondary/30 rounded-lg border">
                                        <div className="flex-1 space-y-3">
                                            <div className="grid gap-2">
                                                <Label className="text-xs text-muted-foreground">ชื่อลิ้งค์ / ปุ่ม</Label>
                                                <Input
                                                    value={link.title}
                                                    onChange={(e) => {
                                                        const newLinks = [...(formData.external_links || [])];
                                                        newLinks[index].title = e.target.value;
                                                        setFormData({ ...formData, external_links: newLinks });
                                                    }}
                                                    placeholder="เช่น สมัครลงทะเบียนคลิกที่นี่"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs text-muted-foreground">URL (ต้องขึ้นต้นด้วย http:// หรือ https://)</Label>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        value={link.url}
                                                        onChange={(e) => {
                                                            const newLinks = [...(formData.external_links || [])];
                                                            newLinks[index].url = e.target.value;
                                                            setFormData({ ...formData, external_links: newLinks });
                                                        }}
                                                        placeholder="https://example.com"
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-6"
                                            onClick={() => {
                                                const newLinks = formData.external_links.filter((_, i) => i !== index);
                                                setFormData({ ...formData, external_links: newLinks });
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {(!formData.external_links || formData.external_links.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                                        ยังไม่มีลิ้งค์ภายนอก
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Options */}
                        <div className="flex flex-col gap-4 p-4 bg-secondary rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>เผยแพร่ทันที</Label>
                                    <p className="text-sm text-muted-foreground">
                                        ข่าวสารจะแสดงบนหน้าเว็บทันที
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.published}
                                    onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>ปักหมุด</Label>
                                    <p className="text-sm text-muted-foreground">
                                        แสดงข่าวนี้เป็นพิเศษด้านบนสุด
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_pinned}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>แสดงในตัววิ่งข่าว</Label>
                                    <p className="text-sm text-muted-foreground">
                                        เลือกได้สูงสุด 5 ข่าว — ใช้แล้ว {tickerCount}/5
                                        {!formData.show_in_ticker && tickerCount >= 5 && (
                                            <span className="text-destructive"> (ครบจำนวนแล้ว)</span>
                                        )}
                                        {formData.show_in_ticker && (
                                            <span className="text-green-600"> ✓ ข่าวนี้กำลังวิ่ง — คลิก Switch เพื่อยกเลิก</span>
                                        )}
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.show_in_ticker}
                                    disabled={!formData.show_in_ticker && tickerCount >= 5}
                                    onCheckedChange={(checked) => setFormData({ ...formData, show_in_ticker: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>ส่ง Email แจ้งเตือน</Label>
                                    <p className="text-sm text-muted-foreground">
                                        ส่งอีเมลแจ้งผู้ติดตามเมื่อเผยแพร่
                                    </p>
                                </div>
                                <Switch
                                    checked={sendEmail}
                                    onCheckedChange={setSendEmail}
                                />
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4 border-t">
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                <Save className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'กำลังบันทึก...' : news ? 'บันทึกการแก้ไข' : 'สร้างข่าวสาร'}
                            </Button>
                            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                                <X className="w-4 h-4 mr-2" />
                                ยกเลิก
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
