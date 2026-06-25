import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadProps {
    onUploadComplete: (url: string) => void;
    currentVideo?: string;
    bucket?: string;
    folder?: string;
    maxSizeMB?: number;
}

/**
 * อัปคลิปวิดีโอสั้น (เดโมเกม) — มิเรอร์ ImageUpload แต่ไม่บีบอัด (คลิปเตรียมสั้น/มิวต์มาแล้ว).
 * accept video/mp4,video/webm · เก็บไฟล์ดิบใน bucket แล้วคืน public URL.
 */
export const VideoUpload = ({
    onUploadComplete,
    currentVideo,
    bucket = 'educational-hub',
    folder = 'previews',
    maxSizeMB = 15,
}: VideoUploadProps) => {
    const [preview, setPreview] = useState<string | null>(currentVideo || null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        setPreview(currentVideo || null);
    }, [currentVideo]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast({ title: 'ประเภทไฟล์ไม่ถูกต้อง', description: 'กรุณาเลือกไฟล์วิดีโอ (mp4/webm) เท่านั้น', variant: 'destructive' });
            return;
        }
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            toast({
                title: 'คลิปใหญ่เกินไป',
                description: `ไฟล์ ${sizeMB.toFixed(1)} MB เกิน ${maxSizeMB} MB — ใช้คลิปสั้น (~5-10 วิ) มิวต์ ความละเอียดต่ำ`,
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);
        try {
            const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : file.type.includes('webm') ? 'webm' : 'mp4';
            const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
            setPreview(publicUrl);
            onUploadComplete(publicUrl);
            toast({ title: 'อัปโหลดสำเร็จ', description: 'คลิปเดโมถูกอัปโหลดเรียบร้อยแล้ว' });
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลด';
            console.error('Video upload error:', error);
            toast({ title: 'อัปโหลดล้มเหลว', description: msg, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUploadComplete('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-3">
            <input ref={fileInputRef} type="file" accept="video/mp4,video/webm" onChange={handleFileSelect} className="hidden" />

            {preview ? (
                <div className="relative">
                    <video
                        src={preview}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="w-full aspect-video object-cover rounded-lg border-2 border-border bg-black"
                    />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemove}
                        disabled={isUploading}
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors border-border hover:border-primary bg-secondary/50"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                            <p className="text-sm text-muted-foreground">กำลังอัปโหลด...</p>
                        </>
                    ) : (
                        <>
                            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-sm font-medium text-foreground">คลิกอัปคลิปเดโม</p>
                            <p className="text-xs text-muted-foreground mt-1">mp4 หรือ webm · สั้น ~5-10 วิ มิวต์ (สูงสุด {maxSizeMB}MB)</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
