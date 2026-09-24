import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, ImagePlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { WasteBankResultsQr } from '@/components/waste-bank/WasteBankResultsQr';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { formatThaiDateFull } from '@/lib/thaiDate';
import {
  wasteBankShowcaseService,
  type WasteShowcasePhotoCategory,
  type WasteShowcasePhotoWithUrl,
} from '@/services';

const reportSchema = z.object({
  title: z.string().trim().min(3, 'กรุณาระบุหัวเรื่อง').max(160),
  introduction: z.string().trim().min(10, 'กรุณาระบุบทนำอย่างน้อย 10 ตัวอักษร').max(800),
  goal_text: z.string().trim().min(3, 'กรุณาระบุเป้าหมาย').max(500),
  highlight_text: z.string().trim().min(3, 'กรุณาระบุข้อความไฮไลต์').max(500),
});

const photoSchema = z.object({
  category: z.enum(['waste_delivery', 'reward_claim', 'reward_handover']),
  caption: z.string().trim().max(300),
  activity_date: z.string(),
});

type ReportForm = z.infer<typeof reportSchema>;
type PhotoForm = z.infer<typeof photoSchema>;

const DEFAULT_REPORT: ReportForm = {
  title: 'ผลการดำเนินงานธนาคารขยะ',
  introduction: 'ร่วมกันคัดแยกขยะ เปลี่ยนวัสดุรีไซเคิลเป็นแต้ม และสร้างนิสัยรับผิดชอบต่อสิ่งแวดล้อม',
  goal_text: 'ปลูกฝังการคัดแยกขยะและการใช้ทรัพยากรอย่างรู้คุณค่า',
  highlight_text: 'ทุกชิ้นที่นำมาฝาก คือการลงมือสร้างโรงเรียนสีเขียวร่วมกัน',
};

const PHOTO_LABELS: Record<WasteShowcasePhotoCategory, string> = {
  waste_delivery: 'ส่งขยะเข้าธนาคาร',
  reward_claim: 'เคลมรางวัล',
  reward_handover: 'มอบรางวัล',
};

