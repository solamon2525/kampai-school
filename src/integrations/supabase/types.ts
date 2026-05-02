export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_calendar: {
        Row: {
          academic_year: string
          created_at: string | null
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          is_all_day: boolean | null
          semester: number | null
          start_date: string
          title: string
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean | null
          semester?: number | null
          start_date: string
          title: string
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean | null
          semester?: number | null
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      administrators: {
        Row: {
          created_at: string | null
          education: string | null
          id: string
          name: string
          order_position: number | null
          photo_url: string | null
          position: string
          quote: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          education?: string | null
          id?: string
          name: string
          order_position?: number | null
          photo_url?: string | null
          position: string
          quote?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          education?: string | null
          id?: string
          name?: string
          order_position?: number | null
          photo_url?: string | null
          position?: string
          quote?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admissions: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string | null
          gender: string | null
          grade_applying: string
          id: string
          notes: string | null
          parent_email: string | null
          parent_name: string
          parent_phone: string
          previous_school: string | null
          program_applying: string
          status: string
          student_id_card: string | null
          student_name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          gender?: string | null
          grade_applying: string
          id?: string
          notes?: string | null
          parent_email?: string | null
          parent_name: string
          parent_phone: string
          previous_school?: string | null
          program_applying: string
          status?: string
          student_id_card?: string | null
          student_name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          gender?: string | null
          grade_applying?: string
          id?: string
          notes?: string | null
          parent_email?: string | null
          parent_name?: string
          parent_phone?: string
          previous_school?: string | null
          program_applying?: string
          status?: string
          student_id_card?: string | null
          student_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          attendance_date: string
          created_at: string | null
          id: string
          notes: string | null
          recorded_by: string | null
          status: string
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_date: string
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status: string
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_date?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          academic_year: string
          created_at: string | null
          day_of_week: number
          end_time: string | null
          grade: string
          id: string
          period: number
          room: string | null
          semester: number | null
          staff_id: string | null
          start_time: string | null
          subject: string
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          day_of_week: number
          end_time?: string | null
          grade: string
          id?: string
          period: number
          room?: string | null
          semester?: number | null
          staff_id?: string | null
          start_time?: string | null
          subject: string
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string | null
          grade?: string
          id?: string
          period?: number
          room?: string | null
          semester?: number | null
          staff_id?: string | null
          start_time?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      conduct_scores: {
        Row: {
          academic_year: string
          category: string
          created_at: string | null
          id: string
          reason: string
          recorded_by: string | null
          score: number
          semester: string
          student_id: string
          type: string
        }
        Insert: {
          academic_year: string
          category?: string
          created_at?: string | null
          id?: string
          reason: string
          recorded_by?: string | null
          score?: number
          semester?: string
          student_id: string
          type: string
        }
        Update: {
          academic_year?: string
          category?: string
          created_at?: string | null
          id?: string
          reason?: string
          recorded_by?: string | null
          score?: number
          semester?: string
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conduct_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      counseling_records: {
        Row: {
          action_taken: string | null
          concern_type: string | null
          content: string | null
          counselor: string
          created_at: string | null
          followup_date: string | null
          id: string
          session_date: string
          status: string | null
          student_id: string
          topic: string
        }
        Insert: {
          action_taken?: string | null
          concern_type?: string | null
          content?: string | null
          counselor: string
          created_at?: string | null
          followup_date?: string | null
          id?: string
          session_date?: string
          status?: string | null
          student_id: string
          topic: string
        }
        Update: {
          action_taken?: string | null
          concern_type?: string | null
          content?: string | null
          counselor?: string
          created_at?: string | null
          followup_date?: string | null
          id?: string
          session_date?: string
          status?: string | null
          student_id?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "counseling_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counseling_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      curriculum_activities: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_position: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_position?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_position?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      curriculum_programs: {
        Row: {
          careers: string[] | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          order_position: number | null
          subjects: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          careers?: string[] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          subjects?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          careers?: string[] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          subjects?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_position: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_position?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_position?: number | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          academic_year: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_published: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          image_url: string | null
          location: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          order_position: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faq: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          is_active: boolean | null
          order_position: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_albums: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "gallery_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_data: {
        Row: {
          boys: number | null
          created_at: string | null
          girls: number | null
          id: string
          is_active: boolean | null
          level: string
          order_position: number | null
          rooms: number | null
          students: number | null
        }
        Insert: {
          boys?: number | null
          created_at?: string | null
          girls?: number | null
          id?: string
          is_active?: boolean | null
          level: string
          order_position?: number | null
          rooms?: number | null
          students?: number | null
        }
        Update: {
          boys?: number | null
          created_at?: string | null
          girls?: number | null
          id?: string
          is_active?: boolean | null
          level?: string
          order_position?: number | null
          rooms?: number | null
          students?: number | null
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          order_position: number | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          order_position?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          order_position?: number | null
          title?: string | null
        }
        Relationships: []
      }
      incoming_letters: {
        Row: {
          assigned_to: string | null
          attachment_url: string | null
          created_at: string | null
          due_date: string | null
          id: string
          letter_number: string | null
          notes: string | null
          priority: string | null
          received_date: string
          sender: string | null
          status: string | null
          subject: string
        }
        Insert: {
          assigned_to?: string | null
          attachment_url?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          letter_number?: string | null
          notes?: string | null
          priority?: string | null
          received_date: string
          sender?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          assigned_to?: string | null
          attachment_url?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          letter_number?: string | null
          notes?: string | null
          priority?: string | null
          received_date?: string
          sender?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "incoming_letters_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          academic_year: string
          created_at: string | null
          id: string
          personal_quota: number | null
          personal_used: number | null
          sick_quota: number | null
          sick_used: number | null
          staff_id: string | null
          vacation_quota: number | null
          vacation_used: number | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          id?: string
          personal_quota?: number | null
          personal_used?: number | null
          sick_quota?: number | null
          sick_used?: number | null
          staff_id?: string | null
          vacation_quota?: number | null
          vacation_used?: number | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          id?: string
          personal_quota?: number | null
          personal_used?: number | null
          sick_quota?: number | null
          sick_used?: number | null
          staff_id?: string | null
          vacation_quota?: number | null
          vacation_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          created_at: string | null
          days: number
          end_date: string
          id: string
          leave_type: string
          notes: string | null
          reason: string | null
          staff_id: string | null
          start_date: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          created_at?: string | null
          days?: number
          end_date: string
          id?: string
          leave_type: string
          notes?: string | null
          reason?: string | null
          staff_id?: string | null
          start_date: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          created_at?: string | null
          days?: number
          end_date?: string
          id?: string
          leave_type?: string
          notes?: string | null
          reason?: string | null
          staff_id?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          academic_year: string
          activities: string | null
          created_at: string | null
          duration_hours: number | null
          evaluation: string | null
          file_url: string | null
          grade: string
          id: string
          materials: string | null
          objectives: string | null
          semester: number | null
          staff_id: string | null
          status: string | null
          subject: string
          unit_title: string
          week_number: number | null
        }
        Insert: {
          academic_year: string
          activities?: string | null
          created_at?: string | null
          duration_hours?: number | null
          evaluation?: string | null
          file_url?: string | null
          grade: string
          id?: string
          materials?: string | null
          objectives?: string | null
          semester?: number | null
          staff_id?: string | null
          status?: string | null
          subject: string
          unit_title: string
          week_number?: number | null
        }
        Update: {
          academic_year?: string
          activities?: string | null
          created_at?: string | null
          duration_hours?: number | null
          evaluation?: string | null
          file_url?: string | null
          grade?: string
          id?: string
          materials?: string | null
          objectives?: string | null
          semester?: number | null
          staff_id?: string | null
          status?: string | null
          subject?: string
          unit_title?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agendas: string[] | null
          attendees: string[] | null
          created_at: string | null
          decisions: string | null
          id: string
          location: string | null
          meeting_date: string
          meeting_time: string | null
          minutes_url: string | null
          title: string
        }
        Insert: {
          agendas?: string[] | null
          attendees?: string[] | null
          created_at?: string | null
          decisions?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          meeting_time?: string | null
          minutes_url?: string | null
          title: string
        }
        Update: {
          agendas?: string[] | null
          attendees?: string[] | null
          created_at?: string | null
          decisions?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_time?: string | null
          minutes_url?: string | null
          title?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string | null
          event: string
          id: string
          is_active: boolean | null
          order_position: number | null
          updated_at: string | null
          year: string
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          updated_at?: string | null
          year: string
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          updated_at?: string | null
          year?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          external_links: Json | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          published: boolean
          published_at: string | null
          show_in_ticker: boolean
          sort_order: number | null
          ticker_order: number | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          category?: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          external_links?: Json | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          published?: boolean
          published_at?: string | null
          show_in_ticker?: boolean
          sort_order?: number | null
          ticker_order?: number | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          external_links?: Json | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          published?: boolean
          published_at?: string | null
          show_in_ticker?: boolean
          sort_order?: number | null
          ticker_order?: number | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      news_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      orders_announcements: {
        Row: {
          attachment_url: string | null
          content: string | null
          created_at: string | null
          doc_date: string
          doc_number: string | null
          doc_type: string
          id: string
          subject: string
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string | null
          doc_date: string
          doc_number?: string | null
          doc_type?: string
          id?: string
          subject: string
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string | null
          doc_date?: string
          doc_number?: string | null
          doc_type?: string
          id?: string
          subject?: string
        }
        Relationships: []
      }
      outgoing_letters: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          id: string
          letter_number: string | null
          priority: string | null
          recipient: string | null
          sent_date: string
          status: string | null
          subject: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          letter_number?: string | null
          priority?: string | null
          recipient?: string | null
          sent_date: string
          status?: string | null
          subject: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          letter_number?: string | null
          priority?: string | null
          recipient?: string | null
          sent_date?: string
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      pa_assessments: {
        Row: {
          academic_year: string
          created_at: string | null
          director_rating: number | null
          id: string
          id_plan_url: string | null
          notes: string | null
          observation_count: number | null
          observation_target: number | null
          self_rating: number | null
          semester: number | null
          staff_id: string | null
          status: string | null
          training_hours: number | null
          training_target: number | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          director_rating?: number | null
          id?: string
          id_plan_url?: string | null
          notes?: string | null
          observation_count?: number | null
          observation_target?: number | null
          self_rating?: number | null
          semester?: number | null
          staff_id?: string | null
          status?: string | null
          training_hours?: number | null
          training_target?: number | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          director_rating?: number | null
          id?: string
          id_plan_url?: string | null
          notes?: string | null
          observation_count?: number | null
          observation_target?: number | null
          self_rating?: number | null
          semester?: number | null
          staff_id?: string | null
          status?: string | null
          training_hours?: number | null
          training_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pa_assessments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          id: string
          page_path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          visited_at: string | null
        }
        Insert: {
          id?: string
          page_path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visited_at?: string | null
        }
        Update: {
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visited_at?: string | null
        }
        Relationships: []
      }
      reward_claims: {
        Row: {
          claimed_at: string | null
          id: string
          points_used: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reward_id: string
          reward_name: string
          status: Database["public"]["Enums"]["reward_claim_status"] | null
          student_id: string
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          points_used: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_id: string
          reward_name: string
          status?: Database["public"]["Enums"]["reward_claim_status"] | null
          student_id: string
        }
        Update: {
          claimed_at?: string | null
          id?: string
          points_used?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_id?: string
          reward_name?: string
          status?: Database["public"]["Enums"]["reward_claim_status"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_claims_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_claims_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_claims_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          order_position: number | null
          points_cost: number
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          order_position?: number | null
          points_cost: number
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          order_position?: number | null
          points_cost?: number
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      score_records: {
        Row: {
          academic_year: string
          created_at: string | null
          id: string
          max_score: number
          notes: string | null
          recorded_by: string | null
          score: number
          score_type: string
          semester: string
          student_id: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          id?: string
          max_score?: number
          notes?: string | null
          recorded_by?: string | null
          score?: number
          score_type?: string
          semester?: string
          student_id: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          id?: string
          max_score?: number
          notes?: string | null
          recorded_by?: string | null
          score?: number
          score_type?: string
          semester?: string
          student_id?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string | null
          department: string | null
          education: string | null
          experience: string | null
          id: string
          name: string
          order_position: number | null
          photo_url: string | null
          position: string
          staff_type: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          education?: string | null
          experience?: string | null
          id?: string
          name: string
          order_position?: number | null
          photo_url?: string | null
          position: string
          staff_type?: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          education?: string | null
          experience?: string | null
          id?: string
          name?: string
          order_position?: number | null
          photo_url?: string | null
          position?: string
          staff_type?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          order_position: number | null
          title: string
          year: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          order_position?: number | null
          title: string
          year?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          order_position?: number | null
          title?: string
          year?: string | null
        }
        Relationships: []
      }
      student_activities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          members: number | null
          name: string
          order_position: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          members?: number | null
          name: string
          order_position?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          members?: number | null
          name?: string
          order_position?: number | null
        }
        Relationships: []
      }
      student_council: {
        Row: {
          class: string | null
          created_at: string | null
          id: string
          image_url: string | null
          initial: string | null
          is_active: boolean | null
          name: string
          order_position: number | null
          position: string
        }
        Insert: {
          class?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          initial?: string | null
          is_active?: boolean | null
          name: string
          order_position?: number | null
          position: string
        }
        Update: {
          class?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          initial?: string | null
          is_active?: boolean | null
          name?: string
          order_position?: number | null
          position?: string
        }
        Relationships: []
      }
      student_special_needs: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          need_type: string
          notes: string | null
          start_date: string | null
          status: string | null
          student_id: string
          support_by: string | null
          support_plan: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          need_type: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          student_id: string
          support_by?: string | null
          support_plan?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          need_type?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          student_id?: string
          support_by?: string | null
          support_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_special_needs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_special_needs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_stats: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          order_position: number | null
          value: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          order_position?: number | null
          value: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          order_position?: number | null
          value?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          birth_date: string | null
          blood_type: string | null
          class: string
          class_number: number | null
          created_at: string | null
          current_amphoe: string | null
          current_house_no: string | null
          current_moo: string | null
          current_phone: string | null
          current_postal_code: string | null
          current_province: string | null
          current_road: string | null
          current_tambon: string | null
          father_name: string | null
          first_name: string | null
          gender: string | null
          guardian_name: string | null
          guardian_relation: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          mother_name: string | null
          name: string
          national_id: string | null
          nationality: string | null
          nickname: string | null
          parent_name: string | null
          parent_phone: string | null
          photo_url: string | null
          registered_amphoe: string | null
          registered_house_no: string | null
          registered_moo: string | null
          registered_phone: string | null
          registered_postal_code: string | null
          registered_province: string | null
          registered_road: string | null
          registered_tambon: string | null
          religion: string | null
          room: string | null
          student_code: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          blood_type?: string | null
          class: string
          class_number?: number | null
          created_at?: string | null
          current_amphoe?: string | null
          current_house_no?: string | null
          current_moo?: string | null
          current_phone?: string | null
          current_postal_code?: string | null
          current_province?: string | null
          current_road?: string | null
          current_tambon?: string | null
          father_name?: string | null
          first_name?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_relation?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          mother_name?: string | null
          name: string
          national_id?: string | null
          nationality?: string | null
          nickname?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          registered_amphoe?: string | null
          registered_house_no?: string | null
          registered_moo?: string | null
          registered_phone?: string | null
          registered_postal_code?: string | null
          registered_province?: string | null
          registered_road?: string | null
          registered_tambon?: string | null
          religion?: string | null
          room?: string | null
          student_code?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          blood_type?: string | null
          class?: string
          class_number?: number | null
          created_at?: string | null
          current_amphoe?: string | null
          current_house_no?: string | null
          current_moo?: string | null
          current_phone?: string | null
          current_postal_code?: string | null
          current_province?: string | null
          current_road?: string | null
          current_tambon?: string | null
          father_name?: string | null
          first_name?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_relation?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          mother_name?: string | null
          name?: string
          national_id?: string | null
          nationality?: string | null
          nickname?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          registered_amphoe?: string | null
          registered_house_no?: string | null
          registered_moo?: string | null
          registered_phone?: string | null
          registered_postal_code?: string | null
          registered_province?: string | null
          registered_road?: string | null
          registered_tambon?: string | null
          religion?: string | null
          room?: string | null
          student_code?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supervision_records: {
        Row: {
          created_at: string | null
          followup_date: string | null
          grade_observed: string | null
          id: string
          improvements: string | null
          recommendations: string | null
          staff_id: string
          status: string | null
          strengths: string | null
          subject_observed: string | null
          supervisor: string
          visit_date: string
        }
        Insert: {
          created_at?: string | null
          followup_date?: string | null
          grade_observed?: string | null
          id?: string
          improvements?: string | null
          recommendations?: string | null
          staff_id: string
          status?: string | null
          strengths?: string | null
          subject_observed?: string | null
          supervisor: string
          visit_date?: string
        }
        Update: {
          created_at?: string | null
          followup_date?: string | null
          grade_observed?: string | null
          id?: string
          improvements?: string | null
          recommendations?: string | null
          staff_id?: string
          status?: string | null
          strengths?: string | null
          subject_observed?: string | null
          supervisor?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervision_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_materials: {
        Row: {
          condition: string | null
          created_at: string | null
          id: string
          material_type: string | null
          notes: string | null
          quantity: number | null
          storage_location: string | null
          subject: string | null
          title: string
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          id?: string
          material_type?: string | null
          notes?: string | null
          quantity?: number | null
          storage_location?: string | null
          subject?: string | null
          title: string
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          id?: string
          material_type?: string | null
          notes?: string | null
          quantity?: number | null
          storage_location?: string | null
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      training_records: {
        Row: {
          budget: number | null
          certificate_url: string | null
          course_name: string
          created_at: string | null
          end_date: string | null
          hours: number | null
          id: string
          location: string | null
          notes: string | null
          provider: string | null
          staff_id: string | null
          start_date: string
          status: string | null
          training_type: string | null
        }
        Insert: {
          budget?: number | null
          certificate_url?: string | null
          course_name: string
          created_at?: string | null
          end_date?: string | null
          hours?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          provider?: string | null
          staff_id?: string | null
          start_date: string
          status?: string | null
          training_type?: string | null
        }
        Update: {
          budget?: number | null
          certificate_url?: string | null
          course_name?: string
          created_at?: string | null
          end_date?: string | null
          hours?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          provider?: string | null
          staff_id?: string | null
          start_date?: string
          status?: string | null
          training_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          staff_id: string | null
          student_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          staff_id?: string | null
          student_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          staff_id?: string | null
          student_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      waste_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_position: number | null
          points_per_item: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_position?: number | null
          points_per_item: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_position?: number | null
          points_per_item?: number
        }
        Relationships: []
      }
      waste_transactions: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          notes: string | null
          points_earned: number
          quantity: number
          recorded_by: string | null
          student_class: string | null
          student_id: string | null
          student_name: string
          transaction_date: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          points_earned: number
          quantity: number
          recorded_by?: string | null
          student_class?: string | null
          student_id?: string | null
          student_name: string
          transaction_date?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          points_earned?: number
          quantity?: number
          recorded_by?: string | null
          student_class?: string | null
          student_id?: string | null
          student_name?: string
          transaction_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waste_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "waste_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
    }
    Views: {
      waste_student_summary: {
        Row: {
          available_points: number | null
          class_name: string | null
          full_name: string | null
          student_id: string | null
          total_items: number | null
          total_points_earned: number | null
          total_points_spent: number | null
          total_transactions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_role: { Args: never; Returns: string }
      get_db_size: { Args: never; Returns: number }
      get_storage_usage: {
        Args: never
        Returns: {
          bucket_id: string
          file_count: number
          total_bytes: number
        }[]
      }
      increment_news_view: { Args: { news_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      next_incoming_number: { Args: never; Returns: string }
      next_outgoing_number: { Args: never; Returns: string }
    }
    Enums: {
      reward_claim_status: "pending" | "approved" | "rejected"
      user_role: "admin" | "teacher" | "viewer" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      reward_claim_status: ["pending", "approved", "rejected"],
      user_role: ["admin", "teacher", "viewer", "parent"],
    },
  },
} as const
