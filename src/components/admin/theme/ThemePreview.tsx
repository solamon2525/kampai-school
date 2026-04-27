import { Bell, GraduationCap, Mail, Phone } from 'lucide-react';
import type { ThemeColors } from '@/lib/themeDefaults';

interface Props {
    theme: ThemeColors;
}

/**
 * ThemePreview — live mockup of public site sections using the supplied theme.
 *
 * Uses inline `style` (not Tailwind classes) so it reflects the unsaved theme
 * regardless of whether RuntimeThemeStyles has flushed to <head>.
 *
 * Sections shown: TopBar, NavBar item, Hero banner, Card with button,
 * Section header, Footer strip — covering the most common token usages.
 */
export const ThemePreview = ({ theme }: Props) => {
    return (
        <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ตัวอย่างการแสดงผล (Live Preview)
            </div>

            <div
                className="rounded-lg overflow-hidden border shadow-sm"
                style={{ borderColor: theme.border, backgroundColor: theme.background }}
            >
                {/* TopBar */}
                <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ backgroundColor: theme.primary, color: theme['primary-foreground'] }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                            style={{ backgroundColor: theme.accent, color: theme['accent-foreground'] }}
                        >
                            คผ
                        </div>
                        <div className="text-sm font-bold truncate">โรงเรียนบ้านคำไผ่</div>
                    </div>
                    <div className="flex items-center gap-3 text-xs flex-shrink-0">
                        <span className="hidden sm:flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            02-XXX
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            info
                        </span>
                    </div>
                </div>

                {/* NavBar */}
                <div
                    className="px-4 py-2 text-xs font-medium border-b"
                    style={{
                        backgroundColor: theme.primary,
                        color: theme['primary-foreground'],
                        borderColor: theme.border,
                        opacity: 0.95,
                    }}
                >
                    เมนูหลัก · หน้าแรก · เกี่ยวกับเรา · ข่าวสาร · ติดต่อ
                </div>

                {/* Announcement banner */}
                <div
                    className="px-4 py-2 text-center text-xs font-medium"
                    style={{ backgroundColor: theme.accent, color: theme['accent-foreground'] }}
                >
                    📢 กำลังเปิดรับนักเรียน ปีการศึกษา 2569
                </div>

                {/* Body */}
                <div
                    className="p-5 space-y-4"
                    style={{ backgroundColor: theme.background, color: theme.foreground }}
                >
                    {/* Section header */}
                    <div
                        className="rounded-md px-3 py-2 text-sm font-semibold flex items-center gap-2"
                        style={{ backgroundColor: theme.primary, color: theme['primary-foreground'] }}
                    >
                        <GraduationCap className="w-4 h-4" />
                        ผู้อำนวยการโรงเรียน
                    </div>

                    {/* Card with button */}
                    <div
                        className="rounded-md p-4 border"
                        style={{ backgroundColor: theme.background, borderColor: theme.border }}
                    >
                        <div className="text-base font-bold mb-1" style={{ color: theme.foreground }}>
                            หัวข้อตัวอย่าง
                        </div>
                        <div className="text-sm mb-3" style={{ color: theme['muted-foreground'] }}>
                            ข้อความรายละเอียดที่ใช้สี muted-foreground ตัดกับพื้นหลัง
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                type="button"
                                className="px-3 py-1.5 rounded-md text-sm font-medium"
                                style={{
                                    backgroundColor: theme.primary,
                                    color: theme['primary-foreground'],
                                }}
                            >
                                ปุ่มหลัก
                            </button>
                            <button
                                type="button"
                                className="px-3 py-1.5 rounded-md text-sm font-medium"
                                style={{
                                    backgroundColor: theme.secondary,
                                    color: theme['secondary-foreground'],
                                }}
                            >
                                ปุ่มรอง
                            </button>
                            <span
                                className="px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1"
                                style={{
                                    backgroundColor: theme.muted,
                                    color: theme['muted-foreground'],
                                }}
                            >
                                <Bell className="w-3 h-3" />
                                Badge
                            </span>
                        </div>
                    </div>

                    {/* Muted alt section */}
                    <div
                        className="rounded-md p-3 text-sm"
                        style={{ backgroundColor: theme.muted, color: theme['muted-foreground'] }}
                    >
                        พื้น muted สำหรับ alternate section / quote / quiet content
                    </div>
                </div>

                {/* Footer strip */}
                <div
                    className="px-4 py-3 text-xs"
                    style={{ backgroundColor: theme.primary, color: theme['primary-foreground'] }}
                >
                    <div className="font-bold mb-1">โรงเรียนบ้านคำไผ่</div>
                    <div style={{ opacity: 0.7 }}>เรียนดี มีคุณธรรม</div>
                </div>
            </div>
        </div>
    );
};

export default ThemePreview;
