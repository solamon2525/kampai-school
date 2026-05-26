import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Camera, Plus, Trash2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { classPhotosService, type ClassPhoto } from '@/services/class-photos.service';
import { studentsService } from '@/services/students.service';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'school_images';

export const ClassPhotosManagement = () => {
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState<ClassPhoto | null>(null);
  const [form, setForm] = useState({ title: '', class: '', room: '', taken_at: format(new Date(), 'yyyy-MM-dd'), caption: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: photos = [] } = useQuery({
    queryKey: ['class-photos'],
    queryFn: () => classPhotosService.listByClass(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students-by-class', activePhoto?.class],
    enabled: !!activePhoto,
    queryFn: async () => {
      if (!activePhoto) return [];
      const r = await studentsService.getByClass(activePhoto.class);
      return r.data ?? [];
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['photo-tags', activePhoto?.id],
    enabled: !!activePhoto,
    queryFn: () => classPhotosService.listTags(activePhoto!.id),
  });

  const onUploadClick = async () => {
    if (!fileRef.current?.files?.[0]) {
      toast.error('เลือกไฟล์รูปก่อน');
      return;
    }
    if (!form.class) {
      toast.error('ระบุชั้น');
      return;
    }

    setUploading(true);
    try {
      const file = fileRef.current.files[0];
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `class-photos/${form.class}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

      await classPhotosService.create({
        title: form.title || null,
        class: form.class,
        room: form.room || null,
        photo_url: pub.publicUrl,
        taken_at: form.taken_at || null,
        caption: form.caption || null,
      });
      qc.invalidateQueries({ queryKey: ['class-photos'] });
      setUploadOpen(false);
      setForm({ title: '', class: '', room: '', taken_at: format(new Date(), 'yyyy-MM-dd'), caption: '' });
      if (fileRef.current) fileRef.current.value = '';
      toast.success('อัปโหลดเรียบร้อย');
    } catch (e: any) {
      toast.error(e.message ?? 'อัปโหลดล้มเหลว');
    } finally {
      setUploading(false);
    }
  };

  const remove = useMutation({
    mutationFn: (id: string) => classPhotosService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-photos'] });
      setActivePhoto(null);
      toast.success('ลบแล้ว');
    },
  });

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Camera className="w-7 h-7 text-primary" />
            รูปห้องเรียน + แท็กหน้า
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            อัปโหลดรูปกลุ่ม + คลิกที่ใบหน้าเพื่อแท็กชื่อนักเรียน — parent เห็นแท็กเฉพาะลูกตัวเองเท่านั้น (PDPA)
          </p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              อัปโหลดรูป
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>อัปโหลดรูปห้อง</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>ไฟล์รูป</Label>
                <Input ref={fileRef} type="file" accept="image/*" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>ชั้น</Label><Input placeholder="ป.4" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} /></div>
                <div><Label>ห้อง</Label><Input placeholder="1" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
                <div><Label>วันที่ถ่าย</Label><Input type="date" value={form.taken_at} onChange={(e) => setForm({ ...form, taken_at: e.target.value })} /></div>
                <div><Label>หัวข้อ</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              </div>
              <div><Label>คำอธิบาย</Label><Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadOpen(false)}>ยกเลิก</Button>
              <Button onClick={onUploadClick} disabled={uploading || !form.class}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                อัปโหลด
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!activePhoto ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {!photos.length && (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                ยังไม่มีรูป — อัปโหลดรูปแรก
              </CardContent>
            </Card>
          )}
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePhoto(p)}
              className="rounded-lg overflow-hidden border border-border bg-card hover:border-primary transition group"
            >
              <img src={p.photo_url} alt="" className="w-full aspect-video object-cover" />
              <div className="p-2 text-left">
                <p className="text-xs font-medium truncate">{p.title || `${p.class}${p.room ? `/${p.room}` : ''}`}</p>
                <p className="text-[10px] text-muted-foreground">
                  {p.taken_at && format(new Date(p.taken_at), 'd MMM yyyy', { locale: th })}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <PhotoTagger photo={activePhoto} students={students} tags={tags} onClose={() => setActivePhoto(null)} onDelete={() => remove.mutate(activePhoto.id)} />
      )}
    </div>
  );
};

const PhotoTagger = ({ photo, students, tags, onClose, onDelete }: any) => {
  const qc = useQueryClient();
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);

  const tagStudent = useMutation({
    mutationFn: (studentId: string) =>
      classPhotosService.tagStudent({
        photo_id: photo.id,
        student_id: studentId,
        x_pct: clickPos!.x,
        y_pct: clickPos!.y,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photo-tags', photo.id] });
      setClickPos(null);
      toast.success('แท็กแล้ว');
    },
  });

  const removeTag = useMutation({
    mutationFn: (id: string) => classPhotosService.removeTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photo-tags', photo.id] }),
  });

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickPos({ x, y });
  };

  const taggedIds = new Set(tags.map((t: any) => t.student_id));
  const untagged = students.filter((s: any) => !taggedIds.has(s.id));
  const tagsByStudent = new Map(tags.map((t: any) => [t.student_id, t]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">
            {photo.title || `${photo.class}${photo.room ? `/${photo.room}` : ''}`}
            <span className="ml-2 text-xs text-muted-foreground">{tags.length}/{students.length} แท็ก</span>
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>← กลับ</Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative inline-block w-full">
            <img
              src={photo.photo_url}
              alt=""
              onClick={handleImageClick}
              className="w-full rounded-md cursor-crosshair"
            />
            {tags.map((t: any) => {
              const s = students.find((x: any) => x.id === t.student_id);
              return (
                <div
                  key={t.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: `${t.x_pct}%`, top: `${t.y_pct}%`, width: `${t.radius_pct * 2}%`, paddingBottom: `${t.radius_pct * 2}%` }}
                  onMouseEnter={() => setHoveredTagId(t.id)}
                  onMouseLeave={() => setHoveredTagId(null)}
                >
                  <div className="absolute inset-0 rounded-full border-2 border-amber-400 bg-amber-300/20" />
                  {hoveredTagId === t.id && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {s?.name ?? 'นักเรียน'}
                      <button onClick={(e) => { e.stopPropagation(); removeTag.mutate(t.id); }} className="ml-2">
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {clickPos && (
              <div className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-primary bg-primary/30 animate-pulse"
                style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%` }} />
            )}
          </div>
          {clickPos && (
            <p className="text-xs text-muted-foreground mt-2">
              คลิกที่ภาพแล้ว — เลือกนักเรียนที่จะแท็กจากรายการด้านขวา
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {clickPos ? `เลือกนักเรียนสำหรับแท็กที่ (${clickPos.x.toFixed(0)}%, ${clickPos.y.toFixed(0)}%)` : 'นักเรียนในห้อง'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 max-h-[60vh] overflow-y-auto p-2">
          {(clickPos ? untagged : students).map((s: any) => {
            const tagged = taggedIds.has(s.id);
            return (
              <button
                key={s.id}
                disabled={!clickPos || tagStudent.isPending}
                onClick={() => clickPos && tagStudent.mutate(s.id)}
                className={`w-full text-left p-2 rounded-md flex items-center gap-2 text-sm transition ${
                  clickPos ? 'hover:bg-primary/10 cursor-pointer' : 'opacity-60 cursor-default'
                } ${tagged ? 'bg-amber-50' : 'bg-card'}`}
              >
                <span className="flex-1 truncate">{s.name}</span>
                {tagged && <span className="text-[10px] text-amber-700">✓ แท็กแล้ว</span>}
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
