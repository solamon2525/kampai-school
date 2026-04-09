import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { deleteStorageImage } from '@/utils/storageUtils';
import MultiImageUpload from '@/components/admin/shared/MultiImageUpload';
import type { Album } from './GalleryManagement';

interface Photo {
    id: string;
    image_url: string;
    caption: string | null;
    sort_order: number;
}

interface PhotoManagerProps {
    album: Album;
    onBack: () => void;
}

export const PhotoManager = ({ album, onBack }: PhotoManagerProps) => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchPhotos();
    }, [album.id]);

    const fetchPhotos = async () => {
        try {
            const { data, error } = await supabase
                .from('gallery_photos')
                .select('*')
                .eq('album_id', album.id)
                .order('sort_order');

            if (error) throw error;
            setPhotos(data || []);
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkUpload = async (urls: string[]) => {
        const inserts = urls.map((url, i) => ({
            album_id: album.id,
            image_url: url,
            caption: '',
            sort_order: photos.length + i,
        }));
        const { error } = await supabase.from('gallery_photos').insert(inserts);
        if (!error) fetchPhotos();
        else {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (photo: Photo) => {
        try {
            // Delete from database
            const { error: dbError } = await supabase
                .from('gallery_photos')
                .delete()
                .eq('id', photo.id);

            if (dbError) throw dbError;

            // Delete from storage
            await deleteStorageImage(photo.image_url);

            toast({
                title: 'ลบสำเร็จ',
                description: 'ลบรูปภาพเรียบร้อยแล้ว',
            });

            fetchPhotos();
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleUpdateCaption = async (photoId: string, caption: string) => {
        try {
            const { error } = await supabase
                .from('gallery_photos')
                .update({ caption })
                .eq('id', photoId);

            if (error) throw error;

            setPhotos(photos.map(p => p.id === photoId ? { ...p, caption } : p));
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">จัดการรูปภาพ</CardTitle>
                            <CardDescription>อัลบั้ม: {album.title}</CardDescription>
                        </div>
                        <Button variant="outline" onClick={onBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            ย้อนกลับ
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Multi-image upload */}
                    <MultiImageUpload
                        bucket="images"
                        folder={`gallery/${album.id}`}
                        onUploadComplete={handleBulkUpload}
                    />

                    {/* Photo grid */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">กำลังโหลด...</p>
                        </div>
                    ) : photos.length === 0 ? (
                        <div className="text-center py-8">
                            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">ยังไม่มีรูปภาพในอัลบั้มนี้ อัปโหลดรูปแรกด้านบนได้เลย</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="group relative bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all"
                                >
                                    <div className="aspect-square overflow-hidden">
                                        <img
                                            src={photo.image_url}
                                            alt={photo.caption || ''}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>

                                    <div className="p-2">
                                        <Input
                                            value={photo.caption || ''}
                                            onChange={(e) => setPhotos(photos.map(p =>
                                                p.id === photo.id ? { ...p, caption: e.target.value } : p
                                            ))}
                                            onBlur={(e) => handleUpdateCaption(photo.id, e.target.value)}
                                            placeholder="คำบรรยาย..."
                                            className="text-sm"
                                        />
                                    </div>

                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setDeleteId(photo.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {photos.length > 0 && (
                        <div className="text-sm text-muted-foreground text-center">
                            รูปภาพทั้งหมด: {photos.length} รูป
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                onConfirm={() => {
                    const photo = photos.find(p => p.id === deleteId);
                    if (photo) {
                        handleDelete(photo);
                    }
                    setDeleteId(null);
                }}
                title="ยืนยันการลบรูปภาพ"
                description="คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />
        </div>
    );
};
