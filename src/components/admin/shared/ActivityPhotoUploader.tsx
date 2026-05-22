import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage, compressionPresets } from '@/utils/imageUtils';

interface ActivityPhotoUploaderProps {
    onPhotosChange: (urls: string[]) => void;
    currentPhotos?: string[];
    bucket?: string;
    folder?: string;
    maxPhotos?: number;
    maxSizeMB?: number;
}

export const ActivityPhotoUploader = ({
    onPhotosChange,
    currentPhotos = [],
    bucket = 'school-images',
    folder = 'training-photos',
    maxPhotos = 6,
    maxSizeMB = 5,
}: ActivityPhotoUploaderProps) => {
    const [photos, setPhotos] = useState<string[]>(currentPhotos);
    const [uploadingIndices, setUploadingIndices] = useState<number[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            uploadFiles(files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length > 0) {
            uploadFiles(files);
        }
    };

    const uploadFiles = async (files: File[]) => {
        const validImages = files.filter(f => f.type.startsWith('image/'));
        if (validImages.length === 0) {
            toast({
                title: 'ไฟล์ไม่ถูกต้อง',
                description: 'กรุณาเลือกเฉพาะไฟล์รูปภาพเท่านั้น',
                variant: 'destructive',
            });
            return;
        }

        const remainingSlots = maxPhotos - photos.length;
        if (validImages.length > remainingSlots) {
            toast({
                title: 'เกินจำนวนรูปภาพสูงสุด',
                description: `คุณสามารถอัปโหลดรูปภาพได้อีกไม่เกิน ${remainingSlots} รูป (สูงสุด ${maxPhotos} รูป)`,
                variant: 'destructive',
            });
            return;
        }

        // Start uploads
        const startIdx = photos.length;
        const newUploadingIndices = Array.from({ length: validImages.length }, (_, i) => startIdx + i);
        setUploadingIndices(prev => [...prev, ...newUploadingIndices]);

        const uploadedUrls: string[] = [];

        for (let i = 0; i < validImages.length; i++) {
            const file = validImages[i];
            const currentSlotIndex = startIdx + i;

            try {
                // Compress image to gallery preset
                const compressedBlob = await compressImage(file, compressionPresets.gallery);

                const compressedMB = compressedBlob.size / (1024 * 1024);
                if (compressedMB > maxSizeMB) {
                    toast({
                        title: 'รูปขนาดใหญ่เกินไป',
                        description: `รูป ${file.name} บีบอัดแล้วมีขนาดเกิน ${maxSizeMB} MB`,
                        variant: 'destructive',
                    });
                    continue;
                }

                const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

                const { data, error } = await supabase.storage
                    .from(bucket)
                    .upload(fileName, compressedBlob, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: 'image/webp',
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(data.path);

                uploadedUrls.push(publicUrl);
            } catch (err: any) {
                console.error('Photo upload error:', err);
                toast({
                    title: 'อัปโหลดล้มเหลว',
                    description: `ไม่สามารถอัปโหลดรูป ${file.name} ได้`,
                    variant: 'destructive',
                });
            } finally {
                setUploadingIndices(prev => prev.filter(idx => idx !== currentSlotIndex));
            }
        }

        if (uploadedUrls.length > 0) {
            const updatedPhotos = [...photos, ...uploadedUrls];
            setPhotos(updatedPhotos);
            onPhotosChange(updatedPhotos);
            toast({
                title: 'อัปโหลดรูปภาพสำเร็จ',
                description: `อัปโหลดรูปภาพกิจกรรมเพิ่ม ${uploadedUrls.length} รูปเรียบร้อยแล้ว`,
            });
        }
    };

    const handleRemove = (indexToRemove: number) => {
        const updatedPhotos = photos.filter((_, idx) => idx !== indexToRemove);
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos);
        toast({
            title: 'ลบรูปภาพเรียบร้อย',
        });
    };

    return (
        <div className="space-y-4">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={photos.length >= maxPhotos}
            />

            {/* Grid display */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((url, idx) => (
                    <div key={url} className="relative group overflow-hidden rounded-xl border border-border aspect-square bg-muted shadow-sm">
                        <img
                            src={url}
                            alt={`Activity photo ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="w-8 h-8 rounded-full shadow-md scale-90 group-hover:scale-100 transition-transform"
                                onClick={() => handleRemove(idx)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {/* Show simulated uploading items */}
                {uploadingIndices.map(idx => (
                    <div key={idx} className="border border-dashed border-primary/45 rounded-xl aspect-square flex flex-col items-center justify-center bg-primary/5 animate-pulse">
                        <Loader2 className="h-6 w-6 text-primary animate-spin mb-1" />
                        <span className="text-[10px] text-muted-foreground">กำลังอัปโหลด...</span>
                    </div>
                ))}

                {/* Upload Trigger (only if slots are available) */}
                {photos.length + uploadingIndices.length < maxPhotos && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                            isDragging
                                ? 'border-primary bg-primary/5 scale-[0.98]'
                                : 'border-border hover:border-primary hover:bg-secondary/40'
                        }`}
                    >
                        <Upload className="h-6 w-6 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                        <span className="text-[11px] font-medium text-foreground">อัปโหลดรูปภาพ</span>
                        <span className="text-[9px] text-muted-foreground mt-0.5">({photos.length}/{maxPhotos} รูป)</span>
                    </div>
                )}
            </div>

            {photos.length === 0 && uploadingIndices.length === 0 && (
                <div className="text-center py-6 border rounded-xl border-dashed border-border bg-secondary/20 flex flex-col items-center gap-1.5">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-xs text-muted-foreground">ยังไม่มีรูปภาพบรรยากาศการอบรม/ประชุม</p>
                    <p className="text-[10px] text-muted-foreground/75">ลากรูปภาพมาวางหรือคลิกเพื่อเริ่มอัปโหลด (สูงสุด {maxPhotos} รูป)</p>
                </div>
            )}
        </div>
    );
};
