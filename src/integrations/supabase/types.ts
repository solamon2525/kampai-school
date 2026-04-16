export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            admissions: {
                Row: {
                    id: string
                    student_name: string
                    student_id_card: string | null
                    birth_date: string | null
                    gender: string | null
                    parent_name: string
                    parent_phone: string
                    parent_email: string | null
                    address: string | null
                    previous_school: string | null
                    grade_applying: string
                    program_applying: string
                    status: string
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_name: string
                    student_id_card?: string | null
                    birth_date?: string | null
                    gender?: string | null
                    parent_name: string
                    parent_phone: string
                    parent_email?: string | null
                    address?: string | null
                    previous_school?: string | null
                    grade_applying: string
                    program_applying: string
                    status?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_name?: string
                    student_id_card?: string | null
                    birth_date?: string | null
                    gender?: string | null
                    parent_name?: string
                    parent_phone?: string
                    parent_email?: string | null
                    address?: string | null
                    previous_school?: string | null
                    grade_applying?: string
                    program_applying?: string
                    status?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            curriculum_programs: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    icon: string | null
                    color: string | null
                    subjects: string[] | null
                    careers: string[] | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    icon?: string | null
                    color?: string | null
                    subjects?: string[] | null
                    careers?: string[] | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    icon?: string | null
                    color?: string | null
                    subjects?: string[] | null
                    careers?: string[] | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            curriculum_activities: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    icon: string | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    icon?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    icon?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            faq: {
                Row: {
                    id: string
                    question: string
                    answer: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    question: string
                    answer: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    question?: string
                    answer?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            milestones: {
                Row: {
                    id: string
                    year: string
                    event: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    year: string
                    event: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    year?: string
                    event?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            facilities: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    icon: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string
                    icon?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string
                    icon?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            administrators: {
                Row: {
                    id: string
                    name: string
                    position: string
                    education: string | null
                    quote: string | null
                    photo_url: string | null
                    order_position: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    position: string
                    education?: string | null
                    quote?: string | null
                    photo_url?: string | null
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    position?: string
                    education?: string | null
                    quote?: string | null
                    photo_url?: string | null
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            albums: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    cover_image: string | null
                    date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    cover_image?: string | null
                    date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    cover_image?: string | null
                    date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            events: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    start_date: string
                    end_date: string | null
                    event_type: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    start_date: string
                    end_date?: string | null
                    event_type?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    start_date?: string
                    end_date?: string | null
                    event_type?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            news: {
                Row: {
                    id: string
                    title: string
                    content: string
                    excerpt: string | null
                    image_url: string | null
                    category: string
                    published: boolean
                    published_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    content: string
                    excerpt?: string | null
                    image_url?: string | null
                    category?: string
                    published?: boolean
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    content?: string
                    excerpt?: string | null
                    image_url?: string | null
                    category?: string
                    published?: boolean
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            photos: {
                Row: {
                    id: string
                    album_id: string
                    image_url: string
                    caption: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    album_id: string
                    image_url: string
                    caption?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    album_id?: string
                    image_url?: string
                    caption?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "photos_album_id_fkey"
                        columns: ["album_id"]
                        isOneToOne: false
                        referencedRelation: "albums"
                        referencedColumns: ["id"]
                    }
                ]
            }
            school_settings: {
                Row: {
                    id: string
                    school_name: string | null
                    school_name_en: string | null
                    slogan: string | null
                    address: string | null
                    phone: string | null
                    email: string | null
                    website: string | null
                    facebook: string | null
                    line_id: string | null
                    vision: string | null
                    mission: string | null
                    logo_url: string | null
                    hero_image_url: string | null
                    about_text: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    school_name?: string | null
                    school_name_en?: string | null
                    slogan?: string | null
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    website?: string | null
                    facebook?: string | null
                    line_id?: string | null
                    vision?: string | null
                    mission?: string | null
                    logo_url?: string | null
                    hero_image_url?: string | null
                    about_text?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    school_name?: string | null
                    school_name_en?: string | null
                    slogan?: string | null
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    website?: string | null
                    facebook?: string | null
                    line_id?: string | null
                    vision?: string | null
                    mission?: string | null
                    logo_url?: string | null
                    hero_image_url?: string | null
                    about_text?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            staff: {
                Row: {
                    id: string
                    name: string
                    position: string
                    department: string | null
                    subject: string | null
                    education: string | null
                    experience: string | null
                    photo_url: string | null
                    staff_type: string
                    order_position: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    position: string
                    department?: string | null
                    subject?: string | null
                    education?: string | null
                    experience?: string | null
                    photo_url?: string | null
                    staff_type?: string
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    position?: string
                    department?: string | null
                    subject?: string | null
                    education?: string | null
                    experience?: string | null
                    photo_url?: string | null
                    staff_type?: string
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            student_achievements: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    year: string | null
                    category: string | null
                    icon: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    year?: string | null
                    category?: string | null
                    icon?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    year?: string | null
                    category?: string | null
                    icon?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: []
            }
            student_activities: {
                Row: {
                    id: string
                    name: string
                    members: number
                    description: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    members?: number
                    description?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    members?: number
                    description?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: []
            }
            student_stats: {
                Row: {
                    id: string
                    label: string
                    value: string
                    icon: string
                    color: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    label: string
                    value: string
                    icon?: string
                    color?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    label?: string
                    value?: string
                    icon?: string
                    color?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            grade_data: {
                Row: {
                    id: string
                    level: string
                    rooms: number
                    students: number
                    boys: number
                    girls: number
                    order_position: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    level: string
                    rooms?: number
                    students?: number
                    boys?: number
                    girls?: number
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    level?: string
                    rooms?: number
                    students?: number
                    boys?: number
                    girls?: number
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            student_council: {
                Row: {
                    id: string
                    name: string
                    position: string
                    class: string | null
                    initial: string | null
                    image_url: string | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    position: string
                    class?: string
                    initial?: string
                    image_url?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    position?: string
                    class?: string
                    initial?: string
                    image_url?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            students: {
                Row: {
                    id: string
                    student_code: string | null
                    name: string
                    title: string | null
                    first_name: string | null
                    last_name: string | null
                    nickname: string | null
                    class: string
                    room: string | null
                    class_number: number | null
                    gender: string | null
                    national_id: string | null
                    birth_date: string | null
                    religion: string | null
                    nationality: string | null
                    blood_type: string | null
                    photo_url: string | null
                    // ที่อยู่ปัจจุบัน
                    current_house_no: string | null
                    current_moo: string | null
                    current_road: string | null
                    current_tambon: string | null
                    current_amphoe: string | null
                    current_province: string | null
                    current_postal_code: string | null
                    current_phone: string | null
                    // ที่อยู่ตามทะเบียนบ้าน
                    registered_house_no: string | null
                    registered_moo: string | null
                    registered_road: string | null
                    registered_tambon: string | null
                    registered_amphoe: string | null
                    registered_province: string | null
                    registered_postal_code: string | null
                    registered_phone: string | null
                    // ครอบครัว
                    father_name: string | null
                    mother_name: string | null
                    guardian_name: string | null
                    guardian_relation: string | null
                    parent_name: string | null
                    parent_phone: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_code?: string | null
                    name: string
                    title?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    nickname?: string | null
                    class: string
                    room?: string | null
                    class_number?: number | null
                    gender?: string | null
                    national_id?: string | null
                    birth_date?: string | null
                    religion?: string | null
                    nationality?: string | null
                    blood_type?: string | null
                    photo_url?: string | null
                    current_house_no?: string | null
                    current_moo?: string | null
                    current_road?: string | null
                    current_tambon?: string | null
                    current_amphoe?: string | null
                    current_province?: string | null
                    current_postal_code?: string | null
                    current_phone?: string | null
                    registered_house_no?: string | null
                    registered_moo?: string | null
                    registered_road?: string | null
                    registered_tambon?: string | null
                    registered_amphoe?: string | null
                    registered_province?: string | null
                    registered_postal_code?: string | null
                    registered_phone?: string | null
                    father_name?: string | null
                    mother_name?: string | null
                    guardian_name?: string | null
                    guardian_relation?: string | null
                    parent_name?: string | null
                    parent_phone?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_code?: string | null
                    name?: string
                    title?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    nickname?: string | null
                    class?: string
                    room?: string | null
                    class_number?: number | null
                    gender?: string | null
                    national_id?: string | null
                    birth_date?: string | null
                    religion?: string | null
                    nationality?: string | null
                    blood_type?: string | null
                    photo_url?: string | null
                    current_house_no?: string | null
                    current_moo?: string | null
                    current_road?: string | null
                    current_tambon?: string | null
                    current_amphoe?: string | null
                    current_province?: string | null
                    current_postal_code?: string | null
                    current_phone?: string | null
                    registered_house_no?: string | null
                    registered_moo?: string | null
                    registered_road?: string | null
                    registered_tambon?: string | null
                    registered_amphoe?: string | null
                    registered_province?: string | null
                    registered_postal_code?: string | null
                    registered_phone?: string | null
                    father_name?: string | null
                    mother_name?: string | null
                    guardian_name?: string | null
                    guardian_relation?: string | null
                    parent_name?: string | null
                    parent_phone?: string | null
                    is_active?: boolean
                    updated_at?: string
                }
                Relationships: []
            }
        }
            score_records: {
                Row: {
                    id: string
                    student_id: string
                    subject: string
                    score_type: string
                    score: number
                    max_score: number
                    semester: string
                    academic_year: string
                    recorded_by: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    subject: string
                    score_type?: string
                    score?: number
                    max_score?: number
                    semester?: string
                    academic_year: string
                    recorded_by?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    subject?: string
                    score_type?: string
                    score?: number
                    max_score?: number
                    semester?: string
                    academic_year?: string
                    recorded_by?: string | null
                    notes?: string | null
                    updated_at?: string
                }
                Relationships: [{ foreignKeyName: "score_records_student_id_fkey"; columns: ["student_id"]; referencedRelation: "students"; referencedColumns: ["id"] }]
            }
            conduct_scores: {
                Row: {
                    id: string
                    student_id: string
                    type: string
                    score: number
                    category: string
                    reason: string
                    recorded_by: string | null
                    academic_year: string
                    semester: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    type: string
                    score?: number
                    category?: string
                    reason: string
                    recorded_by?: string | null
                    academic_year: string
                    semester?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    type?: string
                    score?: number
                    category?: string
                    reason?: string
                    recorded_by?: string | null
                    academic_year?: string
                    semester?: string
                }
                Relationships: [{ foreignKeyName: "conduct_scores_student_id_fkey"; columns: ["student_id"]; referencedRelation: "students"; referencedColumns: ["id"] }]
            }
            waste_categories: {
                Row: {
                    id: string
                    name: string
                    price_per_kg: number
                    icon: string | null
                    color: string | null
                    is_active: boolean | null
                    order_position: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    price_per_kg?: number
                    icon?: string | null
                    color?: string | null
                    is_active?: boolean | null
                    order_position?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    price_per_kg?: number
                    icon?: string | null
                    color?: string | null
                    is_active?: boolean | null
                    order_position?: number | null
                    created_at?: string
                }
                Relationships: []
            }
            waste_transactions: {
                Row: {
                    id: string
                    student_name: string
                    student_class: string
                    student_id: string | null
                    category_id: string | null
                    weight_kg: number
                    amount: number
                    transaction_date: string
                    notes: string | null
                    recorded_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    student_name: string
                    student_class: string
                    student_id?: string | null
                    category_id?: string | null
                    weight_kg: number
                    amount?: number
                    transaction_date?: string
                    notes?: string | null
                    recorded_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    student_name?: string
                    student_class?: string
                    student_id?: string | null
                    category_id?: string | null
                    weight_kg?: number
                    amount?: number
                    transaction_date?: string
                    notes?: string | null
                    recorded_by?: string | null
                    created_at?: string
                }
                Relationships: [
                    { foreignKeyName: "waste_transactions_category_id_fkey"; columns: ["category_id"]; referencedRelation: "waste_categories"; referencedColumns: ["id"] },
                    { foreignKeyName: "waste_transactions_student_id_fkey"; columns: ["student_id"]; referencedRelation: "students"; referencedColumns: ["id"] }
                ]
            }
        }
        Views: {
            waste_student_summary: {
                Row: {
                    student_name: string | null
                    student_class: string | null
                    student_id: string | null
                    photo_url: string | null
                    student_code: string | null
                    total_transactions: number | null
                    total_weight: number | null
                    total_amount: number | null
                    last_transaction_date: string | null
                }
                Relationships: []
            }
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never