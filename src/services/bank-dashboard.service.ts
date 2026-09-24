import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { readBankPages } from '@/lib/bank-pagination';
export { readBankPages } from '@/lib/bank-pagination';

export type BankKind = 'savings' | 'waste';
export type BankAudience = 'admin' | 'parent' | 'public';
export type BankStudent = Pick<Tables<'savings_student_summary'>, 'student_id' | 'full_name' | 'class_name' | 'photo_url'> & {
  student_code?: string | null;
  balance?: number | null;
  spent?: number | null;
};
// A presentation projection, not a second copy of the database row types.
export type BankActivity = {
  id: string; studentId: string | null; name?: string; date: string;
  className: string | null; category: string; categoryId: string; color: string | null;
  incoming: number; outgoing: number; points: number; count: number;
};
export type BankDataset = {
  students: BankStudent[]; activities: BankActivity[];
  pending: number | null; claims: Pick<Tables<'reward_claims'>, 'id' | 'student_id' | 'reward_name' | 'points_used' | 'status' | 'claimed_at'>[];
};

export const bankDashboardService = {
  async load(kind: BankKind, audience: BankAudience, studentId?: string): Promise<BankDataset> {
    if (audience === 'parent' && !studentId) throw new Error('กรุณาเลือกบุตร');
    const privateView = audience !== 'public';
    if (kind === 'savings') {
      const [students, activities] = await Promise.all([
        privateView
          ? readBankPages((from, to) => {
            let q = supabase.from('savings_student_summary').select('student_id,full_name,class_name,photo_url,student_code,current_balance').order('student_id');
            if (studentId) q = q.eq('student_id', studentId);
            return q.range(from, to);
          }).then(rows => rows.map(s => ({ ...s, balance: s.current_balance })))
          : readBankPages((from, to) => supabase.from('savings_student_summary')
            .select('student_id,full_name,class_name,photo_url').order('student_id').range(from, to)),
        privateView
          ? readBankPages((from, to) => {
            let q = supabase.from('savings_transactions').select('id,student_id,student_name,student_class,transaction_date,transaction_type,amount').order('transaction_date').order('created_at').order('id');
            if (studentId) q = q.eq('student_id', studentId);
            return q.range(from, to);
          }).then(rows => rows.map(t => ({ id: t.id, studentId: t.student_id, name: t.student_name, date: t.transaction_date,
            className: t.student_class, category: t.transaction_type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน', categoryId: t.transaction_type, color: null,
            incoming: t.transaction_type === 'deposit' ? t.amount : 0, outgoing: t.transaction_type === 'withdraw' ? t.amount : 0,
            points: 0, count: t.transaction_type === 'deposit' ? 1 : 0 })))
          : readBankPages((from, to) => supabase.from('savings_transactions')
            .select('id,student_id,student_class,transaction_date').eq('transaction_type', 'deposit').order('transaction_date').order('id').range(from, to))
            .then(rows => rows.map(t => ({ id: t.id, studentId: t.student_id, date: t.transaction_date, className: t.student_class,
              category: 'ฝากเงิน', categoryId: 'deposit', color: null, incoming: 1, outgoing: 0, points: 0, count: 1 }))),
      ]);
      return { students, activities, pending: null, claims: [] };
    }
    const [students, transactions, claims, pending] = await Promise.all([
      readBankPages((from, to) => {
        let q = supabase.from('waste_student_summary').select('student_id,full_name,class_name,photo_url,available_points,total_points_spent').order('student_id');
        if (studentId) q = q.eq('student_id', studentId);
        return q.range(from, to);
      }).then(rows => rows.map(s => ({ student_id: s.student_id, full_name: s.full_name, class_name: s.class_name, photo_url: s.photo_url,
        ...(privateView ? { balance: s.available_points, spent: s.total_points_spent } : {}) }))),
      readBankPages((from, to) => {
        let q = supabase.from('waste_transactions').select('id,student_id,student_class,transaction_date,category_id,quantity,points_earned,waste_categories(name,color)')
          .order('transaction_date').order('created_at').order('id');
        if (studentId) q = q.eq('student_id', studentId);
        return q.range(from, to);
      }),
      privateView && studentId ? readBankPages((from, to) => supabase.from('reward_claims')
        .select('id,student_id,reward_name,points_used,status,claimed_at').eq('student_id', studentId).order('claimed_at').order('id').range(from, to)) : Promise.resolve([]),
      audience === 'admin' && !studentId ? supabase.from('reward_claims').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        .then(({ count, error }) => { if (error) throw error; return count; }) : Promise.resolve(null),
    ]);
    // Codes are only requested on authenticated views, never on a public response.
    let privateStudents: BankStudent[] = students;
    if (privateView) {
      const codes = await readBankPages((from, to) => {
        let q = supabase.from('waste_student_summary').select('student_id,student_code').order('student_id');
        if (studentId) q = q.eq('student_id', studentId);
        return q.range(from, to);
      });
      const codeMap = new Map(codes.map(s => [s.student_id, s.student_code]));
      privateStudents = students.map(s => ({ ...s, student_code: codeMap.get(s.student_id) }));
    }
    return { students: privateStudents, pending, claims, activities: transactions.map(t => ({
      id: t.id, studentId: t.student_id, date: t.transaction_date, className: t.student_class,
      category: t.waste_categories?.name ?? 'ประเภทที่ไม่พบ', categoryId: t.category_id, color: t.waste_categories?.color ?? null,
      incoming: t.quantity, outgoing: 0, points: t.points_earned, count: 1,
    })) };
  },
};
