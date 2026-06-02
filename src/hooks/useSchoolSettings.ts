import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SocialLink {
    platform: string;
    url: string;
}

export interface SchoolSettings {
    // ข้อมูลทั่วไป
    school_logo_url: string;
    school_name: string;
    school_tagline: string;
    school_description: string;
    school_vision: string;
    school_mission: string;
    school_values: string;
    school_history: string;

    // Hero Section
    hero_image_url: string;
    hero_badge: string;
    hero_title_1: string;
    hero_title_2: string;

    // สถิติ (Hero)
    stat_students: string;
    stat_students_label: string;
    stat_university: string;
    stat_university_label: string;
    stat_years: string;
    stat_years_label: string;

    // Section Headers
    about_title_1: string;
    about_title_2: string;
    curriculum_title_1: string;
    curriculum_title_2: string;
    curriculum_description: string;
    curriculum_study_time: string;
    curriculum_class_size: string;
    curriculum_duration: string;
    curriculum_duration_label: string;

    // About Stats
    about_stat_1: string;
    about_stat_1_label: string;
    about_stat_2: string;
    about_stat_2_label: string;
    about_stat_3: string;
    about_stat_3_label: string;
    about_stat_4: string;
    about_stat_4_label: string;

    // ข้อมูลติดต่อ
    contact_address: string;
    contact_phone: string;
    contact_email: string;
    contact_hours: string;
    google_maps_embed: string;

    // Social Media (ใช้ social_links เป็นระบบเดียว)
    social_links: SocialLink[];

    // Footer Services
    footer_service_1_name: string;
    footer_service_1_url: string;
    footer_service_2_name: string;
    footer_service_2_url: string;
    footer_service_3_name: string;
    footer_service_3_url: string;
    footer_service_4_name: string;
    footer_service_4_url: string;
    academic_calendar_url: string;
    academic_year: string;

    // Hero Slideshow
    hero_slide_interval: string;

    // Homepage Layout
    homepage_main_sections: string;
    homepage_right_widgets: string;
    homepage_layout_raw: string;
    homepage_mobile_layout: string;

    // Homepage Content (v1.7.1 — block-level CMS)
    intro_video_url: string;
    intro_video_thumbnail: string;
    quicklinks_json: string;
    obec_links_visible: string;

    // ปรัชญา คำขวัญ อัตลักษณ์ (v1.7.2)
    school_philosophy: string;
    school_philosophy_translation: string;
    school_motto: string;
    school_identity: string;

    // About page cards
    school_excellence: string;
    vision_image_url: string;
    vision_text_align: string;
    vision_bg_color: string;
    mission_image_url: string;
    mission_text_align: string;
    mission_bg_color: string;
    values_image_url: string;
    values_text_align: string;
    values_bg_color: string;
    excellence_image_url: string;
    excellence_text_align: string;
    excellence_bg_color: string;

    // News Ticker
    ticker_speed_seconds: string;
    ticker_gap_px: string;
    ticker_pause_on_hover: string;

    // หน้าเกียรติบัตร — วิวเริ่มต้นที่แอดมินตั้งให้ทุกคน ('auto' = ใช้ค่าเริ่มต้นเดิมของแต่ละหน้า)
    cert_default_view: string;
}

