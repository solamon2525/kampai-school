import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage, compressionPresets, type CompressOptions } from '@/utils/imageUtils';

interface ImageUploadProps {
    onUploadComplete: (url: string) => void;
    currentImage?: string;
    bucket?: string;
    folder?: string;
    maxSizeMB?: number;
    compressionPreset?: keyof typeof compressionPresets;
}

export const ImageUpload = ({
    onUploadComplete,
    currentImage,
    bucket = 'school-images',
    folder = 'uploads',
    maxSizeMB = 5,
    compressionPreset = 'profile',
}: ImageUploadProps) => {
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Update preview when currentImage changes
    useEffect(() => {
        setPreview(currentImage || null);
    }, [currentImage]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            toast({
                title: 'ไฟล์ใหญ่เกินไป',
                description: `กรุณาเลือกไฟล์ขนาดไม่เกิน ${maxSizeMB}MB`,
                variant: 'destructive',
            });
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'ประเภทไฟล์ไม่ถูกต้อง',
                description: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
                variant: 'destructive',
            });
            return;
        }

        // Upload to Supabase Storage
        setIsUploading(true);
        try {
            // Compress image before upload
            const compressionOptions = compressionPresets[compressionPreset];
            const compressedBlob = await compressImage(file, compressionOptions);

            // Show compressed preview
            const previewUrl = URL.createObjectURL(compressedBlob);
            setPreview(previewUrl);

            const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, compressedBlob, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'image/webp',
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            onUploadComplete(publicUrl);

            toast({
                title: 'อัปโหลดสำเร็จ',
                description: 'รูปภาพถูกบีบอัดและอัปโหลดเรียบร้อยแล้ว',
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                title: 'อัปโหลดล้มเหลว',
                description: error.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ',
                variant: 'destructive',
            });
            setPreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUploadComplete('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isProfile = compressionPreset === 'profile' || compressionPreset === 'avatar';

    return (
        <div className="space-y-4">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {preview ? (
                isProfile ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded-full border-4 border-border shadow-md"
                            />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute -top-1 -right-1 w-6 h-6"
                                onClick={handleRemove}
                                disabled={isUploading}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            เปลี่ยนรูป
                        </Button>
                    </div>
                ) : (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg border-2 border-border"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleRemove}
                            disabled={isUploading}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )
            ) : (
                isProfile ? (
                    <div className="flex flex-col items-center gap-3">
                        <div
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            className="w-32 h-32 border-2 border-dashed border-border rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-secondary/50"
                        >
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 text-muted-foreground mb-1" />
                                    <p className="text-xs text-muted-foreground text-center px-2">คลิกอัปโหลด</p>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">JPG, PNG (สูงสุด {maxSizeMB}MB)</p>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-secondary/50"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                                <p className="text-sm text-muted-foreground">กำลังอัปโหลด...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm font-medium text-foreground">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                <p className="text-xs text-muted-foreground mt-2">JPG, PNG หรือ GIF (สูงสุด {maxSizeMB}MB)</p>
                            </>
                        )}
                    </div>
                )
            )}
        </div>
    );
};
