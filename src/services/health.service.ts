/**
 * health.service.ts
 * Student health profile + growth measurements + vaccinations (Migration 086).
 */
import { supabase } from '@/integrations/supabase/client';

export type HealthRecord = {
  student_id: string;
  blood_type: string | null;
  allergies: string[];
  chronic_conditions: string[];
  medications: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  vision_left: string | null;
  vision_right: string | null;
  dental_status: string | null;
  notes: string | null;
  updated_at: string;
};

export type Vaccination = {
  id: string;
  student_id: string;
  vaccine_name: string;
  dose_number: number | null;
  given_date: string;
  given_by: string | null;
  next_dose_date: string | null;
  notes: string | null;
};

export type GrowthMeasurement = {
  id: string;
  student_id: string;
  measured_at: string;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  notes: string | null;
};

export const healthService = {
  async getRecord(studentId: string): Promise<HealthRecord | null> {
    const { data, error } = await supabase
      .from('student_health_records' as any)
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as HealthRecord | null;
  },

  async upsertRecord(record: Partial<HealthRecord> & { student_id: string }) {
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('student_health_records' as any)
      .upsert(
        { ...record, updated_by: userResp.user?.id, updated_at: new Date().toISOString() },
        { onConflict: 'student_id' },
      );
    if (error) throw error;
  },

  async listVaccinations(studentId: string): Promise<Vaccination[]> {
    const { data, error } = await supabase
      .from('student_vaccinations' as any)
      .select('*')
      .eq('student_id', studentId)
      .order('given_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Vaccination[];
  },

  async addVaccination(v: Omit<Vaccination, 'id'>) {
    const { error } = await supabase.from('student_vaccinations' as any).insert(v);
    if (error) throw error;
  },

  async deleteVaccination(id: string) {
    const { error } = await supabase.from('student_vaccinations' as any).delete().eq('id', id);
    if (error) throw error;
  },

  async listGrowth(studentId: string): Promise<GrowthMeasurement[]> {
    const { data, error } = await supabase
      .from('student_growth_measurements' as any)
      .select('*')
      .eq('student_id', studentId)
      .order('measured_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as GrowthMeasurement[];
  },

  async addGrowth(g: { student_id: string; measured_at: string; weight_kg?: number | null; height_cm?: number | null; notes?: string | null }) {
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('student_growth_measurements' as any)
      .upsert(
        { ...g, recorded_by: userResp.user?.id ?? null },
        { onConflict: 'student_id,measured_at' },
      );
    if (error) throw error;
  },

  async deleteGrowth(id: string) {
    const { error } = await supabase.from('student_growth_measurements' as any).delete().eq('id', id);
    if (error) throw error;
  },

  /** All students + their latest growth measurement (admin bulk view) */
  async listAllLatestGrowth() {
    const { data, error } = await supabase
      .from('student_latest_growth' as any)
      .select('*');
    if (error) throw error;
    return data ?? [];
  },
};
