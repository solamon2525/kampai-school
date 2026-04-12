import { useEffect, useRef } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/react/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';

interface UploadedFile {
    name: string;
    url: string;
    size: number;
    type: string;
}

interface UppyUploadProps {
    bucket?: string;
    folder?: string;
    accept?: string[];
    maxFiles?: number;
    maxFileSizeMB?: number;
    onUploadComplete: (files: UploadedFile[]) => void;
}

export const UppyUpload = ({
    bucket = 'school-documents',
    folder = 'documents',
    accept,
    maxFiles = 10,
    maxFileSizeMB = 50,
    onUploadComplete,
}: UppyUploadProps) => {
    const { toast } = useToast();
    const uppyRef = useRef<Uppy | null>(null);

    if (!uppyRef.current) {
        uppyRef.current = new Uppy({
            restrictions: {
                maxNumberOfFiles: maxFiles,
                allowedFileTypes: accept,
                maxFileSize: maxFileSizeMB * 1024 * 1024,
            },
            autoProceed: false,
        });
    }

    useEffect(() => {
        const uppy = uppyRef.current!;

        const handleUploadAll = async () => {
            const files = uppy.getFiles();
            if (files.length === 0) return;

            const results: UploadedFile[] = [];
            let hasError = false;

            for (const file of files) {
                try {
                    const path = `${folder}/${Date.now()}_${file.name}`;
                    const { data, error } = await supabase.storage
                        .from(bucket)
                        .upload(path, file.data as File, { upsert: true });

                    if (error) throw error;

                    const { data: { publicUrl } } = supabase.storage
                        .from(bucket)
                        .getPublicUrl(data.path);

                    results.push({
                        name: file.name,
                        url: publicUrl,
                        size: file.size || 0,
                        type: file.name.split('.').pop()?.toLowerCase() || '',
                    });
                    uppy.setFileState(file.id, { progress: { uploadComplete: true, uploadStarted: true, percentage: 100 } });
                } catch (err: any) {
                    hasError = true;
                    toast({ title: `อัปโหลด ${file.name} ล้มเหลว`, description: err.message, variant: 'destructive' });
                }
            }

            if (results.length > 0) {
                onUploadComplete(results);
                toast({ title: `อัปโหลดสำเร็จ ${results.length} ไฟล์` });
                uppy.clear();
            }
            if (hasError && results.length === 0) {
                uppy.emit('upload-error', files[0] as any, new Error('Upload failed') as any);
            }
        };

        uppy.on('upload', handleUploadAll);
        return () => { uppy.off('upload', handleUploadAll); };
    }, [bucket, folder, onUploadComplete]);

    return (
        <Dashboard
            uppy={uppyRef.current}
            height={300}
            showProgressDetails
            proudlyDisplayPoweredByUppy={false}
            locale={{
                strings: {
                    dropPasteFiles: 'ลากไฟล์มาวางที่นี่ หรือ %{browseFiles}',
                    browseFiles: 'เลือกไฟล์',
                    uploading: 'กำลังอัปโหลด',
                    complete: 'อัปโหลดสำเร็จ',
                    uploadFailed: 'อัปโหลดล้มเหลว',
                    fileSource: 'แหล่งที่มาของไฟล์',
                    removeFile: 'ลบไฟล์',
                    addMoreFiles: 'เพิ่มไฟล์',
                    uploadXFiles: { 0: 'อัปโหลด %{smart_count} ไฟล์', 1: 'อัปโหลด %{smart_count} ไฟล์' },
                    xFilesSelected: { 0: 'เลือก %{smart_count} ไฟล์', 1: 'เลือก %{smart_count} ไฟล์' },
                },
            }}
        />
    );
};