const defaultSettings: SchoolSettings = {
    school_logo_url: '',
    school_name: 'โรงเรียนบ้านคำไผ่',
    school_tagline: 'ก้าวสู่อนาคตด้วยปัญญา',
    school_description: 'สถาบันการศึกษาชั้นนำระดับมัธยมศึกษา มุ่งมั่นพัฒนาผู้เรียนให้มีความเป็นเลิศทางวิชาการ',
    school_vision: 'มุ่งมั่นพัฒนาผู้เรียนให้มีความเป็นเลิศทางวิชาการ มีคุณธรรม จริยธรรม',
    school_mission: 'จัดการศึกษาที่มีคุณภาพ พัฒนาครูและบุคลากร',
    school_values: 'ซื่อสัตย์ วินัย ใฝ่เรียนรู้',
    school_history: 'ก่อตั้งเมื่อปี พ.ศ. 2517',
    hero_image_url: '',
    hero_badge: 'เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2568',
    hero_title_1: 'ก้าวสู่อนาคต',
    hero_title_2: 'ด้วยปัญญา',
    stat_students: '2,500+',
    stat_students_label: 'นักเรียน',
    stat_university: '98%',
    stat_university_label: 'ผ่านเข้ามหาวิทยาลัย',
    stat_years: '50+',
    stat_years_label: 'ปีแห่งความเป็นเลิศ',
    about_title_1: 'สถาบันการศึกษาที่',
    about_title_2: 'ไว้วางใจ',
    curriculum_title_1: 'หลักสูตรที่',
    curriculum_title_2: 'หลากหลาย',
    curriculum_description: 'เราออกแบบหลักสูตรที่ตอบโจทย์ความสนใจและเป้าหมายของนักเรียนทุกคน พร้อมทีมครูผู้เชี่ยวชาญในแต่ละสาขา',
    curriculum_study_time: '07:30 - 15:30',
    curriculum_class_size: '30-35 คน',
    curriculum_duration: '6 ปี',
    curriculum_duration_label: 'ระยะเวลาหลักสูตร (ม.1-ม.6)',
    about_stat_1: '50+',
    about_stat_1_label: 'ปีแห่งประสบการณ์',
    about_stat_2: '2,500+',
    about_stat_2_label: 'นักเรียนปัจจุบัน',
    about_stat_3: '200+',
    about_stat_3_label: 'บุคลากรคุณภาพ',
    about_stat_4: '15,000+',
    about_stat_4_label: 'ศิษย์เก่าทั่วประเทศ',
    contact_address: '123 ถนนการศึกษา แขวงวิทยาคม เขตพัฒนา กรุงเทพฯ 10XXX',
    contact_phone: '02-XXX-XXXX',
    contact_email: 'info@bankamphai.ac.th',
    contact_hours: 'จันทร์ - ศุกร์ 07:30 - 16:30 น.',
    google_maps_embed: '',
    footer_service_1_name: 'ระบบรับสมัคร',
    footer_service_1_url: '#',
    footer_service_2_name: 'ตรวจสอบผลการเรียน',
    footer_service_2_url: '#',
    footer_service_3_name: 'ปฏิทินการศึกษา',
    footer_service_3_url: '#',
    footer_service_4_name: 'ดาวน์โหลดเอกสาร',
    footer_service_4_url: '#',
    academic_calendar_url: '',
    academic_year: '2568',
    social_links: [],

    // ปรัชญา คำขวัญ อัตลักษณ์ (v1.7.2)
    school_philosophy: 'นัตถิ ปัญญา สมา อาภา',
    school_philosophy_translation: 'แสงสว่างเสมอด้วยปัญญาไม่มี',
    school_motto: 'เรียนดี มีคุณธรรม',
    school_identity: 'ยิ้มง่าย ไหว้สวย',

    // About page cards
    school_excellence: 'มุ่งมั่นสู่ความเป็นเลิศในทุกด้าน ทั้งวิชาการ กีฬา ศิลปะ และการพัฒนาบุคลิกภาพของผู้เรียน',
    vision_image_url: '',
    vision_text_align: 'left',
    vision_bg_color: '',
    mission_image_url: '',
    mission_text_align: 'left',
    mission_bg_color: '',
    values_image_url: '',
    values_text_align: 'left',
    values_bg_color: '',
    excellence_image_url: '',
    excellence_text_align: 'left',
    excellence_bg_color: '',

    // Hero Slideshow
    hero_slide_interval: '5',

    // Homepage Layout
    homepage_main_sections: '["hero","news","about"]',
    homepage_right_widgets: '["categories","gallery","services","social","stats"]',
    homepage_layout_raw: '',
    homepage_mobile_layout: '',

    // Homepage Content (v1.7.1 — block-level CMS)
    intro_video_url: '',
    intro_video_thumbnail: '',
    quicklinks_json: '',
    obec_links_visible: '',

    // News Ticker
    ticker_speed_seconds: '30',
    ticker_gap_px: '60',
    ticker_pause_on_hover: 'true',
    cert_default_view: 'auto',
};

const CACHE_KEY = 'school_settings_cache';

// Function to get cached settings from localStorage
const getCachedSettings = (): SchoolSettings | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error('Error reading cached settings:', error);
    }
    return null;
};

// Function to save settings to localStorage
const saveCacheSettings = (settings: SchoolSettings) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Error caching settings:', error);
    }
};

const fetchSettings = async (): Promise<SchoolSettings> => {
    const { data, error } = await supabase
        .from('school_settings')
        .select('key, value');

    if (error) throw error;

    if (data) {
        // แปลง array เป็น map { key: value }
        const settingsMap: Record<string, string> = {};
        data.forEach((setting: any) => {
            settingsMap[setting.key] = setting.value || '';
        });

        // Map ทุก key อัตโนมัติจาก defaultSettings โดยไม่ต้องเขียนซ้ำทีละบรรทัด
        const newSettings = (Object.keys(defaultSettings) as Array<keyof SchoolSettings>).reduce(
            (acc, key) => {
                if (key === 'social_links') {
                    // social_links เก็บเป็น JSON string ต้อง parse พิเศษ
                    acc[key] = settingsMap.social_links
                        ? JSON.parse(settingsMap.social_links)
                        : defaultSettings.social_links;
                } else if (key === 'homepage_layout_raw') {
                    // homepage_layout_raw maps from the 'homepage_layout' key in DB
                    (acc[key] as string) = settingsMap['homepage_layout'] || '';
                } else {
                    (acc[key] as string) = settingsMap[key] || (defaultSettings[key] as string);
                }
                return acc;
            },
            {} as SchoolSettings
        );

        saveCacheSettings(newSettings);
        return newSettings;
    }

    return defaultSettings;
};

export const useSchoolSettings = () => {
    const queryClient = useQueryClient();

    const { data: settings = getCachedSettings() || defaultSettings, isLoading: loading } = useQuery({
        queryKey: ['school-settings'],
        queryFn: fetchSettings,
        staleTime: 5 * 60 * 1000, // 5 minutes — settings ไม่เปลี่ยนบ่อย
        gcTime: 30 * 60 * 1000,   // 30 minutes cache
        placeholderData: getCachedSettings() || defaultSettings,
    });

    const refetch = () => {
        queryClient.invalidateQueries({ queryKey: ['school-settings'] });
    };

    return { settings, loading, refetch };
};
