import { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, compressionPresets } from '@/utils/imageUtils';

interface FilePreview {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  uploadedUrl?: string;
  error?: string;
}

interface Props {
  bucket: string;
  folder: string;
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  compressionPreset?: 'cover' | 'profile' | 'avatar';
}

const MultiImageUpload = ({ bucket, folder, onUploadComplete, maxFiles = 20, compressionPreset = 'cover' }: Props) => {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList) => {
    const remaining = maxFiles - files.filter(f => f.status !== 'error').length;
    const toAdd = Array.from(newFiles).slice(0, remaining).filter(f => f.type.startsWith('image/'));
    const previews: FilePreview[] = toAdd.map(file => ({
      id: `${Date.now()}_${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
    }));
    setFiles(prev => [...prev, ...previews]);
  }, [files, maxFiles]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const f = prev.find(f => f.id === id);
      if (f) URL.revokeObjectURL(f.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadAll = async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (pending.length === 0) return;
    setIsUploading(true);

    // Upload max 3 concurrently
    const uploadFile = async (fp: FilePreview): Promise<string | null> => {
      setFiles(prev => prev.map(f => f.id === fp.id ? { ...f, status: 'uploading', progress: 10 } : f));
      try {
        const compressed = await compressImage(fp.file, compressionPresets[compressionPreset] ?? compressionPresets.cover);
        setFiles(prev => prev.map(f => f.id === fp.id ? { ...f, progress: 50 } : f));
        const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
        const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        setFiles(prev => prev.map(f => f.id === fp.id ? { ...f, status: 'done', progress: 100, uploadedUrl: publicUrl } : f));
        return publicUrl;
      } catch (err: any) {
        setFiles(prev => prev.map(f => f.id === fp.id ? { ...f, status: 'error', progress: 0, error: err.message } : f));
        return null;
      }
    };

    // Process in batches of 3
    const urls: string[] = [];
    for (let i = 0; i < pending.length; i += 3) {
      const batch = pending.slice(i, i + 3);
      const results = await Promise.all(batch.map(uploadFile));
      urls.push(...results.filter(Boolean) as string[]);
    }

    setIsUploading(false);
    if (urls.length > 0) onUploadComplete(urls);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-secondary/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="font-semibold text-foreground">ลากรูปวางที่นี่ หรือคลิกเลือกรูป</p>
        <p className="text-sm text-muted-foreground mt-1">รองรับ JPG, PNG, GIF, WebP • สูงสุด {maxFiles} รูป</p>
        {files.length > 0 && (
          <p className="text-xs text-primary mt-2 font-medium">{files.length} รูปที่เลือกแล้ว (เหลือได้อีก {maxFiles - files.filter(f=>f.status!=='error').length})</p>
        )}
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map(fp => (
            <div key={fp.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-secondary/30">
              <img src={fp.previewUrl} alt="" className="w-full h-full object-cover" />
              {/* Status overlay */}
              {fp.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1" />
                  <span className="text-white text-xs">{fp.progress}%</span>
                </div>
              )}
              {fp.status === 'done' && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              )}
              {fp.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" title={fp.error} />
                </div>
              )}
              {/* Delete button */}
              {fp.status !== 'uploading' && (
                <button
                  onClick={e => { e.stopPropagation(); removeFile(fp.id); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Bar */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {uploadingCount > 0 && <span className="text-primary">กำลังอัปโหลด {uploadingCount} รูป...</span>}
            {doneCount > 0 && uploadingCount === 0 && <span className="text-green-600">อัปโหลดสำเร็จ {doneCount} รูป</span>}
            {pendingCount > 0 && uploadingCount === 0 && <span>รอดำเนินการ {pendingCount} รูป</span>}
          </div>
          <div className="flex gap-2">
            {!isUploading && (
              <button
                onClick={() => { files.forEach(f => URL.revokeObjectURL(f.previewUrl)); setFiles([]); }}
                className="text-sm text-muted-foreground hover:text-destructive px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                ล้างทั้งหมด
              </button>
            )}
            {pendingCount > 0 && (
              <button
                onClick={uploadAll}
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                อัปโหลดทั้งหมด ({pendingCount} รูป)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
