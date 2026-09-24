import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type WasteShowcaseReport = Tables<'waste_bank_showcase_reports'>;
export type WasteShowcasePhoto = Tables<'waste_bank_showcase_photos'>;
export type WasteShowcaseReportInsert = TablesInsert<'waste_bank_showcase_reports'>;
export type WasteShowcasePhotoUpdate = TablesUpdate<'waste_bank_showcase_photos'>;
export type WasteShowcasePhotoCategory = 'waste_delivery' | 'reward_claim' | 'reward_handover';

export type WasteShowcaseResults = {
  academic_year: string;
  semester: string;
  updated_at: string | null;
  totals: {
    items: number;
    transactions: number;
    students: number;
    points: number;
    approved_claims: number;
    awarded_items: number;
  };
  categories: Array<{ id: string; name: string; icon: string | null; items: number }>;
  monthly: Array<{ month: string; items: number; transactions: number }>;
  top_students: Array<{
    name: string;
    class_name: string | null;
    photo_url: string | null;
    items: number;
    transactions: number;
    points: number;
  }>;
};

export type WasteShowcasePhotoWithUrl = WasteShowcasePhoto & { signed_url: string | null };

const BUCKET = 'waste-bank-showcase';
const SIGNED_URL_SECONDS = 60 * 60;

const parseResults = (value: Json): WasteShowcaseResults => value as unknown as WasteShowcaseResults;

async function withSignedUrls(photos: WasteShowcasePhoto[]): Promise<WasteShowcasePhotoWithUrl[]> {
  if (photos.length === 0) return [];
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(photos.map((photo) => photo.storage_path), SIGNED_URL_SECONDS);
  if (error) throw error;
  return photos.map((photo, index) => ({
    ...photo,
    signed_url: data?.[index]?.signedUrl ?? null,
  }));
}

export const wasteBankShowcaseService = {
  getPublicResults: async (): Promise<WasteShowcaseResults> => {
    const { data, error } = await supabase.rpc('get_waste_bank_public_results');
    if (error) throw error;
    return parseResults(data);
  },

  getReport: async (academicYear: string, semester: string): Promise<WasteShowcaseReport | null> => {
    const { data, error } = await supabase
      .from('waste_bank_showcase_reports')
      .select('*')
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  ensureReport: async (data: WasteShowcaseReportInsert): Promise<WasteShowcaseReport> => {
    const { data: report, error } = await supabase
      .from('waste_bank_showcase_reports')
      .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: 'academic_year,semester' })
      .select()
      .single();
    if (error) throw error;
    return report;
  },

  listPhotos: async (reportId: string): Promise<WasteShowcasePhotoWithUrl[]> => {
    const { data, error } = await supabase
      .from('waste_bank_showcase_photos')
      .select('*')
      .eq('report_id', reportId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return withSignedUrls(data ?? []);
  },

  uploadPhotos: async (params: {
    reportId: string;
    files: File[];
    category: WasteShowcasePhotoCategory;
    caption: string;
    activityDate: string | null;
    createdBy: string | null;
  }): Promise<void> => {
    for (const [index, file] of params.files.entries()) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const storagePath = `${params.reportId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('waste_bank_showcase_photos').insert({
        report_id: params.reportId,
        category: params.category,
        storage_path: storagePath,
        caption: params.caption,
        activity_date: params.activityDate,
        sort_order: Date.now() + index,
        is_published: false,
        created_by: params.createdBy,
      });
      if (insertError) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        throw insertError;
      }
    }
  },

  updatePhoto: async (id: string, data: WasteShowcasePhotoUpdate): Promise<void> => {
    const { data: updated, error } = await supabase
      .from('waste_bank_showcase_photos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (updated?.length !== 1) throw new Error('ไม่สามารถอัปเดตรูปภาพได้ กรุณาตรวจสอบสิทธิ์แอดมิน');
  },

  reorderPhotos: async (photos: WasteShowcasePhoto[]): Promise<void> => {
    const results = await Promise.all(photos.map((photo, index) =>
      supabase
        .from('waste_bank_showcase_photos')
        .update({ sort_order: (index + 1) * 10, updated_at: new Date().toISOString() })
        .eq('id', photo.id)
        .select('id'),
    ));
    const error = results.find((result) => result.error)?.error;
    const updatedCount = results.reduce((count, result) => count + (result.data?.length ?? 0), 0);
    if (error) throw error;
    if (updatedCount !== photos.length) throw new Error('บันทึกลำดับรูปภาพไม่ครบ กรุณาตรวจสอบสิทธิ์แอดมิน');
  },

  deletePhoto: async (photo: WasteShowcasePhoto): Promise<void> => {
    const { data: deleted, error: rowError } = await supabase
      .from('waste_bank_showcase_photos')
      .delete()
      .eq('id', photo.id)
      .select('id');
    if (rowError) throw rowError;
    if (deleted?.length !== 1) throw new Error('ไม่สามารถลบรูปภาพได้ กรุณาตรวจสอบสิทธิ์แอดมิน');
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([photo.storage_path]);
    if (storageError) throw storageError;
  },
};