export function WasteBankShowcaseManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [editingPhoto, setEditingPhoto] = useState<WasteShowcasePhotoWithUrl | null>(null);

  const reportForm = useForm<ReportForm>({ resolver: zodResolver(reportSchema), defaultValues: DEFAULT_REPORT });
  const uploadForm = useForm<PhotoForm>({ resolver: zodResolver(photoSchema), defaultValues: { category: 'waste_delivery', caption: '', activity_date: '' } });
  const editForm = useForm<PhotoForm>({ resolver: zodResolver(photoSchema), defaultValues: { category: 'waste_delivery', caption: '', activity_date: '' } });

  const resultsQuery = useQuery({
    queryKey: ['waste-bank-showcase', 'public-results'],
    queryFn: wasteBankShowcaseService.getPublicResults,
  });
  const period = resultsQuery.data;
  const reportQuery = useQuery({
    queryKey: ['waste-bank-showcase', 'report', period?.academic_year, period?.semester],
    queryFn: () => wasteBankShowcaseService.getReport(period!.academic_year, period!.semester),
    enabled: !!period,
  });
  const photosQuery = useQuery({
    queryKey: ['waste-bank-showcase', 'photos', reportQuery.data?.id],
    queryFn: () => wasteBankShowcaseService.listPhotos(reportQuery.data!.id),
    enabled: !!reportQuery.data,
  });
  const photos = photosQuery.data ?? [];

  useEffect(() => {
    if (reportQuery.data) reportForm.reset(reportQuery.data);
  }, [reportForm, reportQuery.data]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['waste-bank-showcase'] });
  };

  const saveReport = useMutation({
    mutationFn: async (values: ReportForm) => {
      if (!period) throw new Error('ไม่พบปีการศึกษาและภาคเรียนปัจจุบัน');
      return wasteBankShowcaseService.ensureReport({
        ...values,
        academic_year: period.academic_year,
        semester: period.semester,
        updated_by: user?.id ?? null,
      });
    },
    onSuccess: async () => { await invalidate(); toast({ title: 'บันทึกข้อความนำเสนอแล้ว' }); },
    onError: (error: Error) => toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' }),
  });

  const uploadPhotos = useMutation({
    mutationFn: async (values: PhotoForm) => {
      if (files.length === 0) throw new Error('กรุณาเลือกรูปอย่างน้อย 1 รูป');
      if (files.some((file) => file.size > 10 * 1024 * 1024)) throw new Error('แต่ละรูปต้องมีขนาดไม่เกิน 10 MB');
      let report = reportQuery.data;
      if (!report) {
        if (!period) throw new Error('ไม่พบปีการศึกษาและภาคเรียนปัจจุบัน');
        report = await wasteBankShowcaseService.ensureReport({ ...DEFAULT_REPORT, academic_year: period.academic_year, semester: period.semester, updated_by: user?.id ?? null });
      }
      await wasteBankShowcaseService.uploadPhotos({
        reportId: report.id,
        files,
        category: values.category,
        caption: values.caption,
        activityDate: values.activity_date || null,
        createdBy: user?.id ?? null,
      });
    },
    onSuccess: async () => {
      setFiles([]);
      uploadForm.reset({ category: 'waste_delivery', caption: '', activity_date: '' });
      await invalidate();
      toast({ title: 'อัปโหลดรูปเป็นฉบับร่างแล้ว', description: 'ตรวจสอบรูปและกดเผยแพร่เมื่อพร้อม' });
    },
    onError: (error: Error) => toast({ title: 'อัปโหลดไม่สำเร็จ', description: error.message, variant: 'destructive' }),
  });

  const updatePhoto = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof wasteBankShowcaseService.updatePhoto>[1] }) => wasteBankShowcaseService.updatePhoto(id, data),
    onSuccess: async () => { await invalidate(); toast({ title: 'อัปเดตรูปภาพแล้ว' }); },
    onError: (error: Error) => toast({ title: 'อัปเดตไม่สำเร็จ', description: error.message, variant: 'destructive' }),
  });

  const openEdit = (photo: WasteShowcasePhotoWithUrl) => {
    setEditingPhoto(photo);
    editForm.reset({ category: photo.category as WasteShowcasePhotoCategory, caption: photo.caption, activity_date: photo.activity_date ?? '' });
  };

  const movePhoto = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await wasteBankShowcaseService.reorderPhotos(next);
      await invalidate();
    } catch (error) {
      toast({ title: 'จัดลำดับไม่สำเร็จ', description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const deletePhoto = async (photo: WasteShowcasePhotoWithUrl) => {
    if (!window.confirm('ลบรูปนี้ออกจากแกลเลอรี่หรือไม่?')) return;
    try {
      await wasteBankShowcaseService.deletePhoto(photo);
      await invalidate();
      toast({ title: 'ลบรูปแล้ว' });
    } catch (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  if (resultsQuery.isLoading) return <p className="py-10 text-center text-muted-foreground">กำลังโหลดข้อมูลผลการดำเนินงาน...</p>;
  if (!period) return <p className="py-10 text-center text-destructive">ไม่พบข้อมูลปีการศึกษาและภาคเรียนปัจจุบัน</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold text-foreground">ผลการดำเนินงานสาธารณะ</h2><p className="text-sm text-muted-foreground">ปีการศึกษา {period.academic_year} · ภาคเรียนที่ {period.semester}</p></div>
        <Button asChild variant="outline"><Link to="/waste-bank/results" target="_blank"><ExternalLink className="mr-2 h-4 w-4" />เปิดหน้าสาธารณะ</Link></Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card><CardHeader><CardTitle className="text-base">ข้อความนำเสนอ</CardTitle></CardHeader><CardContent>
          <Form {...reportForm}><form onSubmit={reportForm.handleSubmit((values) => saveReport.mutate(values))} className="space-y-4">
            <FormField control={reportForm.control} name="title" render={({ field }) => <FormItem><FormLabel>หัวเรื่อง</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={reportForm.control} name="introduction" render={({ field }) => <FormItem><FormLabel>บทนำ</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={reportForm.control} name="goal_text" render={({ field }) => <FormItem><FormLabel>เป้าหมายโครงการ</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={reportForm.control} name="highlight_text" render={({ field }) => <FormItem><FormLabel>ข้อความไฮไลต์</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>} />
            </div>
            <Button type="submit" disabled={saveReport.isPending}>{saveReport.isPending ? 'กำลังบันทึก...' : 'บันทึกข้อความ'}</Button>
          </form></Form>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">QR Code</CardTitle></CardHeader><CardContent><WasteBankResultsQr compact /></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">เพิ่มภาพกิจกรรม</CardTitle></CardHeader><CardContent>
        <Form {...uploadForm}><form onSubmit={uploadForm.handleSubmit((values) => uploadPhotos.mutate(values))} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <FormField control={uploadForm.control} name="category" render={({ field }) => <FormItem><FormLabel>หมวดภาพ</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(PHOTO_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={uploadForm.control} name="activity_date" render={({ field }) => <FormItem><FormLabel>วันที่กิจกรรม</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormItem><FormLabel>รูปภาพจริง (สูงสุด 10 MB/รูป)</FormLabel><FormControl><Input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></FormControl></FormItem>
          </div>
          <FormField control={uploadForm.control} name="caption" render={({ field }) => <FormItem><FormLabel>คำบรรยายร่วม</FormLabel><FormControl><Input placeholder="เช่น นักเรียนชั้น ป.4 นำขวดพลาสติกมาฝาก" {...field} /></FormControl><FormMessage /></FormItem>} />
          <p className="text-xs text-muted-foreground">รูปใหม่จะเป็นฉบับร่างและยังไม่แสดงต่อสาธารณะ จนกว่าแอดมินจะกดเผยแพร่</p>
          <Button type="submit" disabled={uploadPhotos.isPending}><ImagePlus className="mr-2 h-4 w-4" />{uploadPhotos.isPending ? 'กำลังอัปโหลด...' : `อัปโหลด${files.length ? ` ${files.length} รูป` : ''}`}</Button>
        </form></Form>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">จัดการแกลเลอรี่ ({photos.length} รูป)</CardTitle></CardHeader><CardContent>
        {photos.length === 0 ? <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">ยังไม่มีภาพกิจกรรม</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => <div key={photo.id} className="overflow-hidden rounded-xl border border-border bg-card">
            {photo.signed_url ? <img src={photo.signed_url} alt={photo.caption || PHOTO_LABELS[photo.category as WasteShowcasePhotoCategory]} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-muted text-sm text-muted-foreground">โหลดภาพไม่ได้</div>}
            <div className="space-y-2 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-primary">{PHOTO_LABELS[photo.category as WasteShowcasePhotoCategory]}</span><span className={photo.is_published ? 'text-xs text-primary' : 'text-xs text-muted-foreground'}>{photo.is_published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</span></div>
              <p className="line-clamp-2 min-h-10 text-sm text-foreground">{photo.caption || 'ไม่มีคำบรรยาย'}</p>{photo.activity_date && <p className="text-xs text-muted-foreground">{formatThaiDateFull(photo.activity_date)}</p>}
              <div className="flex flex-wrap gap-1"><Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={index === 0} onClick={() => void movePhoto(index, -1)} aria-label="เลื่อนรูปขึ้น"><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={index === photos.length - 1} onClick={() => void movePhoto(index, 1)} aria-label="เลื่อนรูปลง"><ArrowDown className="h-4 w-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => openEdit(photo)}><Pencil className="mr-1 h-3.5 w-3.5" />แก้ไข</Button>
                <Button type="button" size="sm" variant={photo.is_published ? 'outline' : 'default'} onClick={() => updatePhoto.mutate({ id: photo.id, data: { is_published: !photo.is_published } })}>{photo.is_published ? <EyeOff className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}{photo.is_published ? 'เก็บเป็นร่าง' : 'เผยแพร่'}</Button>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => void deletePhoto(photo)} aria-label="ลบรูป"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>)}
        </div>}
      </CardContent></Card>

      <Dialog open={!!editingPhoto} onOpenChange={(open) => !open && setEditingPhoto(null)}><DialogContent><DialogHeader><DialogTitle>แก้ไขข้อมูลรูปภาพ</DialogTitle></DialogHeader>
        <Form {...editForm}><form onSubmit={editForm.handleSubmit(async (values) => { if (!editingPhoto) return; await updatePhoto.mutateAsync({ id: editingPhoto.id, data: { category: values.category, caption: values.caption, activity_date: values.activity_date || null } }); setEditingPhoto(null); })} className="space-y-4">
          <FormField control={editForm.control} name="category" render={({ field }) => <FormItem><FormLabel>หมวดภาพ</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(PHOTO_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
          <FormField control={editForm.control} name="activity_date" render={({ field }) => <FormItem><FormLabel>วันที่กิจกรรม</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={editForm.control} name="caption" render={({ field }) => <FormItem><FormLabel>คำบรรยาย</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>} />
          <DialogFooter><Button type="button" variant="outline" onClick={() => setEditingPhoto(null)}>ยกเลิก</Button><Button type="submit" disabled={updatePhoto.isPending}>บันทึก</Button></DialogFooter>
        </form></Form>
      </DialogContent></Dialog>
    </div>
  );
}
