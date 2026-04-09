import { useState } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '../shared/ImageUpload';
import type { Album } from './GalleryManagement';

interface AlbumFormProps {
    album?: Album | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export const AlbumForm = ({ album, onSuccess, onCancel }: AlbumFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: album?.name || '',
        description: album?.description || '',
        category: album?.category || '',
        cover_image_url: album?.cover_image_url || '',
        is_published: album?.is_published ?? true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const dataToSave = {
                ...formData,
                updated_at: new Date().toISOString(),
            };

            if (album) {
                // Update existing album
                const { error } = await supabase
                    .from('gallery_albums')
                    .update(dataToSave)
                    .eq('id', album.id);

                if (error) throw error;

                toast({
                    title: 'บันทึกสำเร็จ',
                    description: 'แก้ไขอัลบั้มเรียบร้อยแล้ว',
                });
            } else {
                // Create new album
                const { error } = await supabase.from('gallery_albums').insert({
                    ...dataToSave,
                });

                if (error) throw error;

                toast({
                    title: 'สร้างสำเร็จ',
                    description: 'เพิ่มอัลบั้มใหม่เรียบร้อยแล้ว',
                });
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
                                {album ? 'แก้ไขอัลบั้ม' : 'สร้างอัลบั้มใหม่'}
                            </CardTitle>
                            <CardDescription>กรอกข้อมูลอัลบั้มให้ครบถ้วน</CardDescription>
                        </div>
                        <Button variant="outline" onClick={onCancel}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            ย้อนกลับ
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                ชื่ออัลบั้ม <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="ระบุชื่ออัลบั้ม"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">คำอธิบาย</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="คำอธิบายอัลบั้ม"
                                rows={3}
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">หมวดหมู่</Label>
                            <Input
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="เช่น กีฬาสี, วันสำคัญ, ศึกษาดูงาน"
                            />
                        </div>

                        {/* Cover Photo */}
                        <div className="space-y-2">
                            <Label>รูปปก</Label>
                            <ImageUpload
                                currentImage={formData.cover_image_url}
                                onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url })}
                                bucket="images"
                                folder="gallery/covers"
                                compressionPreset="cover"
                            />
                        </div>

                        {/* Publish Switch */}
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                            <div className="space-y-0.5">
                                <Label>เผยแพร่อัลบั้ม</Label>
                                <p className="text-sm text-muted-foreground">
                                    อัลบั้มจะแสดงบนหน้าเว็บทันที
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_published}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4 border-t">
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                <Save className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'กำลังบันทึก...' : album ? 'บันทึกการแก้ไข' : 'สร้างอัลบัม'}
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
