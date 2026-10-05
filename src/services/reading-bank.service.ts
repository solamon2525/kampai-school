/**
 * reading-bank.service.ts
 * Supabase service for "ธนาคารการอ่าน" (Reading Bank)
 * — บันทึกการอ่าน, จำนวนหน้า, ระดับนักอ่าน (Reading Tier), และสะสมแต้มการอ่าน
 */
import { supabase } from '@/integrations/supabase/client';

export type ReadingTier =
  | 'ปราชญ์แห่งคำไผ่ 👑'
  | 'ยอดนักอ่าน 🌟'
  | 'หนอนหนังสือตัวน้อย 📖'
  | 'ต้นกล้านักอ่าน 🌱'
  | 'พร้อมเริ่มอ่าน 🌱';

export type ReadingLog = {
  id: string;
  student_id: string;
  student_name: string;
  student_class: string | null;
  book_title: string;
  book_author: string | null;
  book_category: string;
  pages_read: number;
  summary_notes: string | null;
  rating: number;
  reading_date: string;
  points_earned: number;
  status: 'pending' | 'approved' | 'rejected';
  recorded_by: string | null;
  recorded_by_staff_id: string | null;
  academic_year: string | null;
  semester: string | null;
  created_at: string;
  updated_at: string;
  students?: { photo_url: string | null } | null;
};

export type ReadingStudentSummary = {
  student_id: string;
  full_name: string;
  class_name: string | null;
  photo_url: string | null;
  student_code: string | null;
  total_books: number;
  total_pages: number;
  total_points: number;
  reading_tier: ReadingTier;
};

export type PublicReadingLeaderboardEntry = {
  student_id: string;
  full_name: string;
  class_name: string | null;
  photo_url: string | null;
  total_books: number;
  total_pages: number;
  total_points: number;
  reading_tier: ReadingTier;
};

export type StudentReadingHistoryRow = {
  id: string;
  book_title: string;
  book_author: string | null;
  book_category: string;
  pages_read: number;
  summary_notes: string | null;
  rating: number;
  reading_date: string;
  points_earned: number;
  status: 'pending' | 'approved' | 'rejected';
  recorded_by: string | null;
  created_at: string;
};

export const BOOK_CATEGORIES = [
  'นิทาน/วรรณกรรม',
  'สารคดี/วิทยาศาสตร์',
  'การ์ตูนความรู้',
  'ประวัติศาสตร์/สังคม',
  'ภาษาอังกฤษ/ภาษาต่างประเทศ',
  'ทั่วไป/การพัฒนาตนเอง',
] as const;

export const readingBankService = {
  /** Public leaderboard sorted by pages & books */
  getLeaderboard: async (limit = 50, offset = 0) => {
    return supabase
      .rpc('get_public_reading_leaderboard', { p_limit: limit, p_offset: offset })
      .returns<PublicReadingLeaderboardEntry[]>();
  },

  /** Public lookup for student reading summary by student_code */
  lookupStudent: async (code: string) => {
    return supabase
      .rpc('lookup_student_reading', { p_code: code.trim() })
      .returns<ReadingStudentSummary[]>();
  },

  /** Public lookup for student reading history by student_code */
  getStudentHistory: async (code: string, limit = 50) => {
    return supabase
      .rpc('get_student_reading_history', { p_code: code.trim(), p_limit: limit })
      .returns<StudentReadingHistoryRow[]>();
  },

  /** Get all reading student summaries (for admin/teacher table) */
  getAllSummaries: async () => {
    return supabase
      .from('reading_student_summary')
      .select('*')
      .order('total_pages', { ascending: false });
  },

  /** Get recent reading logs for admin */
  getRecentLogs: async (limit = 100) => {
    return supabase
      .from('reading_logs')
      .select('*, students(photo_url)')
      .order('reading_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  /** Record a new reading entry (via student code or teacher recording) */
  recordEntry: async (data: {
    code: string;
    bookTitle: string;
    bookAuthor?: string;
    bookCategory?: string;
    pagesRead: number;
    summaryNotes?: string;
    rating?: number;
    recordedBy?: string;
    recordedByStaffId?: string;
  }) => {
    return supabase.rpc('record_reading_entry', {
      p_code: data.code.trim(),
      p_book_title: data.bookTitle.trim(),
      p_book_author: data.bookAuthor?.trim() || null,
      p_book_category: data.bookCategory || 'นิทาน/วรรณกรรม',
      p_pages_read: data.pagesRead,
      p_summary_notes: data.summaryNotes?.trim() || null,
      p_rating: data.rating ?? 5,
      p_recorded_by: data.recordedBy || null,
      p_recorded_by_staff_id: data.recordedByStaffId || null,
    });
  },

  /** Delete a reading log (teacher/admin only) */
  deleteLog: async (id: string) => {
    return supabase.from('reading_logs').delete().eq('id', id);
  },
};
