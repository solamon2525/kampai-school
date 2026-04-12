import type { Config } from '@measured/puck';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PuckProps = {
    HeroBlock: {
        title: string;
        subtitle: string;
        bgColor: string;
    };
    NewsGridBlock: {
        heading: string;
        maxItems: number;
    };
    AboutSnippetBlock: {
        heading: string;
        body: string;
    };
    GalleryBlock: {
        heading: string;
    };
    ContactBlock: {
        heading: string;
        showMap: boolean;
    };
    DividerBlock: Record<string, never>;
    HeadingBlock: { heading: string; subtitle: string; align: 'left' | 'center' | 'right'; size: 'sm' | 'md' | 'lg' };
    SpacerBlock: { height: number };
    AnnouncementBlock: { text: string; color: 'blue' | 'green' | 'yellow' | 'red'; icon: string };
    StatisticsBlock: {
        heading: string;
        stat1_label: string; stat1_value: string;
        stat2_label: string; stat2_value: string;
        stat3_label: string; stat3_value: string;
        stat4_label: string; stat4_value: string;
    };
    VideoBlock: { heading: string; youtube_url: string; caption: string };
    QuickLinksBlock: {
        heading: string;
        link1_label: string; link1_url: string; link1_icon: string;
        link2_label: string; link2_url: string; link2_icon: string;
        link3_label: string; link3_url: string; link3_icon: string;
        link4_label: string; link4_url: string; link4_icon: string;
    };
    EventsBlock: { heading: string; maxItems: number };
    DocumentsBlock: { heading: string; maxItems: number };
};

