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
      action_plan_milestones: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          progress_pct: number | null
          project_id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          progress_pct?: number | null
          project_id: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          progress_pct?: number | null
          project_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "action_plan_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plan_projects: {
        Row: {
          budget: number | null
          code: string | null
          created_at: string | null
          end_date: string | null
          fiscal_year: number
          id: string
          kpi: string | null
          name: string
          notes: string | null
          responsible_staff_id: string | null
          start_date: string | null
          status: string
          strategy: string | null
        }
        Insert: {
          budget?: number | null
          code?: string | null
          created_at?: string | null
          end_date?: string | null
          fiscal_year: number
          id?: string
          kpi?: string | null
          name: string
          notes?: string | null
          responsible_staff_id?: string | null
          start_date?: string | null
          status?: string
          strategy?: string | null
        }
        Update: {
          budget?: number | null
          code?: string | null
          created_at?: string | null
          end_date?: string | null
          fiscal_year?: number
          id?: string
          kpi?: string | null
          name?: string
          notes?: string | null
          responsible_staff_id?: string | null
          start_date?: string | null
          status?: string
          strategy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_projects_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plan_projects_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      administrators: {
        Row: {
          created_at: string | null
          education: string | null
          email: string | null
          id: string
          name: string
          order_position: number | null
          phone: string | null
          photo_url: string | null
          position: string
          quote: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          education?: string | null
          email?: string | null
          id?: string
          name: string
          order_position?: number | null
          phone?: string | null
          photo_url?: string | null
          position: string
          quote?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          education?: string | null
          email?: string | null
          id?: string
          name?: string
          order_position?: number | null
          phone?: string | null
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
      ai_assist_log: {
        Row: {
          cached_input_tokens: number | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          input_tokens: number | null
          mode: string
          model: string
          output_chars: number | null
          output_tokens: number | null
          prompt_chars: number | null
          user_id: string | null
        }
        Insert: {
          cached_input_tokens?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input_tokens?: number | null
          mode: string
          model: string
          output_chars?: number | null
          output_tokens?: number | null
          prompt_chars?: number | null
          user_id?: string | null
        }
        Update: {
          cached_input_tokens?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input_tokens?: number | null
          mode?: string
          model?: string
          output_chars?: number | null
          output_tokens?: number | null
          prompt_chars?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      alumni_event_attendees: {
        Row: {
          alumni_profile_id: string | null
          event_id: string
          guest_name: string
          guest_phone: string | null
          id: string
          notes: string | null
          party_size: number
          responded_at: string
        }
        Insert: {
          alumni_profile_id?: string | null
          event_id: string
          guest_name: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          party_size?: number
          responded_at?: string
        }
        Update: {
          alumni_profile_id?: string | null
          event_id?: string
          guest_name?: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          party_size?: number
          responded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alumni_event_attendees_alumni_profile_id_fkey"
            columns: ["alumni_profile_id"]
            isOneToOne: false
            referencedRelation: "alumni_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumni_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "alumni_events"
            referencedColumns: ["id"]
          },
        ]
      }
      alumni_events: {
        Row: {
          attendee_count: number
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          id: string
          is_published: boolean
          location: string | null
          title: string
        }
        Insert: {
          attendee_count?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          id?: string
          is_published?: boolean
          location?: string | null
          title: string
        }
        Update: {
          attendee_count?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          id?: string
          is_published?: boolean
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      alumni_profiles: {
        Row: {
          bio: string | null
          contact_email_public: string | null
          contact_phone_public: string | null
          current_career: string | null
          current_school: string | null
          current_workplace: string | null
          full_name: string
          graduation_class: string | null
          graduation_year: number
          id: string
          is_featured: boolean
          is_verified: boolean
          nickname: string | null
          photo_url: string | null
          submitted_at: string
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          bio?: string | null
          contact_email_public?: string | null
          contact_phone_public?: string | null
          current_career?: string | null
          current_school?: string | null
          current_workplace?: string | null
          full_name: string
          graduation_class?: string | null
          graduation_year: number
          id?: string
          is_featured?: boolean
          is_verified?: boolean
          nickname?: string | null
          photo_url?: string | null
          submitted_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          bio?: string | null
          contact_email_public?: string | null
          contact_phone_public?: string | null
          current_career?: string | null
          current_school?: string | null
          current_workplace?: string | null
          full_name?: string
          graduation_class?: string | null
          graduation_year?: number
          id?: string
          is_featured?: boolean
          is_verified?: boolean
          nickname?: string | null
          photo_url?: string | null
          submitted_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attachment_url: string | null
          body: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          student_id: string
          submitted_at: string
          submitted_by: string | null
          teacher_comment: string | null
        }
        Insert: {
          assignment_id: string
          attachment_url?: string | null
          body?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string
          submitted_by?: string | null
          teacher_comment?: string | null
        }
        Update: {
          assignment_id?: string
          attachment_url?: string | null
          body?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string
          submitted_by?: string | null
          teacher_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      assignments: {
        Row: {
          attachment_url: string | null
          class: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          is_archived: boolean
          max_score: number | null
          room: string | null
          subject: string | null
          title: string
        }
        Insert: {
          attachment_url?: string | null
          class: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_archived?: boolean
          max_score?: number | null
          room?: string | null
          subject?: string | null
          title: string
        }
        Update: {
          attachment_url?: string | null
          class?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_archived?: boolean
          max_score?: number | null
          room?: string | null
          subject?: string | null
          title?: string
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
          recorded_by_administrator_id: string | null
          recorded_by_staff_id: string | null
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
          recorded_by_administrator_id?: string | null
          recorded_by_staff_id?: string | null
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
          recorded_by_administrator_id?: string | null
          recorded_by_staff_id?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_recorded_by_administrator_id_fkey"
            columns: ["recorded_by_administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
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
      budget_categories: {
        Row: {
          allocated: number
          code: string | null
          created_at: string | null
          description: string | null
          fiscal_year: number
          id: string
          name: string
        }
        Insert: {
          allocated?: number
          code?: string | null
          created_at?: string | null
          description?: string | null
          fiscal_year: number
          id?: string
          name: string
        }
        Update: {
          allocated?: number
          code?: string | null
          created_at?: string | null
          description?: string | null
          fiscal_year?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      budget_transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          doc_ref: string | null
          id: string
          note: string | null
          posted_by: string | null
          txn_date: string
          txn_type: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          doc_ref?: string | null
          id?: string
          note?: string | null
          posted_by?: string | null
          txn_date?: string
          txn_type?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          doc_ref?: string | null
          id?: string
          note?: string | null
          posted_by?: string | null
          txn_date?: string
          txn_type?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_summary"
            referencedColumns: ["category_id"]
          },
        ]
      }
      cctv_cameras: {
        Row: {
          created_at: string
          hls_url: string
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          location_label: string | null
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          hls_url: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          location_label?: string | null
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          hls_url?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          location_label?: string | null
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          sender_user_id: string
          thread_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          sender_user_id: string
          thread_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          sender_user_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          parent_user_id: string
          student_id: string | null
          subject: string | null
          teacher_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          parent_user_id: string
          student_id?: string | null
          subject?: string | null
          teacher_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          parent_user_id?: string
          student_id?: string | null
          subject?: string | null
          teacher_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "chat_threads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      class_photo_tags: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          radius_pct: number
          student_id: string
          tagged_by: string | null
          x_pct: number
          y_pct: number
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          radius_pct?: number
          student_id: string
          tagged_by?: string | null
          x_pct: number
          y_pct: number
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          radius_pct?: number
          student_id?: string
          tagged_by?: string | null
          x_pct?: number
          y_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_photo_tags_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "class_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_photo_tags_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "class_photo_tags_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_photo_tags_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      class_photos: {
        Row: {
          caption: string | null
          class: string
          created_at: string
          id: string
          photo_url: string
          room: string | null
          taken_at: string | null
          title: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          class: string
          created_at?: string
          id?: string
          photo_url: string
          room?: string | null
          taken_at?: string | null
          title?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          class?: string
          created_at?: string
          id?: string
          photo_url?: string
          room?: string | null
          taken_at?: string | null
          title?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "class_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
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
          recorded_by_administrator_id: string | null
          recorded_by_staff_id: string | null
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
          recorded_by_administrator_id?: string | null
          recorded_by_staff_id?: string | null
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
          recorded_by_administrator_id?: string | null
          recorded_by_staff_id?: string | null
          score?: number
          semester?: string
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conduct_scores_recorded_by_administrator_id_fkey"
            columns: ["recorded_by_administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_scores_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_scores_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "conduct_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
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
      conference_bookings: {
        Row: {
          cancelled_reason: string | null
          created_at: string
          id: string
          parent_user_id: string
          slot_id: string
          status: string
          student_id: string | null
          topic: string | null
        }
        Insert: {
          cancelled_reason?: string | null
          created_at?: string
          id?: string
          parent_user_id: string
          slot_id: string
          status?: string
          student_id?: string | null
          topic?: string | null
        }
        Update: {
          cancelled_reason?: string | null
          created_at?: string
          id?: string
          parent_user_id?: string
          slot_id?: string
          status?: string
          student_id?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conference_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "conference_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conference_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "conference_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conference_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      conference_slots: {
        Row: {
          created_at: string
          duration_min: number
          id: string
          is_cancelled: boolean
          is_published: boolean
          location: string | null
          notes: string | null
          starts_at: string
          teacher_user_id: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          id?: string
          is_cancelled?: boolean
          is_published?: boolean
          location?: string | null
          notes?: string | null
          starts_at: string
          teacher_user_id: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          id?: string
          is_cancelled?: boolean
          is_published?: boolean
          location?: string | null
          notes?: string | null
          starts_at?: string
          teacher_user_id?: string
        }
        Relationships: []
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
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
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
      curriculum_indicators: {
        Row: {
          created_at: string
          description: string
          grade: string
          id: string
          indicator_code: string
          indicator_kind: string | null
          is_active: boolean
          sort_order: number
          standard_code: string | null
          strand_no: string | null
          strand_title: string | null
          subject_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          grade: string
          id?: string
          indicator_code: string
          indicator_kind?: string | null
          is_active?: boolean
          sort_order?: number
          standard_code?: string | null
          strand_no?: string | null
          strand_title?: string | null
          subject_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          grade?: string
          id?: string
          indicator_code?: string
          indicator_kind?: string | null
          is_active?: boolean
          sort_order?: number
          standard_code?: string | null
          strand_no?: string | null
          strand_title?: string | null
          subject_key?: string
          updated_at?: string
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
      daily_challenge_scores: {
        Row: {
          challenge_date: string
          completed_at: string
          correct_count: number
          duration_sec: number | null
          game_slug: string
          score: number
          student_id: string
          total_questions: number
        }
        Insert: {
          challenge_date: string
          completed_at?: string
          correct_count: number
          duration_sec?: number | null
          game_slug?: string
          score: number
          student_id: string
          total_questions?: number
        }
        Update: {
          challenge_date?: string
          completed_at?: string
          correct_count?: number
          duration_sec?: number | null
          game_slug?: string
          score?: number
          student_id?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenge_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "daily_challenge_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_challenge_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      daily_quest_completions: {
        Row: {
          challenge_date: string
          completed_at: string
          game_slug: string | null
          score: number
          session_id: string | null
          student_id: string
          subject_key: string
        }
        Insert: {
          challenge_date: string
          completed_at?: string
          game_slug?: string | null
          score: number
          session_id?: string | null
          student_id: string
          subject_key: string
        }
        Update: {
          challenge_date?: string
          completed_at?: string
          game_slug?: string | null
          score?: number
          session_id?: string | null
          student_id?: string
          subject_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_quest_completions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_quest_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "daily_quest_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_quest_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      daily_quest_config: {
        Row: {
          all_complete_points: number
          all_complete_xp: number
          id: boolean
          updated_at: string
        }
        Insert: {
          all_complete_points?: number
          all_complete_xp?: number
          id?: boolean
          updated_at?: string
        }
        Update: {
          all_complete_points?: number
          all_complete_xp?: number
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      daily_quest_days: {
        Row: {
          all_complete: boolean
          bonus_points: number
          bonus_xp: number
          challenge_date: string
          completed_at: string | null
          completed_count: number
          required_count: number
          streak_days: number
          student_id: string
        }
        Insert: {
          all_complete?: boolean
          bonus_points?: number
          bonus_xp?: number
          challenge_date: string
          completed_at?: string | null
          completed_count?: number
          required_count?: number
          streak_days?: number
          student_id: string
        }
        Update: {
          all_complete?: boolean
          bonus_points?: number
          bonus_xp?: number
          challenge_date?: string
          completed_at?: string | null
          completed_count?: number
          required_count?: number
          streak_days?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_quest_days_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "daily_quest_days_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_quest_days_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      daily_quest_subjects: {
        Row: {
          created_at: string
          icon: string | null
          is_active: boolean
          label_th: string
          sort_order: number
          subject_key: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          is_active?: boolean
          label_th: string
          sort_order?: number
          subject_key: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          is_active?: boolean
          label_th?: string
          sort_order?: number
          subject_key?: string
        }
        Relationships: []
      }
      data_access_logs: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip: string | null
          resource_id: string | null
          resource_type: string
          subject_student_id: string | null
          subject_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip?: string | null
          resource_id?: string | null
          resource_type: string
          subject_student_id?: string | null
          subject_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip?: string | null
          resource_id?: string | null
          resource_type?: string
          subject_student_id?: string | null
          subject_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      doc_category_meta: {
        Row: {
          color_class: string
          created_at: string | null
          description: string | null
          emoji: string | null
          icon_name: string
          is_active: boolean
          key: string
          label: string
          route: string
          sort_order: number
        }
        Insert: {
          color_class?: string
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          icon_name: string
          is_active?: boolean
          key: string
          label: string
          route: string
          sort_order?: number
        }
        Update: {
          color_class?: string
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          icon_name?: string
          is_active?: boolean
          key?: string
          label?: string
          route?: string
          sort_order?: number
        }
        Relationships: []
      }
      doc_template_definitions: {
        Row: {
          body_template: string
          created_at: string | null
          description: string | null
          emoji: string | null
          fields: Json
          id: string
          key: string
          name: string
          sort_order: number | null
        }
        Insert: {
          body_template: string
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          fields?: Json
          id?: string
          key: string
          name: string
          sort_order?: number | null
        }
        Update: {
          body_template?: string
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          fields?: Json
          id?: string
          key?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      doc_template_generations: {
        Row: {
          definition_id: string
          generated_at: string | null
          generated_by: string | null
          id: string
          payload: Json
          rendered_html: string | null
        }
        Insert: {
          definition_id: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          payload?: Json
          rendered_html?: string | null
        }
        Update: {
          definition_id?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          payload?: Json
          rendered_html?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_template_generations_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "doc_template_definitions"
            referencedColumns: ["id"]
          },
        ]
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
      donation_campaigns: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          promptpay_id: string
          promptpay_owner_name: string | null
          raised_amount: number
          start_date: string
          target_amount: number | null
          title: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          promptpay_id: string
          promptpay_owner_name?: string | null
          raised_amount?: number
          start_date?: string
          target_amount?: number | null
          title: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          promptpay_id?: string
          promptpay_owner_name?: string | null
          raised_amount?: number
          start_date?: string
          target_amount?: number | null
          title?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          campaign_id: string | null
          donated_at: string
          donor_email: string | null
          donor_name: string
          donor_phone: string | null
          id: string
          is_anonymous: boolean
          is_verified: boolean
          message: string | null
          notes: string | null
          payment_slip_url: string | null
          receipt_number: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          donated_at?: string
          donor_email?: string | null
          donor_name: string
          donor_phone?: string | null
          id?: string
          is_anonymous?: boolean
          is_verified?: boolean
          message?: string | null
          notes?: string | null
          payment_slip_url?: string | null
          receipt_number?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          donated_at?: string
          donor_email?: string | null
          donor_name?: string
          donor_phone?: string | null
          id?: string
          is_anonymous?: boolean
          is_verified?: boolean
          message?: string | null
          notes?: string | null
          payment_slip_url?: string | null
          receipt_number?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_hub_categories: {
        Row: {
          category_key: string
          color_class: string
          created_at: string
          description: string | null
          icon_name: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_key: string
          color_class?: string
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_key?: string
          color_class?: string
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      educational_hub_items: {
        Row: {
          bgm_preset: string | null
          bgm_url: string | null
          body_html: string | null
          category_id: string
          created_at: string
          description: string | null
          download_count: number
          external_url: string | null
          file_mime: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          game_slug: string | null
          grade_levels: string[]
          homepage_featured: boolean
          id: string
          is_published: boolean
          item_type: Database["public"]["Enums"]["edu_hub_item_type"]
          library_pin_order: number
          library_pinned: boolean
          owner_staff_id: string
          quest_min_score: number | null
          sort_order: number
          subject: string | null
          tags: string[]
          thumbnail_url: string | null
          title: string
          tracked_game: boolean
          updated_at: string
          view_count: number
          youtube_id: string | null
        }
        Insert: {
          bgm_preset?: string | null
          bgm_url?: string | null
          body_html?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          download_count?: number
          external_url?: string | null
          file_mime?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          game_slug?: string | null
          grade_levels?: string[]
          homepage_featured?: boolean
          id?: string
          is_published?: boolean
          item_type: Database["public"]["Enums"]["edu_hub_item_type"]
          library_pin_order?: number
          library_pinned?: boolean
          owner_staff_id: string
          quest_min_score?: number | null
          sort_order?: number
          subject?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          tracked_game?: boolean
          updated_at?: string
          view_count?: number
          youtube_id?: string | null
        }
        Update: {
          bgm_preset?: string | null
          bgm_url?: string | null
          body_html?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          download_count?: number
          external_url?: string | null
          file_mime?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          game_slug?: string | null
          grade_levels?: string[]
          homepage_featured?: boolean
          id?: string
          is_published?: boolean
          item_type?: Database["public"]["Enums"]["edu_hub_item_type"]
          library_pin_order?: number
          library_pinned?: boolean
          owner_staff_id?: string
          quest_min_score?: number | null
          sort_order?: number
          subject?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          tracked_game?: boolean
          updated_at?: string
          view_count?: number
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "educational_hub_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "educational_hub_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "educational_hub_items_owner_staff_id_fkey"
            columns: ["owner_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "educational_hub_items_owner_staff_id_fkey"
            columns: ["owner_staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      educational_hub_profiles: {
        Row: {
          accent_color: string | null
          banner_url: string | null
          created_at: string
          external_url: string | null
          hub_bio: string | null
          is_hub_active: boolean
          staff_id: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          banner_url?: string | null
          created_at?: string
          external_url?: string | null
          hub_bio?: string | null
          is_hub_active?: boolean
          staff_id: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          banner_url?: string | null
          created_at?: string
          external_url?: string | null
          hub_bio?: string | null
          is_hub_active?: boolean
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "educational_hub_profiles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "educational_hub_profiles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
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
      emergency_alerts: {
        Row: {
          body: string
          id: string
          line_sent_count: number | null
          push_sent_count: number | null
          sent_at: string
          sent_by: string | null
          severity: string
          target_audience: string
          target_class: string | null
          title: string
          total_targets: number | null
          url: string | null
        }
        Insert: {
          body: string
          id?: string
          line_sent_count?: number | null
          push_sent_count?: number | null
          sent_at?: string
          sent_by?: string | null
          severity: string
          target_audience?: string
          target_class?: string | null
          title: string
          total_targets?: number | null
          url?: string | null
        }
        Update: {
          body?: string
          id?: string
          line_sent_count?: number | null
          push_sent_count?: number | null
          sent_at?: string
          sent_by?: string | null
          severity?: string
          target_audience?: string
          target_class?: string | null
          title?: string
          total_targets?: number | null
          url?: string | null
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
      facebook_feed_config: {
        Row: {
          access_token: string
          created_at: string
          enabled: boolean
          id: string
          last_error: string | null
          last_fetched_at: string | null
          last_status: string | null
          page_id: string
          page_name: string | null
          page_url: string | null
          posts_count: number
          refresh_interval_hours: number
          sync_to_news: boolean
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_status?: string | null
          page_id: string
          page_name?: string | null
          page_url?: string | null
          posts_count?: number
          refresh_interval_hours?: number
          sync_to_news?: boolean
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_status?: string | null
          page_id?: string
          page_name?: string | null
          page_url?: string | null
          posts_count?: number
          refresh_interval_hours?: number
          sync_to_news?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      facebook_posts: {
        Row: {
          attachments: Json | null
          created_time: string
          fetched_at: string
          full_picture: string | null
          id: string
          message: string | null
          news_synced: boolean
          permalink_url: string
        }
        Insert: {
          attachments?: Json | null
          created_time: string
          fetched_at?: string
          full_picture?: string | null
          id: string
          message?: string | null
          news_synced?: boolean
          permalink_url: string
        }
        Update: {
          attachments?: Json | null
          created_time?: string
          fetched_at?: string
          full_picture?: string | null
          id?: string
          message?: string | null
          news_synced?: boolean
          permalink_url?: string
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
      game_achievements_catalog: {
        Row: {
          code: string
          created_at: string
          description_th: string | null
          game_slug: string | null
          icon: string | null
          id: string
          sort_order: number
          subject_key: string | null
          threshold_kind: string
          threshold_value: number | null
          tier: string
          title_th: string
          xp_bonus: number
        }
        Insert: {
          code: string
          created_at?: string
          description_th?: string | null
          game_slug?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          subject_key?: string | null
          threshold_kind: string
          threshold_value?: number | null
          tier?: string
          title_th: string
          xp_bonus?: number
        }
        Update: {
          code?: string
          created_at?: string
          description_th?: string | null
          game_slug?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          subject_key?: string | null
          threshold_kind?: string
          threshold_value?: number | null
          tier?: string
          title_th?: string
          xp_bonus?: number
        }
        Relationships: []
      }
      game_bgm_tracks: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          storage_path: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          storage_path: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          storage_path?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      game_docs: {
        Row: {
          created_at: string
          features: string[]
          game_format: string | null
          id: string
          item_id: string
          notes: string | null
          owner_staff_id: string
          updated_at: string
          updated_by: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          features?: string[]
          game_format?: string | null
          id?: string
          item_id: string
          notes?: string | null
          owner_staff_id: string
          updated_at?: string
          updated_by?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          features?: string[]
          game_format?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          owner_staff_id?: string
          updated_at?: string
          updated_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_docs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "educational_hub_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_docs_owner_staff_id_fkey"
            columns: ["owner_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_docs_owner_staff_id_fkey"
            columns: ["owner_staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      english_quest_lessons: {
        Row: {
          id: string
          lesson_no: number
          sort_order: number
          title_th: string
          world_id: string
        }
        Insert: {
          id?: string
          lesson_no: number
          sort_order?: number
          title_th: string
          world_id: string
        }
        Update: {
          id?: string
          lesson_no?: number
          sort_order?: number
          title_th?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_quest_lessons_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "english_quest_worlds"
            referencedColumns: ["id"]
          }
        ]
      }
      english_quest_progress: {
        Row: {
          current_world_id: string | null
          lesson_stars: Json
          mascot_name: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          current_world_id?: string | null
          lesson_stars?: Json
          mascot_name?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          current_world_id?: string | null
          lesson_stars?: Json
          mascot_name?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      english_quest_words: {
        Row: {
          emoji: string | null
          example_en: string | null
          id: string
          lesson_id: string
          meaning_th: string
          part_of_speech: string | null
          sort_order: number
          word_en: string
        }
        Insert: {
          emoji?: string | null
          example_en?: string | null
          id?: string
          lesson_id: string
          meaning_th: string
          part_of_speech?: string | null
          sort_order?: number
          word_en: string
        }
        Update: {
          emoji?: string | null
          example_en?: string | null
          id?: string
          lesson_id?: string
          meaning_th?: string
          part_of_speech?: string | null
          sort_order?: number
          word_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_quest_words_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "english_quest_lessons"
            referencedColumns: ["id"]
          }
        ]
      }
      english_quest_worlds: {
        Row: {
          color: string | null
          created_at: string
          icon_emoji: string | null
          id: string
          sort_order: number
          theme: string | null
          title_en: string
          title_th: string
          world_key: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon_emoji?: string | null
          id?: string
          sort_order?: number
          theme?: string | null
          title_en: string
          title_th: string
          world_key: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon_emoji?: string | null
          id?: string
          sort_order?: number
          theme?: string | null
          title_en?: string
          title_th?: string
          world_key?: string
        }
        Relationships: []
      }
      game_score_baseline: {
        Row: {
          game_slug: string
          median_score: number | null
          p75_score: number | null
          p90_score: number | null
          sample_count: number
          updated_at: string
        }
        Insert: {
          game_slug: string
          median_score?: number | null
          p75_score?: number | null
          p90_score?: number | null
          sample_count?: number
          updated_at?: string
        }
        Update: {
          game_slug?: string
          median_score?: number | null
          p75_score?: number | null
          p90_score?: number | null
          sample_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          academic_year: string | null
          created_at: string
          duration_sec: number | null
          edu_hub_item_id: string | null
          game_slug: string
          id: string
          metadata: Json
          mode: string | null
          pushed_to_score_record_id: string | null
          score: number
          semester: string | null
          student_id: string
          xp_earned: number
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          duration_sec?: number | null
          edu_hub_item_id?: string | null
          game_slug: string
          id?: string
          metadata?: Json
          mode?: string | null
          pushed_to_score_record_id?: string | null
          score: number
          semester?: string | null
          student_id: string
          xp_earned?: number
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          duration_sec?: number | null
          edu_hub_item_id?: string | null
          game_slug?: string
          id?: string
          metadata?: Json
          mode?: string | null
          pushed_to_score_record_id?: string | null
          score?: number
          semester?: string | null
          student_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_edu_hub_item_id_fkey"
            columns: ["edu_hub_item_id"]
            isOneToOne: false
            referencedRelation: "educational_hub_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_pushed_to_score_record_id_fkey"
            columns: ["pushed_to_score_record_id"]
            isOneToOne: false
            referencedRelation: "score_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      game_student_achievements: {
        Row: {
          achievement_id: string
          id: string
          session_id: string | null
          student_id: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          id?: string
          session_id?: string | null
          student_id: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          id?: string
          session_id?: string | null
          student_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "game_achievements_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_student_achievements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "game_student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
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
          image_fit: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          order_position: number | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_fit?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          order_position?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_fit?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          order_position?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      ics_forms: {
        Row: {
          approved_at: string | null
          content: Json
          created_at: string | null
          fiscal_year: number
          form_type: string
          id: string
          prepared_at: string | null
          prepared_by: string | null
          status: string
          title: string
        }
        Insert: {
          approved_at?: string | null
          content?: Json
          created_at?: string | null
          fiscal_year: number
          form_type: string
          id?: string
          prepared_at?: string | null
          prepared_by?: string | null
          status?: string
          title: string
        }
        Update: {
          approved_at?: string | null
          content?: Json
          created_at?: string | null
          fiscal_year?: number
          form_type?: string
          id?: string
          prepared_at?: string | null
          prepared_by?: string | null
          status?: string
          title?: string
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
          {
            foreignKeyName: "incoming_letters_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      indicator_games: {
        Row: {
          created_at: string
          edu_hub_item_id: string
          indicator_id: string
        }
        Insert: {
          created_at?: string
          edu_hub_item_id: string
          indicator_id: string
        }
        Update: {
          created_at?: string
          edu_hub_item_id?: string
          indicator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicator_games_edu_hub_item_id_fkey"
            columns: ["edu_hub_item_id"]
            isOneToOne: false
            referencedRelation: "educational_hub_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_games_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "curriculum_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_lesson_plans: {
        Row: {
          created_at: string
          indicator_id: string
          lesson_plan_id: string
        }
        Insert: {
          created_at?: string
          indicator_id: string
          lesson_plan_id: string
        }
        Update: {
          created_at?: string
          indicator_id?: string
          lesson_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicator_lesson_plans_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "curriculum_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_lesson_plans_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
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
          {
            foreignKeyName: "leave_balances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
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
          {
            foreignKeyName: "leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
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
          {
            foreignKeyName: "lesson_plans_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      letter_tracking_logs: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: []
      }
      line_message_logs: {
        Row: {
          created_at: string
          direction: string
          error: string | null
          id: string
          line_user_id: string | null
          message_type: string | null
          payload: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          error?: string | null
          id?: string
          line_user_id?: string | null
          message_type?: string | null
          payload?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          error?: string | null
          id?: string
          line_user_id?: string | null
          message_type?: string | null
          payload?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      line_user_links: {
        Row: {
          display_name: string | null
          followed_at: string
          id: string
          is_followed: boolean
          language: string | null
          line_user_id: string
          linked_at: string | null
          picture_url: string | null
          unfollowed_at: string | null
          user_id: string | null
        }
        Insert: {
          display_name?: string | null
          followed_at?: string
          id?: string
          is_followed?: boolean
          language?: string | null
          line_user_id: string
          linked_at?: string | null
          picture_url?: string | null
          unfollowed_at?: string | null
          user_id?: string | null
        }
        Update: {
          display_name?: string | null
          followed_at?: string
          id?: string
          is_followed?: boolean
          language?: string | null
          line_user_id?: string
          linked_at?: string | null
          picture_url?: string | null
          unfollowed_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      multiply_race_mastery: {
        Row: {
          badge_level: number
          correct_count: number
          fastest_avg_ms: number | null
          last_practiced_at: string
          student_id: string
          table_num: number
          wrong_count: number
        }
        Insert: {
          badge_level?: number
          correct_count?: number
          fastest_avg_ms?: number | null
          last_practiced_at?: string
          student_id: string
          table_num: number
          wrong_count?: number
        }
        Update: {
          badge_level?: number
          correct_count?: number
          fastest_avg_ms?: number | null
          last_practiced_at?: string
          student_id?: string
          table_num?: number
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "multiply_race_mastery_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "multiply_race_mastery_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiply_race_mastery_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
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
          source: string | null
          source_fb_post_id: string | null
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
          source?: string | null
          source_fb_post_id?: string | null
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
          source?: string | null
          source_fb_post_id?: string | null
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
      online_match_participants: {
        Row: {
          correct: number
          is_winner: boolean
          match_id: string
          rank: number
          score: number
          session_id: string | null
          student_id: string
        }
        Insert: {
          correct?: number
          is_winner?: boolean
          match_id: string
          rank?: number
          score?: number
          session_id?: string | null
          student_id: string
        }
        Update: {
          correct?: number
          is_winner?: boolean
          match_id?: string
          rank?: number
          score?: number
          session_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "online_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_match_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_match_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "online_match_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_match_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      online_matches: {
        Row: {
          created_at: string
          finished_at: string
          game_slug: string
          id: string
          is_decisive: boolean
          is_tournament: boolean
          player_count: number
          room_code: string
          score_spread: number
          started_at: string
          top_score: number
          winner_student_id: string | null
        }
        Insert: {
          created_at?: string
          finished_at: string
          game_slug: string
          id?: string
          is_decisive?: boolean
          is_tournament?: boolean
          player_count?: number
          room_code: string
          score_spread?: number
          started_at: string
          top_score?: number
          winner_student_id?: string | null
        }
        Update: {
          created_at?: string
          finished_at?: string
          game_slug?: string
          id?: string
          is_decisive?: boolean
          is_tournament?: boolean
          player_count?: number
          room_code?: string
          score_spread?: number
          started_at?: string
          top_score?: number
          winner_student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "online_matches_winner_student_id_fkey"
            columns: ["winner_student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "online_matches_winner_student_id_fkey"
            columns: ["winner_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_matches_winner_student_id_fkey"
            columns: ["winner_student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
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
          {
            foreignKeyName: "pa_assessments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
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
      parent_student_links: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          relation: string | null
          student_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          relation?: string | null
          student_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          relation?: string | null
          student_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          link_url: string | null
          logo_url: string | null
          name: string
          order_position: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          logo_url?: string | null
          name: string
          order_position?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          logo_url?: string | null
          name?: string
          order_position?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pdpa_consents: {
        Row: {
          granted: boolean
          granted_at: string
          id: string
          notes: string | null
          revoked_at: string | null
          scope: string
          source: string | null
          student_id: string | null
          user_id: string | null
        }
        Insert: {
          granted: boolean
          granted_at?: string
          id?: string
          notes?: string | null
          revoked_at?: string | null
          scope: string
          source?: string | null
          student_id?: string | null
          user_id?: string | null
        }
        Update: {
          granted?: boolean
          granted_at?: string
          id?: string
          notes?: string | null
          revoked_at?: string | null
          scope?: string
          source?: string | null
          student_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdpa_consents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "pdpa_consents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdpa_consents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      pdpa_erasure_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          requester_user_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scope: string
          status: string
          target_student_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          requester_user_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope: string
          status?: string
          target_student_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          requester_user_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope?: string
          status?: string
          target_student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdpa_erasure_requests_target_student_id_fkey"
            columns: ["target_student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "pdpa_erasure_requests_target_student_id_fkey"
            columns: ["target_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdpa_erasure_requests_target_student_id_fkey"
            columns: ["target_student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      pickup_log: {
        Row: {
          action: string
          id: string
          notes: string | null
          pickup_person_id: string | null
          pickup_person_name_snapshot: string
          pickup_person_relation_snapshot: string | null
          recorded_at: string
          recorded_by: string | null
          student_id: string
        }
        Insert: {
          action: string
          id?: string
          notes?: string | null
          pickup_person_id?: string | null
          pickup_person_name_snapshot: string
          pickup_person_relation_snapshot?: string | null
          recorded_at?: string
          recorded_by?: string | null
          student_id: string
        }
        Update: {
          action?: string
          id?: string
          notes?: string | null
          pickup_person_id?: string | null
          pickup_person_name_snapshot?: string
          pickup_person_relation_snapshot?: string | null
          recorded_at?: string
          recorded_by?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_log_pickup_person_id_fkey"
            columns: ["pickup_person_id"]
            isOneToOne: false
            referencedRelation: "pickup_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "pickup_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      pickup_persons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          name: string
          national_id_last4: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          relation: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name: string
          national_id_last4?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          relation: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name?: string
          national_id_last4?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          relation?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_persons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "pickup_persons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_persons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          failed_count: number
          id: string
          last_used_at: string | null
          p256dh: string
          topics: string[]
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          failed_count?: number
          id?: string
          last_used_at?: string | null
          p256dh: string
          topics?: string[]
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          failed_count?: number
          id?: string
          last_used_at?: string | null
          p256dh?: string
          topics?: string[]
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reward_claims: {
        Row: {
          academic_year: string | null
          approved_by_administrator_id: string | null
          approved_by_staff_id: string | null
          balance_after: number | null
          claimed_at: string | null
          id: string
          points_used: number
          quantity: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reward_id: string
          reward_name: string
          semester: string | null
          status: Database["public"]["Enums"]["reward_claim_status"] | null
          student_id: string
        }
        Insert: {
          academic_year?: string | null
          approved_by_administrator_id?: string | null
          approved_by_staff_id?: string | null
          balance_after?: number | null
          claimed_at?: string | null
          id?: string
          points_used: number
          quantity?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_id: string
          reward_name: string
          semester?: string | null
          status?: Database["public"]["Enums"]["reward_claim_status"] | null
          student_id: string
        }
        Update: {
          academic_year?: string | null
          approved_by_administrator_id?: string | null
          approved_by_staff_id?: string | null
          balance_after?: number | null
          claimed_at?: string | null
          id?: string
          points_used?: number
          quantity?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_id?: string
          reward_name?: string
          semester?: string | null
          status?: Database["public"]["Enums"]["reward_claim_status"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_claims_approved_by_administrator_id_fkey"
            columns: ["approved_by_administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_claims_approved_by_staff_id_fkey"
            columns: ["approved_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_claims_approved_by_staff_id_fkey"
            columns: ["approved_by_staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
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
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
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
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          order_position: number | null
          owner_administrator_id: string | null
          owner_staff_id: string | null
          points_cost: number
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          order_position?: number | null
          owner_administrator_id?: string | null
          owner_staff_id?: string | null
          points_cost: number
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          order_position?: number | null
          owner_administrator_id?: string | null
          owner_staff_id?: string | null
          points_cost?: number
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_owner_administrator_id_fkey"
            columns: ["owner_administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_owner_staff_id_fkey"
            columns: ["owner_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_owner_staff_id_fkey"
            columns: ["owner_staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      sar_assessments: {
        Row: {
          academic_year: number
          assessor_name: string | null
          evidence_summary: string | null
          id: string
          indicator_id: string
          level: number | null
          updated_at: string | null
        }
        Insert: {
          academic_year: number
          assessor_name?: string | null
          evidence_summary?: string | null
          id?: string
          indicator_id: string
          level?: number | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: number
          assessor_name?: string | null
          evidence_summary?: string | null
          id?: string
          indicator_id?: string
          level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sar_assessments_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "sar_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      sar_evidence_files: {
        Row: {
          assessment_id: string
          file_name: string | null
          file_url: string
          id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          assessment_id: string
          file_name?: string | null
          file_url: string
          id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          assessment_id?: string
          file_name?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sar_evidence_files_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "sar_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      sar_indicators: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
          standard_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
          standard_id: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          standard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sar_indicators_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "sar_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      sar_standards: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      savings_backups: {
        Row: {
          backup_data: Json
          backup_date: string
          created_at: string
          created_by: string
          id: string
          total_balance: number
          total_savers: number
        }
        Insert: {
          backup_data?: Json
          backup_date?: string
          created_at?: string
          created_by?: string
          id?: string
          total_balance?: number
          total_savers?: number
        }
        Update: {
          backup_data?: Json
          backup_date?: string
          created_at?: string
          created_by?: string
          id?: string
          total_balance?: number
          total_savers?: number
        }
        Relationships: []
      }
      savings_transactions: {
        Row: {
          academic_year: string | null
          amount: number
          balance_after: number | null
          created_at: string | null
          id: string
          notes: string | null
          recorded_by: string | null
          recorded_by_administrator_id: string | null
          recorded_by_staff_id: string | null
          semester: string | null
          student_class: string | null
          student_id: string | null
          student_name: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          academic_year?: string | null
          amount: number
          balance_after?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          recorded_by_administrator_id?: string | null
          recorded_by_staff_id?: string | null
          semester?: string | null
          student_class?: string | null
          student_id?: string | null
          student_name: string
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          academic_year?: string | null
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          recorded_by_administrator_id?: string | null
          recorded_by_staff_id?: string | null
          semester?: string | null
          student_class?: string | null
          student_id?: string | null
          student_name?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_transactions_recorded_by_administrator_id_fkey"
            columns: ["recorded_by_administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_transactions_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_transactions_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "savings_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "savings_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      school_dashboard_entries: {
        Row: {
          category: string
          created_at: string
          description: string | null
          extra_fields: Json
          id: string
          is_sensitive: boolean
          order_position: number
          password: string | null
          table_data: Json | null
          tags: string[]
          title: string
          updated_at: string
          url: string | null
          username: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          extra_fields?: Json
          id?: string
          is_sensitive?: boolean
          order_position?: number
          password?: string | null
          table_data?: Json | null
          tags?: string[]
          title: string
          updated_at?: string
          url?: string | null
          username?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          extra_fields?: Json
          id?: string
          is_sensitive?: boolean
          order_position?: number
          password?: string | null
          table_data?: Json | null
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string | null
          username?: string | null
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
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
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
      shared_quick_menu: {
        Row: {
          id: number
          known_catalog_ids: string[]
          menu_item_ids: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          known_catalog_ids?: string[]
          menu_item_ids?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          known_catalog_ids?: string[]
          menu_item_ids?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      signatures: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          role: string
          signature_url: string
          signed_at: string | null
          signer_name: string
          signer_position: string | null
          signer_user_id: string | null
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          role?: string
          signature_url: string
          signed_at?: string | null
          signer_name: string
          signer_position?: string | null
          signer_user_id?: string | null
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          role?: string
          signature_url?: string
          signed_at?: string | null
          signer_name?: string
          signer_position?: string | null
          signer_user_id?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          academic_rank: string | null
          created_at: string | null
          degree: string | null
          department: string | null
          education: string | null
          email: string | null
          experience: string | null
          extra_info: Json | null
          id: string
          major: string | null
          name: string
          order_position: number | null
          phone: string | null
          photo_url: string | null
          position: string
          staff_type: string
          subject: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          academic_rank?: string | null
          created_at?: string | null
          degree?: string | null
          department?: string | null
          education?: string | null
          email?: string | null
          experience?: string | null
          extra_info?: Json | null
          id?: string
          major?: string | null
          name: string
          order_position?: number | null
          phone?: string | null
          photo_url?: string | null
          position: string
          staff_type?: string
          subject?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          academic_rank?: string | null
          created_at?: string | null
          degree?: string | null
          department?: string | null
          education?: string | null
          email?: string | null
          experience?: string | null
          extra_info?: Json | null
          id?: string
          major?: string | null
          name?: string
          order_position?: number | null
          phone?: string | null
          photo_url?: string | null
          position?: string
          staff_type?: string
          subject?: string | null
          updated_at?: string | null
          username?: string | null
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
      student_documents: {
        Row: {
          category_key: string
          created_at: string | null
          doc_date: string
          file_url: string | null
          id: string
          notes: string | null
          recorded_by: string | null
          student_id: string
          title: string | null
        }
        Insert: {
          category_key: string
          created_at?: string | null
          doc_date?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          student_id: string
          title?: string | null
        }
        Update: {
          category_key?: string
          created_at?: string | null
          doc_date?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          student_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_growth_measurements: {
        Row: {
          bmi: number | null
          created_at: string
          height_cm: number | null
          id: string
          measured_at: string
          notes: string | null
          recorded_by: string | null
          student_id: string
          weight_kg: number | null
        }
        Insert: {
          bmi?: number | null
          created_at?: string
          height_cm?: number | null
          id?: string
          measured_at: string
          notes?: string | null
          recorded_by?: string | null
          student_id: string
          weight_kg?: number | null
        }
        Update: {
          bmi?: number | null
          created_at?: string
          height_cm?: number | null
          id?: string
          measured_at?: string
          notes?: string | null
          recorded_by?: string | null
          student_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_growth_measurements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_growth_measurements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_growth_measurements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_health_records: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          chronic_conditions: string[] | null
          dental_status: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          medications: string | null
          notes: string | null
          student_id: string
          updated_at: string
          updated_by: string | null
          vision_left: string | null
          vision_right: string | null
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          dental_status?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          medications?: string | null
          notes?: string | null
          student_id: string
          updated_at?: string
          updated_by?: string | null
          vision_left?: string | null
          vision_right?: string | null
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          dental_status?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          medications?: string | null
          notes?: string | null
          student_id?: string
          updated_at?: string
          updated_by?: string | null
          vision_left?: string | null
          vision_right?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_health_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_health_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_health_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_home_visits: {
        Row: {
          created_at: string | null
          findings: string | null
          id: string
          photo_urls: string[] | null
          student_id: string
          visit_date: string
          visitors: string[] | null
        }
        Insert: {
          created_at?: string | null
          findings?: string | null
          id?: string
          photo_urls?: string[] | null
          student_id: string
          visit_date?: string
          visitors?: string[] | null
        }
        Update: {
          created_at?: string | null
          findings?: string | null
          id?: string
          photo_urls?: string[] | null
          student_id?: string
          visit_date?: string
          visitors?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "student_home_visits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_home_visits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_home_visits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_indicator_assessments: {
        Row: {
          academic_year: string
          assessed_by: string | null
          created_at: string
          id: string
          indicator_id: string
          level: number | null
          note: string | null
          semester: string | null
          source: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          assessed_by?: string | null
          created_at?: string
          id?: string
          indicator_id: string
          level?: number | null
          note?: string | null
          semester?: string | null
          source?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          assessed_by?: string | null
          created_at?: string
          id?: string
          indicator_id?: string
          level?: number | null
          note?: string | null
          semester?: string | null
          source?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_indicator_assessments_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "curriculum_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_indicator_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_indicator_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_indicator_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_indicator_events: {
        Row: {
          created_at: string
          event_date: string
          game_slug: string | null
          id: string
          indicator_id: string
          passed: boolean
          score: number | null
          session_id: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string
          game_slug?: string | null
          id?: string
          indicator_id: string
          passed?: boolean
          score?: number | null
          session_id?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          game_slug?: string | null
          id?: string
          indicator_id?: string
          passed?: boolean
          score?: number | null
          session_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_indicator_events_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "curriculum_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_indicator_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_indicator_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_indicator_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_indicator_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_meal_budget: {
        Row: {
          academic_year: number
          id: string
          meal_subsidy: number | null
          milk_subsidy: number | null
          notes: string | null
          period: string
          recorded_at: string | null
          recorded_by: string | null
          student_id: string
        }
        Insert: {
          academic_year: number
          id?: string
          meal_subsidy?: number | null
          milk_subsidy?: number | null
          notes?: string | null
          period: string
          recorded_at?: string | null
          recorded_by?: string | null
          student_id: string
        }
        Update: {
          academic_year?: number
          id?: string
          meal_subsidy?: number | null
          milk_subsidy?: number | null
          notes?: string | null
          period?: string
          recorded_at?: string | null
          recorded_by?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_meal_budget_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_meal_budget_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_meal_budget_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_sdq_responses: {
        Row: {
          academic_year: number
          assessed_at: string | null
          assessor_name: string | null
          id: string
          interpretation: string | null
          scores: Json
          student_id: string
          total_score: number | null
        }
        Insert: {
          academic_year: number
          assessed_at?: string | null
          assessor_name?: string | null
          id?: string
          interpretation?: string | null
          scores?: Json
          student_id: string
          total_score?: number | null
        }
        Update: {
          academic_year?: number
          assessed_at?: string | null
          assessor_name?: string | null
          id?: string
          interpretation?: string | null
          scores?: Json
          student_id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_sdq_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_sdq_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_sdq_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
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
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
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
      student_vaccinations: {
        Row: {
          created_at: string
          dose_number: number | null
          given_by: string | null
          given_date: string
          id: string
          next_dose_date: string | null
          notes: string | null
          student_id: string
          vaccine_name: string
        }
        Insert: {
          created_at?: string
          dose_number?: number | null
          given_by?: string | null
          given_date: string
          id?: string
          next_dose_date?: string | null
          notes?: string | null
          student_id: string
          vaccine_name: string
        }
        Update: {
          created_at?: string
          dose_number?: number | null
          given_by?: string | null
          given_date?: string
          id?: string
          next_dose_date?: string | null
          notes?: string | null
          student_id?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_vaccinations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_vaccinations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_vaccinations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
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
          {
            foreignKeyName: "supervision_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          id: string
          is_required: boolean
          options: Json | null
          order_index: number
          question_text: string
          survey_id: string
          type: string
        }
        Insert: {
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index: number
          question_text: string
          survey_id: string
          type: string
        }
        Update: {
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          question_text?: string
          survey_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answers: Json
          id: string
          respondent_user_id: string | null
          submitted_at: string
          survey_id: string
        }
        Insert: {
          answers: Json
          id?: string
          respondent_user_id?: string | null
          submitted_at?: string
          survey_id: string
        }
        Update: {
          answers?: Json
          id?: string
          respondent_user_id?: string | null
          submitted_at?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          audience: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_anonymous: boolean
          is_published: boolean
          response_count: number
          starts_at: string | null
          target_class: string | null
          title: string
        }
        Insert: {
          audience?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_anonymous?: boolean
          is_published?: boolean
          response_count?: number
          starts_at?: string | null
          target_class?: string | null
          title: string
        }
        Update: {
          audience?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_anonymous?: boolean
          is_published?: boolean
          response_count?: number
          starts_at?: string | null
          target_class?: string | null
          title?: string
        }
        Relationships: []
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
      testimonials: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          order_position: number | null
          quote: string
          rating: number | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_position?: number | null
          quote: string
          rating?: number | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_position?: number | null
          quote?: string
          rating?: number | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticker_items: {
        Row: {
          created_at: string
          end_at: string | null
          id: string
          is_active: boolean
          link: string | null
          sort_order: number
          start_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          id?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          start_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_at?: string | null
          id?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          start_at?: string | null
          title?: string
          updated_at?: string
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
          {
            foreignKeyName: "training_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      user_dashboard_layout: {
        Row: {
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: []
      }
      user_menu_permissions: {
        Row: {
          created_at: string
          menu_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          menu_ids?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          menu_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quick_menu_preferences: {
        Row: {
          context: string
          menu_item_ids: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context: string
          menu_item_ids?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context?: string
          menu_item_ids?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          administrator_id: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          staff_id: string | null
          student_id: string | null
          user_id: string | null
        }
        Insert: {
          administrator_id?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          staff_id?: string | null
          student_id?: string | null
          user_id?: string | null
        }
        Update: {
          administrator_id?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          staff_id?: string | null
          student_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "user_roles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
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
          academic_year: string | null
          category_id: string
          created_at: string | null
          id: string
          notes: string | null
          points_earned: number
          quantity: number
          recorded_by: string | null
          recorded_by_administrator_id: string | null
          recorded_by_staff_id: string | null
          semester: string | null
          student_class: string | null
          student_id: string | null
          student_name: string
          transaction_date: string | null
        }
        Insert: {
          academic_year?: string | null
          category_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          points_earned: number
          quantity: number
          recorded_by?: string | null
          recorded_by_administrator_id?: string | null
          recorded_by_staff_id?: string | null
          semester?: string | null
          student_class?: string | null
          student_id?: string | null
          student_name: string
          transaction_date?: string | null
        }
        Update: {
          academic_year?: string | null
          category_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          points_earned?: number
          quantity?: number
          recorded_by?: string | null
          recorded_by_administrator_id?: string | null
          recorded_by_staff_id?: string | null
          semester?: string | null
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
            foreignKeyName: "waste_transactions_recorded_by_administrator_id_fkey"
            columns: ["recorded_by_administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_transactions_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_transactions_recorded_by_staff_id_fkey"
            columns: ["recorded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "waste_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
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
      game_student_stats: {
        Row: {
          first_5_avg: number | null
          first_played_at: string | null
          game_slug: string | null
          last_5_avg: number | null
          last_played_at: string | null
          personal_best: number | null
          plays_count: number | null
          student_id: string | null
          total_xp: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      savings_student_summary: {
        Row: {
          class_name: string | null
          current_balance: number | null
          deposit_count: number | null
          full_name: string | null
          photo_url: string | null
          student_code: string | null
          student_id: string | null
          total_deposits: number | null
          total_transactions: number | null
          total_withdrawals: number | null
          withdraw_count: number | null
        }
        Relationships: []
      }
      student_global_profile: {
        Row: {
          active_days: number | null
          games_played: number | null
          last_played_at: string | null
          plays_count: number | null
          student_id: string | null
          total_xp: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_latest_growth: {
        Row: {
          bmi: number | null
          height_cm: number | null
          measured_at: string | null
          student_id: string | null
          weight_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_growth_measurements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_growth_measurements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_growth_measurements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_subject_xp: {
        Row: {
          student_id: string | null
          subject_key: string | null
          xp: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "savings_student_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "waste_student_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      training_per_staff_view: {
        Row: {
          academic_year_be: number | null
          certificate_url: string | null
          course_name: string | null
          created_at: string | null
          end_date: string | null
          hours: number | null
          id: string | null
          provider: string | null
          staff_id: string | null
          start_date: string | null
          training_type: string | null
        }
        Insert: {
          academic_year_be?: never
          certificate_url?: string | null
          course_name?: string | null
          created_at?: string | null
          end_date?: string | null
          hours?: number | null
          id?: string | null
          provider?: string | null
          staff_id?: string | null
          start_date?: string | null
          training_type?: string | null
        }
        Update: {
          academic_year_be?: never
          certificate_url?: string | null
          course_name?: string | null
          created_at?: string | null
          end_date?: string | null
          hours?: number | null
          id?: string | null
          provider?: string | null
          staff_id?: string | null
          start_date?: string | null
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
          {
            foreignKeyName: "training_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_educational_hub_teachers"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      training_public_view: {
        Row: {
          academic_year_be: number | null
          certificate_url: string | null
          course_name: string | null
          created_at: string | null
          end_date: string | null
          hours: number | null
          id: string | null
          provider: string | null
          start_date: string | null
          training_type: string | null
        }
        Insert: {
          academic_year_be?: never
          certificate_url?: string | null
          course_name?: string | null
          created_at?: string | null
          end_date?: string | null
          hours?: number | null
          id?: string | null
          provider?: string | null
          start_date?: string | null
          training_type?: string | null
        }
        Update: {
          academic_year_be?: never
          certificate_url?: string | null
          course_name?: string | null
          created_at?: string | null
          end_date?: string | null
          hours?: number | null
          id?: string | null
          provider?: string | null
          start_date?: string | null
          training_type?: string | null
        }
        Relationships: []
      }
      v_aggregated_calendar: {
        Row: {
          end_date: string | null
          location: string | null
          source: string | null
          source_id: string | null
          start_date: string | null
          title: string | null
        }
        Relationships: []
      }
      v_budget_summary: {
        Row: {
          allocated: number | null
          category_id: string | null
          code: string | null
          committed: number | null
          fiscal_year: number | null
          name: string | null
          paid: number | null
          refunded: number | null
          remaining: number | null
        }
        Relationships: []
      }
      v_docs_hub_kpi: {
        Row: {
          active_this_month: number | null
          outgoing_this_month: number | null
          pending_count: number | null
          training_this_month: number | null
          upcoming_meetings: number | null
          urgent_count: number | null
        }
        Relationships: []
      }
      v_educational_hub_teachers: {
        Row: {
          accent_color: string | null
          banner_url: string | null
          counts_by_category: Json | null
          department: string | null
          external_url: string | null
          hub_bio: string | null
          is_hub_active: boolean | null
          last_item_at: string | null
          name: string | null
          order_position: number | null
          photo_url: string | null
          position: string | null
          staff_id: string | null
          subject: string | null
          total_items: number | null
          username: string | null
        }
        Relationships: []
      }
      v_recent_documents_unified: {
        Row: {
          entity_id: string | null
          entity_type: string | null
          event_at: string | null
          staff_id: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
      v_student_indicator_mastery: {
        Row: {
          any_passed: boolean | null
          assessed_level: number | null
          assessed_source: string | null
          attempts: number | null
          best_score: number | null
          indicator_id: string | null
          last_event: string | null
          status: string | null
          student_id: string | null
        }
        Relationships: []
      }
      v_urgent_documents: {
        Row: {
          badge: string | null
          created_at: string | null
          doc_date: string | null
          due_date: string | null
          entity_id: string | null
          entity_type: string | null
          staff_id: string | null
          status: string | null
          subtitle: string | null
          title: string | null
        }
        Relationships: []
      }
      waste_student_summary: {
        Row: {
          available_points: number | null
          class_name: string | null
          full_name: string | null
          photo_url: string | null
          student_code: string | null
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
      english_quest_complete_lesson: {
        Args: {
          p_student_code: string
          p_lesson_id: string
          p_correct: number
          p_total: number
        }
        Returns: Json
      }
      english_quest_get_state: {
        Args: { p_student_code: string }
        Returns: Json
      }
      english_quest_set_mascot: {
        Args: { p_student_code: string; p_name: string }
        Returns: Json
      }
      active_term: {
        Args: never
        Returns: {
          sem: string
          year: string
        }[]
      }
      add_tracking_note: {
        Args: { p_entity_id: string; p_entity_type: string; p_note: string }
        Returns: string
      }
      admin_reset_game_sessions: {
        Args: { p_game_slug: string; p_student_id?: string }
        Returns: Json
      }
      admin_set_reward_stock: {
        Args: { p_new_stock: number; p_reward_id: string }
        Returns: number
      }
      approve_reward_claim: { Args: { p_claim_id: string }; Returns: undefined }
      auth_role: { Args: never; Returns: string }
      bkk_today: { Args: never; Returns: string }
      can_approve_reward: { Args: { p_reward_id: string }; Returns: boolean }
      claim_reward: {
        Args: { p_code: string; p_quantity?: number; p_reward_id: string }
        Returns: string
      }
      get_daily_challenge_leaderboard: {
        Args: { p_game_slug: string; p_limit?: number; p_student_code?: string }
        Returns: {
          class_label: string
          completed_at: string
          correct_count: number
          display_name: string
          duration_sec: number
          is_me: boolean
          photo_url: string
          rank: number
          score: number
          student_id: string
        }[]
      }
      get_daily_quest_overview: { Args: { p_date?: string }; Returns: Json }
      get_daily_quest_participation: {
        Args: { p_date?: string }
        Returns: {
          all_complete: boolean
          class: string
          completed_count: number
          name: string
          photo_url: string
          required_count: number
          student_id: string
          subjects_done: string[]
        }[]
      }
      get_daily_quest_status: {
        Args: { p_student_code: string }
        Returns: Json
      }
      get_daily_quest_streak_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          class: string
          current_streak: number
          name: string
          photo_url: string
          student_id: string
          total_points: number
        }[]
      }
      get_daily_quest_trend: {
        Args: { p_days?: number }
        Returns: {
          all_complete_count: number
          d: string
          participants: number
        }[]
      }
      get_db_size: { Args: never; Returns: number }
      get_facebook_feed_meta: {
        Args: never
        Returns: {
          enabled: boolean
          last_fetched_at: string
          last_status: string
          page_name: string
          page_url: string
          posts_count: number
          refresh_interval_hours: number
          sync_to_news: boolean
        }[]
      }
      get_game_leaderboard: {
        Args: { p_game_slug: string; p_limit?: number }
        Returns: {
          class_label: string
          display_name: string
          last_played_at: string
          personal_best: number
          photo_url: string
          plays_count: number
          student_id: string
          total_xp: number
        }[]
      }
      get_global_xp_leaderboard: {
        Args: { p_limit?: number; p_student_code?: string }
        Returns: {
          class_label: string
          display_name: string
          games_played: number
          is_me: boolean
          medals_count: number
          photo_url: string
          rank: number
          student_id: string
          total_xp: number
        }[]
      }
      get_multiply_race_class_overview: {
        Args: { p_class_filter?: string }
        Returns: {
          badge_bronze: number
          badge_gold: number
          badge_silver: number
          class_label: string
          daily_played_today: boolean
          daily_score_today: number
          display_name: string
          last_played_at: string
          student_code: string
          student_id: string
          total_correct: number
          total_wrong: number
          weakest_table: number
        }[]
      }
      get_multiply_race_mastery: {
        Args: { p_student_code: string }
        Returns: {
          badge_level: number
          correct_count: number
          fastest_avg_ms: number
          table_num: number
          weight: number
          wrong_count: number
        }[]
      }
      get_multiply_race_table_heatmap: {
        Args: { p_class_filter?: string }
        Returns: {
          table_num: number
          total_attempts: number
          total_correct: number
          total_wrong: number
          wrong_pct: number
        }[]
      }
      get_my_daily_status: {
        Args: { p_game_slug: string; p_student_code: string }
        Returns: {
          challenge_date: string
          correct_count: number
          played: boolean
          score: number
        }[]
      }
      get_online_game_stats: {
        Args: { p_days?: number }
        Returns: {
          avg_players: number
          avg_score_spread: number
          blowout_rate: number
          decisive_matches: number
          game_slug: string
          last_played_at: string
          matches: number
          repeat_rate: number
          solo_rate: number
          title: string
          total_participants: number
          unique_players: number
        }[]
      }
      get_online_head_to_head: {
        Args: { p_student_id: string }
        Returns: {
          class: string
          losses: number
          matches: number
          name: string
          opponent_id: string
          photo_url: string
          wins: number
        }[]
      }
      get_online_match_log: {
        Args: { p_game_slug?: string; p_limit?: number }
        Returns: {
          finished_at: string
          game_slug: string
          is_decisive: boolean
          is_tournament: boolean
          match_id: string
          player_count: number
          room_code: string
          standings: Json
          title: string
        }[]
      }
      get_online_overview: { Args: { p_days?: number }; Returns: Json }
      get_online_student_leaderboard: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          class: string
          distinct_opponents: number
          last_played: string
          losses: number
          matches: number
          name: string
          photo_url: string
          student_id: string
          win_rate: number
          wins: number
        }[]
      }
      get_savings_history: {
        Args: { p_code: string; p_limit?: number }
        Returns: {
          academic_year: string
          amount: number
          balance_after: number
          created_at: string
          notes: string
          recorded_by: string
          semester: string
          transaction_date: string
          transaction_type: string
          txn_id: string
        }[]
      }
      get_storage_usage: {
        Args: never
        Returns: {
          bucket_id: string
          file_count: number
          total_bytes: number
        }[]
      }
      get_student_history: {
        Args: { p_code: string; p_limit?: number }
        Returns: {
          academic_year: string
          balance_after: number
          claim_id: string
          claimed_at: string
          points_used: number
          quantity: number
          reward_image: string
          reward_name: string
          semester: string
          status: Database["public"]["Enums"]["reward_claim_status"]
        }[]
      }
      get_student_honor_profile: {
        Args: { p_student_code: string }
        Returns: Json
      }
      get_subject_leaderboard: {
        Args: {
          p_limit?: number
          p_student_code?: string
          p_subject_key: string
        }
        Returns: {
          class_label: string
          display_name: string
          is_me: boolean
          photo_url: string
          rank: number
          student_id: string
          xp: number
        }[]
      }
      get_training_public_aggregate: { Args: never; Returns: Json }
      get_weekly_xp_leaderboard: {
        Args: { p_limit?: number; p_student_code?: string }
        Returns: {
          class_label: string
          display_name: string
          is_me: boolean
          photo_url: string
          rank: number
          student_id: string
          weekly_plays: number
          weekly_xp: number
        }[]
      }
      grade_from_class: { Args: { p_class: string }; Returns: string }
      has_menu_permission: { Args: { menu_id: string }; Returns: boolean }
      increment_ehi_download: { Args: { p_id: string }; Returns: undefined }
      increment_ehi_view: { Args: { p_id: string }; Returns: undefined }
      increment_news_view: { Args: { news_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      line_ids_for_users: {
        Args: { p_user_ids: string[] }
        Returns: {
          line_user_id: string
          user_id: string
        }[]
      }
      log_data_access: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
          p_subject_student_id?: string
          p_subject_user_id?: string
        }
        Returns: string
      }
      lookup_savings_balance: {
        Args: { p_code: string }
        Returns: {
          class_name: string
          current_balance: number
          full_name: string
          photo_url: string
          student_id: string
        }[]
      }
      lookup_student_balance: {
        Args: { p_code: string }
        Returns: {
          available_points: number
          class_name: string
          full_name: string
          photo_url: string
          student_id: string
        }[]
      }
      lookup_student_for_game: {
        Args: { p_student_code: string }
        Returns: {
          class_label: string
          display_name: string
          id: string
          photo_url: string
        }[]
      }
      my_children: {
        Args: never
        Returns: {
          class: string
          class_number: number
          id: string
          is_primary: boolean
          name: string
          photo_url: string
          room: string
          student_code: string
        }[]
      }
      next_incoming_number: { Args: never; Returns: string }
      next_outgoing_number: { Args: never; Returns: string }
      parents_of_student: {
        Args: { p_student_id: string }
        Returns: {
          user_id: string
        }[]
      }
      push_game_session_to_score_records: {
        Args: {
          p_academic_year: string
          p_max_score: number
          p_normalized_score: number
          p_score_type: string
          p_semester: string
          p_session_id: string
        }
        Returns: string
      }
      recompute_online_match: {
        Args: { p_match_id: string }
        Returns: undefined
      }
      record_game_session: {
        Args: {
          p_duration_sec?: number
          p_game_slug: string
          p_metadata?: Json
          p_mode?: string
          p_score: number
          p_student_code: string
        }
        Returns: Json
      }
      refresh_game_score_baseline: {
        Args: { p_game_slug: string }
        Returns: undefined
      }
      reject_reward_claim: {
        Args: { p_claim_id: string; p_reason?: string }
        Returns: undefined
      }
      subject_keys: { Args: { p_subject: string }; Returns: string[] }
      submit_daily_challenge_score: {
        Args: {
          p_correct: number
          p_duration_sec?: number
          p_game_slug: string
          p_score: number
          p_student_code: string
          p_total?: number
        }
        Returns: {
          challenge_date: string
          correct_count: number
          score: number
          was_first: boolean
        }[]
      }
      update_multiply_race_mastery: {
        Args: { p_per_table: Json; p_student_code: string }
        Returns: undefined
      }
    }
    Enums: {
      edu_hub_item_type: "file" | "link" | "youtube" | "text"
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
      edu_hub_item_type: ["file", "link", "youtube", "text"],
      reward_claim_status: ["pending", "approved", "rejected"],
      user_role: ["admin", "teacher", "viewer", "parent"],
    },
  },
} as const