export const puckConfig: Config<PuckProps> = {
    components: {
        HeroBlock: {
            label: 'Hero Section',
            fields: {
                title: { type: 'text', label: 'หัวข้อ' },
                subtitle: { type: 'text', label: 'คำบรรยาย' },
                bgColor: { type: 'text', label: 'สีพื้นหลัง (hex)' },
            },
            defaultProps: {
                title: 'ยินดีต้อนรับ',
                subtitle: 'เว็บไซต์โรงเรียน',
                bgColor: '#1a56db',
            },
            render: ({ title, subtitle, bgColor }) => (
                <div style={{ backgroundColor: bgColor }} className="py-16 text-center text-white rounded-lg">
                    <h1 className="text-4xl font-bold mb-3">{title}</h1>
                    <p className="text-xl opacity-80">{subtitle}</p>
                </div>
            ),
        },

        NewsGridBlock: {
            label: 'กริดข่าวสาร',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                maxItems: { type: 'number', label: 'จำนวนข่าว' },
            },
            defaultProps: { heading: 'ข่าวสาร & ประกาศ', maxItems: 6 },
            render: ({ heading, maxItems }) => (
                <div className="py-8 bg-secondary/30 rounded-lg px-6">
                    <h2 className="text-2xl font-bold mb-4">{heading}</h2>
                    <p className="text-muted-foreground">แสดงข่าวล่าสุด {maxItems} รายการ</p>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        {Array.from({ length: Math.min(maxItems, 3) }).map((_, i) => (
                            <div key={i} className="h-24 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                                ข่าว {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },

        AboutSnippetBlock: {
            label: 'เกี่ยวกับโรงเรียน',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                body: { type: 'textarea', label: 'เนื้อหา' },
            },
            defaultProps: {
                heading: 'เกี่ยวกับเรา',
                body: 'โรงเรียนของเรามุ่งมั่นพัฒนาผู้เรียน...',
            },
            render: ({ heading, body }) => (
                <div className="py-8 px-6 bg-card border rounded-lg">
                    <h2 className="text-2xl font-bold mb-3">{heading}</h2>
                    <p className="text-muted-foreground leading-relaxed">{body}</p>
                </div>
            ),
        },

        GalleryBlock: {
            label: 'แกลเลอรี่',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
            },
            defaultProps: { heading: 'ภาพกิจกรรม' },
            render: ({ heading }) => (
                <div className="py-8 px-6 bg-secondary/20 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">{heading}</h2>
                    <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-square bg-muted rounded-md" />
                        ))}
                    </div>
                </div>
            ),
        },

        ContactBlock: {
            label: 'ติดต่อเรา',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                showMap: { type: 'radio', label: 'แสดงแผนที่', options: [{ label: 'ใช่', value: true }, { label: 'ไม่', value: false }] },
            },
            defaultProps: { heading: 'ติดต่อเรา', showMap: true },
            render: ({ heading, showMap }) => (
                <div className="py-8 px-6 bg-card border rounded-lg">
                    <h2 className="text-2xl font-bold mb-3">{heading}</h2>
                    <p className="text-muted-foreground">ข้อมูลการติดต่อโรงเรียน</p>
                    {showMap && <div className="mt-4 h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">แผนที่</div>}
                </div>
            ),
        },

        DividerBlock: {
            label: 'เส้นคั่น',
            fields: {},
            defaultProps: {},
            render: () => <hr className="my-4 border-border" />,
        },

        HeadingBlock: {
            label: 'หัวข้อส่วน',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                subtitle: { type: 'text', label: 'คำบรรยาย' },
                align: { type: 'radio', label: 'การจัดวาง', options: [{ label: 'ซ้าย', value: 'left' }, { label: 'กลาง', value: 'center' }, { label: 'ขวา', value: 'right' }] },
                size: { type: 'radio', label: 'ขนาด', options: [{ label: 'เล็ก', value: 'sm' }, { label: 'กลาง', value: 'md' }, { label: 'ใหญ่', value: 'lg' }] },
            },
            defaultProps: { heading: 'หัวข้อส่วน', subtitle: 'คำบรรยายส่วนนี้', align: 'center', size: 'md' },
            render: ({ heading, subtitle, align, size }) => {
                const sizeMap = { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl' };
                return (
                    <div className="py-6 px-4" style={{ textAlign: align }}>
                        <h2 className={`${sizeMap[size]} font-bold text-foreground`}>{heading}</h2>
                        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
                    </div>
                );
            },
        },

        SpacerBlock: {
            label: 'ช่องว่าง',
            fields: {
                height: { type: 'number', label: 'ความสูง (px)' },
            },
            defaultProps: { height: 40 },
            render: ({ height }) => <div style={{ height }} />,
        },

        AnnouncementBlock: {
            label: 'ประกาศ/แบนเนอร์',
            fields: {
                text: { type: 'text', label: 'ข้อความ' },
                color: { type: 'radio', label: 'สี', options: [{ label: 'น้ำเงิน', value: 'blue' }, { label: 'เขียว', value: 'green' }, { label: 'เหลือง', value: 'yellow' }, { label: 'แดง', value: 'red' }] },
                icon: { type: 'text', label: 'ไอคอน (emoji)' },
            },
            defaultProps: { text: 'ประกาศสำคัญ: กรุณาตรวจสอบข้อมูลให้ครบถ้วน', color: 'blue', icon: '📢' },
            render: ({ text, color, icon }) => {
                const colorMap = {
                    blue: 'bg-blue-50 border-blue-300 text-blue-800',
                    green: 'bg-green-50 border-green-300 text-green-800',
                    yellow: 'bg-yellow-50 border-yellow-300 text-yellow-800',
                    red: 'bg-red-50 border-red-300 text-red-800',
                };
                return (
                    <div className={`flex items-center gap-3 px-5 py-4 rounded-lg border ${colorMap[color]}`}>
                        {icon && <span className="text-2xl flex-shrink-0">{icon}</span>}
                        <p className="font-medium">{text}</p>
                    </div>
                );
            },
        },

        StatisticsBlock: {
            label: 'ตัวเลขสถิติ',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                stat1_label: { type: 'text', label: 'สถิติ 1 — ชื่อ' },
                stat1_value: { type: 'text', label: 'สถิติ 1 — ตัวเลข' },
                stat2_label: { type: 'text', label: 'สถิติ 2 — ชื่อ' },
                stat2_value: { type: 'text', label: 'สถิติ 2 — ตัวเลข' },
                stat3_label: { type: 'text', label: 'สถิติ 3 — ชื่อ' },
                stat3_value: { type: 'text', label: 'สถิติ 3 — ตัวเลข' },
                stat4_label: { type: 'text', label: 'สถิติ 4 — ชื่อ' },
                stat4_value: { type: 'text', label: 'สถิติ 4 — ตัวเลข' },
            },
            defaultProps: {
                heading: 'โรงเรียนของเราในตัวเลข',
                stat1_label: 'นักเรียน', stat1_value: '500+',
                stat2_label: 'ครูและบุคลากร', stat2_value: '40',
                stat3_label: 'ปีที่ก่อตั้ง', stat3_value: '2500',
                stat4_label: 'ห้องเรียน', stat4_value: '18',
            },
            render: ({ heading, stat1_label, stat1_value, stat2_label, stat2_value, stat3_label, stat3_value, stat4_label, stat4_value }) => (
                <div className="py-10 px-6 bg-primary text-primary-foreground rounded-lg text-center">
                    {heading && <h2 className="text-2xl font-bold mb-8 opacity-90">{heading}</h2>}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: stat1_label, value: stat1_value },
                            { label: stat2_label, value: stat2_value },
                            { label: stat3_label, value: stat3_value },
                            { label: stat4_label, value: stat4_value },
                        ].map((s, i) => (
                            <div key={i}>
                                <div className="text-4xl font-bold">{s.value}</div>
                                <div className="mt-1 text-sm opacity-75">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },

        VideoBlock: {
            label: 'วิดีโอ YouTube',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                youtube_url: { type: 'text', label: 'YouTube URL' },
                caption: { type: 'text', label: 'คำบรรยายใต้วิดีโอ' },
            },
            defaultProps: { heading: 'แนะนำโรงเรียน', youtube_url: '', caption: '' },
            render: ({ heading, youtube_url, caption }) => {
                const getEmbedUrl = (url: string) => {
                    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                    return match ? `https://www.youtube.com/embed/${match[1]}` : '';
                };
                const embedUrl = getEmbedUrl(youtube_url);
                return (
                    <div className="py-8 px-4">
                        {heading && <h2 className="text-2xl font-bold mb-4 text-center">{heading}</h2>}
                        {embedUrl ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden">
                                <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={heading} />
                            </div>
                        ) : (
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                วาง YouTube URL ในช่องด้านซ้าย
                            </div>
                        )}
                        {caption && <p className="mt-3 text-center text-sm text-muted-foreground">{caption}</p>}
                    </div>
                );
            },
        },

        QuickLinksBlock: {
            label: 'ลิงก์ด่วน',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                link1_icon: { type: 'text', label: 'ลิงก์ 1 — ไอคอน' },
                link1_label: { type: 'text', label: 'ลิงก์ 1 — ชื่อ' },
                link1_url: { type: 'text', label: 'ลิงก์ 1 — URL' },
                link2_icon: { type: 'text', label: 'ลิงก์ 2 — ไอคอน' },
                link2_label: { type: 'text', label: 'ลิงก์ 2 — ชื่อ' },
                link2_url: { type: 'text', label: 'ลิงก์ 2 — URL' },
                link3_icon: { type: 'text', label: 'ลิงก์ 3 — ไอคอน' },
                link3_label: { type: 'text', label: 'ลิงก์ 3 — ชื่อ' },
                link3_url: { type: 'text', label: 'ลิงก์ 3 — URL' },
                link4_icon: { type: 'text', label: 'ลิงก์ 4 — ไอคอน' },
                link4_label: { type: 'text', label: 'ลิงก์ 4 — ชื่อ' },
                link4_url: { type: 'text', label: 'ลิงก์ 4 — URL' },
            },
            defaultProps: {
                heading: 'เมนูด่วน',
                link1_icon: '📰', link1_label: 'ข่าวสาร', link1_url: '/news',
                link2_icon: '🖼️', link2_label: 'แกลเลอรี่', link2_url: '/gallery',
                link3_icon: '📄', link3_label: 'เอกสาร', link3_url: '/documents',
                link4_icon: '📝', link4_label: 'สมัครเรียน', link4_url: '/enrollment',
            },
            render: ({ heading, link1_icon, link1_label, link1_url, link2_icon, link2_label, link2_url, link3_icon, link3_label, link3_url, link4_icon, link4_label, link4_url }) => {
                const links = [
                    { icon: link1_icon, label: link1_label, url: link1_url },
                    { icon: link2_icon, label: link2_label, url: link2_url },
                    { icon: link3_icon, label: link3_label, url: link3_url },
                    { icon: link4_icon, label: link4_label, url: link4_url },
                ].filter(l => l.label);
                return (
                    <div className="py-8 px-4">
                        {heading && <h2 className="text-xl font-bold mb-4 text-center">{heading}</h2>}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {links.map((link, i) => (
                                <a key={i} href={link.url} className="flex flex-col items-center gap-2 p-4 bg-card border rounded-xl hover:bg-accent transition-colors text-center no-underline">
                                    <span className="text-3xl">{link.icon}</span>
                                    <span className="text-sm font-medium text-foreground">{link.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                );
            },
        },

        EventsBlock: {
            label: 'กิจกรรมที่กำลังจะมา',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                maxItems: { type: 'number', label: 'จำนวนรายการ' },
            },
            defaultProps: { heading: 'กิจกรรมที่กำลังจะมา', maxItems: 4 },
            render: ({ heading, maxItems }) => {
                const [events, setEvents] = useState<{ id: string; title: string; start_date: string; location: string | null }[]>([]);
                useEffect(() => {
                    supabase.from('events').select('id, title, start_date, location').gte('start_date', new Date().toISOString().slice(0, 10)).order('start_date').limit(maxItems).then(({ data }) => setEvents(data || []));
                }, [maxItems]);
                return (
                    <div className="py-8 px-6 bg-secondary/20 rounded-lg">
                        <h2 className="text-2xl font-bold mb-4">{heading}</h2>
                        {events.length === 0 ? (
                            <p className="text-muted-foreground text-sm">ไม่มีกิจกรรมที่กำลังจะมา</p>
                        ) : (
                            <div className="space-y-3">
                                {events.map(ev => (
                                    <div key={ev.id} className="flex items-start gap-3 bg-card rounded-lg p-3 border">
                                        <div className="text-center bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs font-bold flex-shrink-0">
                                            {new Date(ev.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{ev.title}</div>
                                            {ev.location && <div className="text-xs text-muted-foreground mt-0.5">📍 {ev.location}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            },
        },

        DocumentsBlock: {
            label: 'เอกสารดาวน์โหลด',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                maxItems: { type: 'number', label: 'จำนวนรายการ' },
            },
            defaultProps: { heading: 'เอกสารดาวน์โหลด', maxItems: 5 },
            render: ({ heading, maxItems }) => {
                const [docs, setDocs] = useState<{ id: string; title: string; category: string | null; file_url: string }[]>([]);
                useEffect(() => {
                    supabase.from('documents').select('id, title, category, file_url').eq('is_active', true).order('created_at', { ascending: false }).limit(maxItems).then(({ data }) => setDocs(data || []));
                }, [maxItems]);
                return (
                    <div className="py-8 px-6 bg-card border rounded-lg">
                        <h2 className="text-2xl font-bold mb-4">{heading}</h2>
                        {docs.length === 0 ? (
                            <p className="text-muted-foreground text-sm">ไม่มีเอกสาร</p>
                        ) : (
                            <div className="space-y-2">
                                {docs.map(doc => (
                                    <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors border no-underline">
                                        <span className="text-xl">📄</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">{doc.title}</div>
                                            {doc.category && <div className="text-xs text-muted-foreground">{doc.category}</div>}
                                        </div>
                                        <span className="text-xs text-primary flex-shrink-0">ดาวน์โหลด ↓</span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                );
            },
        },
    },
};
