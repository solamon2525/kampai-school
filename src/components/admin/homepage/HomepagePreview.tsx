import {
    MAIN_BLOCKS,
    RIGHT_BLOCKS,
    LEFT_BLOCKS,
    HEADER_BLOCKS,
    FOOTER_BLOCKS,
    type ZoneKey,
} from './BlockPalette';
import { useDroppable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HomepagePreviewProps {
    layout: Record<ZoneKey, { blocks: string[]; hidden: string[] }>;
    selectedBlock: string | null;
    onSelectBlock: (id: string | null) => void;
    activeZone: ZoneKey;
    hoveredBlock?: string | null;
    hoverSource?: 'palette' | 'preview' | null;
    onHoverPreviewBlock?: (id: string | null, zone?: ZoneKey) => void;
}

// ─── Mini block renderers ─────────────────────────────────
// Lightweight previews (not actual components to keep it fast)

const HeaderBlockPreview: Record<string, () => JSX.Element> = {
    news_ticker: () => (
        <div className="bg-yellow-50 border border-yellow-200 rounded flex items-center overflow-hidden">
            <div className="flex-shrink-0 bg-red-600 text-white text-[6px] font-bold px-2 py-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                ข่าวด่วน
            </div>
            <div className="flex-1 px-2">
                <div className="h-1 bg-gray-300 rounded w-full" />
            </div>
        </div>
    ),
    top_banner: () => (
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded p-2 text-center">
            <div className="h-5 bg-primary/10 rounded flex items-center justify-center">
                <span className="text-[6px] text-primary font-medium">🖼️ แบนเนอร์โปรโมท</span>
            </div>
        </div>
    ),
};

const MainBlockPreview: Record<string, () => JSX.Element> = {
    hero: () => (
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden aspect-[16/7]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="h-2 w-24 bg-white/40 rounded mb-1.5" />
                <div className="h-1.5 w-16 bg-white/25 rounded" />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="w-3 h-1 rounded-full bg-white" />
                <div className="w-1 h-1 rounded-full bg-white/50" />
                <div className="w-1 h-1 rounded-full bg-white/50" />
            </div>
        </div>
    ),
    featured_hero: () => (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center flex-shrink-0 text-amber-700 font-bold text-[10px]">
                🏆
            </div>
            <div className="flex-1 min-w-0">
                <div className="h-2 bg-amber-400/30 rounded w-24 mb-1" />
                <div className="h-1.5 bg-gray-300 rounded w-3/4 mb-1" />
                <div className="h-1 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="w-10 h-10 bg-white rounded border border-gray-100 flex items-center justify-center text-[7px] text-amber-500 font-bold flex-shrink-0">
                📊 RADAR
            </div>
        </div>
    ),
    featured_games: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1 flex items-center justify-between">
                <span className="text-[8px] font-semibold flex items-center gap-1">
                    <span className="w-0.5 h-2 bg-yellow-400 rounded-full inline-block" />
                    🎮 เกมแนะนำ
                </span>
                <span className="text-[6px] text-yellow-300">ดูทั้งหมด →</span>
            </div>
            <div className="flex gap-1.5 p-2 overflow-hidden">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex-shrink-0 w-10">
                        <div className="aspect-[3/4] rounded bg-gradient-to-br from-indigo-300 to-purple-300 border border-gray-100 flex items-center justify-center text-[11px]">
                            🎮
                        </div>
                        <div className="h-1 bg-gray-300 rounded w-3/4 mt-1" />
                    </div>
                ))}
            </div>
        </div>
    ),
    news: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1 flex items-center justify-between">
                <span className="text-[8px] font-semibold flex items-center gap-1">
                    <span className="w-0.5 h-2 bg-yellow-400 rounded-full inline-block" />
                    ข่าวสารล่าสุด
                </span>
                <span className="text-[6px] text-yellow-300">ดูทั้งหมด →</span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-gray-100">
                <div className="bg-gradient-to-br from-emerald-600 to-slate-700 aspect-[4/3]" />
                <div className="col-span-2 grid grid-cols-2 gap-px">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-200 aspect-[4/3]" />
                    ))}
                </div>
            </div>
        </div>
    ),
    facebook_feed: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1 flex items-center justify-between">
                <span className="text-[8px] font-semibold flex items-center gap-1">
                    <span className="w-0.5 h-2 bg-yellow-400 rounded-full inline-block" />
                    📘 ฟีดข่าว Facebook
                </span>
                <span className="text-[6px] text-yellow-300">ดูเพิ่มเติม →</span>
            </div>
            <div className="p-2">
                <div className="border border-gray-200 rounded-md p-1.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[7px] font-semibold text-gray-700">ข่าวสารจาก Facebook</span>
                        <span className="text-[5px] px-1 py-0.5 rounded-full border border-gray-300 text-gray-600">โรงเรียน</span>
                    </div>
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex gap-1.5">
                            <div className="w-5 h-5 bg-gray-200 rounded flex-shrink-0" />
                            <div className="flex-1 space-y-0.5">
                                <div className="h-1 bg-gray-200 rounded w-full" />
                                <div className="h-1 bg-gray-100 rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ),
    about: () => (
        <div className="bg-white border border-gray-200 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[6px] font-bold text-emerald-700 uppercase border-l-2 border-emerald-700 pl-1">ABOUT</span>
                <span className="text-[6px] text-gray-400">—</span>
                <span className="text-[7px] font-bold text-gray-800">WHO WE ARE</span>
            </div>
            <div className="space-y-1">
                <div className="h-1.5 bg-gray-200 rounded w-full" />
                <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                <div className="h-1.5 bg-gray-200 rounded w-1/2" />
            </div>
            <span className="text-[6px] text-emerald-700 mt-1 inline-block">อ่านเพิ่มเติม →</span>
        </div>
    ),
    calendar: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1">
                <span className="text-[8px] font-semibold">📅 ปฏิทินกิจกรรม</span>
            </div>
            <div className="p-2 space-y-1.5">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] font-bold text-primary">{10 + i}</span>
                        </div>
                        <div className="flex-1">
                            <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                            <div className="h-1 bg-gray-100 rounded w-1/2 mt-0.5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ),
    video: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="text-center py-1.5">
                <span className="text-[8px] font-bold">🎬 แนะนำโรงเรียน</span>
            </div>
            <div className="aspect-video bg-gray-900 flex items-center justify-center mx-2 mb-2 rounded">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[5px] border-l-white/80 border-y-[3px] border-y-transparent ml-0.5" />
                </div>
            </div>
        </div>
    ),
    statistics: () => (
        <div className="bg-primary text-primary-foreground rounded-lg p-3 text-center">
            <span className="text-[8px] font-bold opacity-80 block mb-2">โรงเรียนของเราในตัวเลข</span>
            <div className="grid grid-cols-4 gap-1">
                {['500+', '40', '2500', '18'].map((v, i) => (
                    <div key={i}>
                        <div className="text-[10px] font-bold">{v}</div>
                        <div className="text-[5px] opacity-60">{['นักเรียน', 'ครู', 'ปีก่อตั้ง', 'ห้องเรียน'][i]}</div>
                    </div>
                ))}
            </div>
        </div>
    ),
    quicklinks: () => (
        <div className="bg-white border border-gray-200 rounded-lg p-2">
            <span className="text-[8px] font-bold text-center block mb-1.5">🔗 เมนูด่วน</span>
            <div className="grid grid-cols-4 gap-1">
                {['📰', '🖼️', '📄', '📝'].map((icon, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5 p-1 bg-secondary/50 rounded text-center">
                        <span className="text-sm">{icon}</span>
                        <div className="h-1 bg-gray-200 rounded w-3/4" />
                    </div>
                ))}
            </div>
        </div>
    ),
    announcement: () => (
        <div className="flex items-center gap-1.5 px-2 py-2 rounded-lg border border-blue-300 bg-blue-50">
            <span className="text-sm flex-shrink-0">📢</span>
            <div className="flex-1">
                <div className="h-1.5 bg-blue-200 rounded w-3/4" />
                <div className="h-1 bg-blue-100 rounded w-1/2 mt-0.5" />
            </div>
        </div>
    ),
    // ─── New blog/content blocks ──────────────────────────
    blog_grid: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1">
                <span className="text-[8px] font-semibold">📝 บล็อก (Grid)</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1.5">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="bg-gray-100 rounded overflow-hidden">
                        <div className="aspect-[4/3] bg-gray-200" />
                        <div className="p-1">
                            <div className="h-1 bg-gray-300 rounded w-full mb-0.5" />
                            <div className="h-1 bg-gray-200 rounded w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ),
    blog_carousel: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1">
                <span className="text-[8px] font-semibold">🎠 บล็อก (Carousel)</span>
            </div>
            <div className="p-1.5 flex gap-1 overflow-hidden">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex-shrink-0 w-1/3 bg-gray-100 rounded overflow-hidden">
                        <div className="aspect-[3/2] bg-gray-200" />
                        <div className="p-0.5">
                            <div className="h-1 bg-gray-300 rounded w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ),
    blog_list: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1">
                <span className="text-[8px] font-semibold">📋 บล็อก (List)</span>
            </div>
            <div className="divide-y divide-gray-100">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-1.5 p-1.5">
                        <div className="w-8 h-6 bg-gray-200 rounded flex-shrink-0" />
                        <div className="flex-1">
                            <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                            <div className="h-1 bg-gray-100 rounded w-1/2 mt-0.5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ),
    testimonials: () => (
        <div className="bg-white border border-gray-200 rounded-lg p-2">
            <span className="text-[8px] font-bold text-center block mb-1">💬 รีวิว/คำนิยม</span>
            <div className="bg-gray-50 rounded p-1.5 text-center">
                <div className="text-[10px]">⭐⭐⭐⭐⭐</div>
                <div className="h-1 bg-gray-200 rounded w-3/4 mx-auto mt-1" />
                <div className="h-1 bg-gray-200 rounded w-1/2 mx-auto mt-0.5" />
                <div className="w-4 h-4 rounded-full bg-gray-300 mx-auto mt-1" />
            </div>
        </div>
    ),
    faq_accordion: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1">
                <span className="text-[8px] font-semibold">❓ คำถามที่พบบ่อย</span>
            </div>
            <div className="divide-y divide-gray-100">
                {['สมัครเรียนอย่างไร?', 'เปิดเรียนวันไหน?'].map((q, i) => (
                    <div key={i} className="px-2 py-1.5 flex items-center justify-between">
                        <span className="text-[6px] text-gray-700">{q}</span>
                        <span className="text-[8px] text-gray-400">▼</span>
                    </div>
                ))}
            </div>
        </div>
    ),
    countdown: () => (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-3 text-center">
            <span className="text-[8px] font-bold block mb-1">⏳ นับถอยหลัง</span>
            <div className="flex justify-center gap-2">
                {['30', '12', '45', '08'].map((v, i) => (
                    <div key={i}>
                        <div className="text-[12px] font-bold">{v}</div>
                        <div className="text-[5px] opacity-70">{['วัน', 'ชม.', 'นาที', 'วินาที'][i]}</div>
                    </div>
                ))}
            </div>
        </div>
    ),
    partner_logos: () => (
        <div className="bg-white border border-gray-200 rounded-lg p-2">
            <span className="text-[8px] font-bold text-center block mb-1">🤝 พันธมิตร</span>
            <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                        <span className="text-[8px] text-gray-400">🏢</span>
                    </div>
                ))}
            </div>
        </div>
    ),
    photo_album: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1">
                <span className="text-[8px] font-semibold">📸 อัลบั้มรูปภาพ</span>
            </div>
            <div className="grid grid-cols-4 gap-0.5 p-1">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-sm" />
                ))}
            </div>
        </div>
    ),
    map_embed: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-[2/1] bg-green-100 flex items-center justify-center">
                <span className="text-lg">🗺️</span>
            </div>
            <div className="px-2 py-1">
                <span className="text-[6px] text-gray-600">📍 Google Maps — ที่ตั้งโรงเรียน</span>
            </div>
        </div>
    ),
    contact_form: () => (
        <div className="bg-white border border-gray-200 rounded-lg p-2">
            <span className="text-[8px] font-bold block mb-1.5">✉️ ฟอร์มติดต่อ</span>
            <div className="space-y-1">
                <div className="h-3 bg-gray-100 rounded border border-gray-200" />
                <div className="h-3 bg-gray-100 rounded border border-gray-200" />
                <div className="h-6 bg-gray-100 rounded border border-gray-200" />
                <div className="h-3 bg-primary/20 rounded w-1/4 ml-auto" />
            </div>
        </div>
    ),
};

// ดึงข้อมูล Top 5 จาก DB จริง (sync กับ HomeRightSidebar)
const WASTE_MEDALS = ['🥇', '🥈', '🥉', '4', '5'];
const WasteBankPreview = () => {
    const [rows, setRows] = useState<Array<{ name: string; points: number }> | null>(null);
    useEffect(() => {
        supabase
            .from('waste_student_summary')
            .select('full_name, total_points_earned, total_transactions')
            .gt('total_transactions', 0)
            .order('total_points_earned', { ascending: false })
            .limit(5)
            .then(({ data }) => {
                setRows(
                    (data ?? []).map((r: { full_name: string | null; total_points_earned: number | null }) => ({
                        name: r.full_name ?? '-',
                        points: Number(r.total_points_earned ?? 0),
                    })),
                );
            });
    }, []);
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-700 text-white px-2 py-1 text-[7px] font-semibold flex items-center gap-1">
                <span>♻️</span> ธนาคารขยะ — Top 5
            </div>
            {rows === null ? (
                <div className="px-2 py-2 text-[6px] text-gray-400 text-center">กำลังโหลด…</div>
            ) : rows.length === 0 ? (
                <div className="px-2 py-2 text-[6px] text-gray-400 text-center">ยังไม่มีข้อมูล</div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {rows.map((r, i) => (
                        <li key={i} className="flex items-center gap-1 px-2 py-1">
                            <span className="text-[7px] w-3 text-center">{WASTE_MEDALS[i]}</span>
                            <span className="text-[6px] text-gray-700 flex-1 truncate">{r.name}</span>
                            <span className="text-[6px] font-bold text-emerald-700">{r.points.toLocaleString()} pt</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// SavingsBank preview (ห้ามแสดงตัวเลขเงิน — แสดงครั้งฝากเท่านั้น)
const SavingsBankPreview = () => {
    const [rows, setRows] = useState<Array<{ name: string; deposits: number }> | null>(null);
    useEffect(() => {
        supabase
            .from('savings_student_summary')
            .select('full_name, deposit_count, total_transactions')
            .gt('deposit_count', 0)
            .order('deposit_count', { ascending: false })
            .limit(5)
            .then(({ data }) => {
                setRows(
                    (data ?? []).map((r: { full_name: string | null; deposit_count: number | null }) => ({
                        name: r.full_name ?? '-',
                        deposits: Number(r.deposit_count ?? 0),
                    })),
                );
            });
    }, []);
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-amber-500 text-white px-2 py-1 text-[7px] font-semibold flex items-center gap-1">
                <span>🏦</span> ธนาคารพอเพียง — Top 5
            </div>
            {rows === null ? (
                <div className="px-2 py-2 text-[6px] text-gray-400 text-center">กำลังโหลด…</div>
            ) : rows.length === 0 ? (
                <div className="px-2 py-2 text-[6px] text-gray-400 text-center">ยังไม่มีข้อมูล</div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {rows.map((r, i) => (
                        <li key={i} className="flex items-center gap-1 px-2 py-1">
                            <span className="text-[7px] w-3 text-center">{WASTE_MEDALS[i]}</span>
                            <span className="text-[6px] text-gray-700 flex-1 truncate">{r.name}</span>
                            <span className="text-[6px] font-bold text-amber-700">{r.deposits.toLocaleString()} ครั้ง</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const RightBlockPreview: Record<string, () => JSX.Element> = {
    waste_bank: WasteBankPreview,
    savings_bank: SavingsBankPreview,
    categories: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1 text-[7px] font-semibold">รายการหมวดหมู่</div>
            <div className="divide-y divide-gray-100">
                {['ข่าวประชาสัมพันธ์', 'กิจกรรม', 'ผลงาน'].map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${['bg-blue-500', 'bg-green-500', 'bg-emerald-500'][i]}`} />
                        <span className="text-[6px] text-gray-700">{c}</span>
                    </div>
                ))}
            </div>
        </div>
    ),
    gallery: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1 text-[7px] font-semibold">🖼️ ภาพกิจกรรม</div>
            <div className="grid grid-cols-3 gap-px p-0.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-sm" />
                ))}
            </div>
        </div>
    ),
    services: () => (
        <div className="space-y-1">
            <div className="bg-blue-600 text-white text-[7px] font-semibold px-2 py-1.5 rounded flex items-center gap-1">🖥️ E-Services</div>
            <div className="bg-orange-500 text-white text-[7px] font-semibold px-2 py-1.5 rounded flex items-center gap-1">🔗 เอกสาร</div>
        </div>
    ),
    social: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1 text-[7px] font-semibold">โซเชียลมีเดีย</div>
            <div className="p-1.5 flex gap-1">
                {['🔵', '🔴', '🟣'].map((icon, i) => (
                    <div key={i} className="flex items-center gap-0.5 border border-gray-200 rounded px-1.5 py-0.5">
                        <span className="text-[8px]">{icon}</span>
                        <span className="text-[5px] text-gray-600">{['FB', 'YT', 'IG'][i]}</span>
                    </div>
                ))}
            </div>
        </div>
    ),
    stats: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1 text-[7px] font-semibold">👥 สถิติผู้เข้าชม</div>
            <div className="divide-y divide-gray-100">
                {['วันนี้', 'เมื่อวาน', 'ทั้งหมด'].map((l, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1">
                        <span className="text-[6px] text-gray-600">{l}</span>
                        <span className="text-[7px] font-bold text-emerald-700">{[42, 38, 1280][i]}</span>
                    </div>
                ))}
            </div>
        </div>
    ),
    documents: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1 text-[7px] font-semibold">📄 เอกสารล่าสุด</div>
            <div className="divide-y divide-gray-100">
                {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1">
                        <span className="text-[8px]">📄</span>
                        <div className="h-1.5 bg-gray-200 rounded flex-1" />
                    </div>
                ))}
            </div>
        </div>
    ),
};

const LeftBlockPreview: Record<string, () => JSX.Element> = {
    principal: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1 text-[7px] font-semibold">👤 ผู้อำนวยการ</div>
            <div className="p-2 text-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mx-auto mb-1 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">ผ</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-1 bg-gray-100 rounded w-1/2 mx-auto mt-0.5" />
            </div>
        </div>
    ),
    menu: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-800 text-white px-2 py-1 text-[7px] font-semibold">เมนูทาง</div>
            <div className="divide-y divide-gray-100">
                {['ประวัติ', 'บุคลากร', 'นักเรียน', 'หลักสูตร', 'แกลเลอรี่'].map((m, i) => (
                    <div key={i} className="px-2 py-1 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-sm bg-emerald-300 flex-shrink-0" />
                        <span className="text-[6px] text-gray-700">{m}</span>
                    </div>
                ))}
            </div>
        </div>
    ),
};

const FooterBlockPreview: Record<string, () => JSX.Element> = {
    footer_info: () => (
        <div className="flex items-center gap-1.5 p-1">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[6px] text-white font-bold">คผ</span>
            </div>
            <div>
                <div className="h-1.5 bg-white/30 rounded w-14" />
                <div className="h-1 bg-white/15 rounded w-10 mt-0.5" />
            </div>
        </div>
    ),
    footer_links: () => (
        <div className="p-1">
            <div className="text-[6px] text-white/70 font-semibold mb-1">ลิงก์ด่วน</div>
            <div className="space-y-0.5">
                {['หน้าแรก', 'เกี่ยวกับเรา', 'ข่าวสาร'].map((l, i) => (
                    <div key={i} className="h-1 bg-white/15 rounded w-10" />
                ))}
            </div>
        </div>
    ),
    footer_social: () => (
        <div className="p-1">
            <div className="text-[6px] text-white/70 font-semibold mb-1">โซเชียล</div>
            <div className="flex gap-1">
                {['🔵', '🔴', '🟢'].map((icon, i) => (
                    <div key={i} className="w-3 h-3 rounded bg-white/15 flex items-center justify-center">
                        <span className="text-[5px]">{icon}</span>
                    </div>
                ))}
            </div>
        </div>
    ),
    footer_contact: () => (
        <div className="p-1">
            <div className="text-[6px] text-white/70 font-semibold mb-1">ติดต่อเรา</div>
            <div className="space-y-0.5">
                <div className="h-1 bg-white/15 rounded w-16" />
                <div className="h-1 bg-white/15 rounded w-12" />
            </div>
        </div>
    ),
    footer_services: () => (
        <div className="p-1">
            <div className="text-[6px] text-white/70 font-semibold mb-1">บริการ</div>
            <div className="space-y-0.5">
                <div className="h-1 bg-white/15 rounded w-14" />
                <div className="h-1 bg-white/15 rounded w-10" />
            </div>
        </div>
    ),
};

const ALL_PREVIEW_MAP: Record<string, () => JSX.Element> = {
    ...HeaderBlockPreview,
    ...MainBlockPreview,
    ...RightBlockPreview,
    ...LeftBlockPreview,
    ...FooterBlockPreview,
};

const ALL_BLOCKS_FLAT = [...HEADER_BLOCKS, ...MAIN_BLOCKS, ...RIGHT_BLOCKS, ...LEFT_BLOCKS, ...FOOTER_BLOCKS];

function DroppableZone({ zone, className, children }: { zone: string; className: string; children: React.ReactNode }) {
    const { isOver, setNodeRef } = useDroppable({ id: `preview-zone-${zone}` });
    return (
        <div ref={setNodeRef} className={`${className} transition-all duration-200 ${isOver ? 'ring-4 ring-primary bg-primary/10 rounded-lg min-h-[60px] scale-[1.02]' : ''}`}>
            {children}
            {isOver && <div className="py-2 text-center text-[10px] font-bold text-primary animate-pulse w-full">วางที่นี่...</div>}
        </div>
    );
}

export const HomepagePreview = ({
    layout,
    selectedBlock,
    onSelectBlock,
    activeZone,
    hoveredBlock,
    hoverSource,
    onHoverPreviewBlock,
}: HomepagePreviewProps) => {

    useEffect(() => {
        if (hoveredBlock && hoverSource === 'palette') {
            const el = document.getElementById(`preview-block-${hoveredBlock}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [hoveredBlock, hoverSource]);

    const renderZone = (zone: ZoneKey, className: string) => {
        const { blocks, hidden } = layout[zone];

        return (
            <DroppableZone zone={zone} className={className}>
                {blocks
                    .filter((id) => !hidden.includes(id))
                    .map((id) => {
                        const Preview = ALL_PREVIEW_MAP[id];
                        if (!Preview) return null;
                        const isSelected = selectedBlock === id && activeZone === zone;
                        const isHoveredLocal = hoveredBlock === id;
                        return (
                            <div
                                id={`preview-block-${id}`}
                                key={id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectBlock(isSelected ? null : id);
                                }}
                                onMouseEnter={() => onHoverPreviewBlock?.(id, zone)}
                                onMouseLeave={() => onHoverPreviewBlock?.(null)}
                                className={`relative transition-all cursor-pointer ${isSelected || isHoveredLocal
                                        ? 'ring-2 ring-primary ring-offset-1 rounded-lg'
                                        : 'hover:ring-1 hover:ring-primary/30 rounded-lg'
                                    }`}
                            >
                                <Preview />
                                {isSelected && (
                                    <div className="absolute -top-2 -right-1 bg-primary text-primary-foreground text-[6px] px-1.5 py-0.5 rounded-full font-bold shadow-md z-10">
                                        ✏️ {ALL_BLOCKS_FLAT.find((b) => b.id === id)?.label}
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </DroppableZone>
        );
    };

    const hasVisibleHeader = layout.header.blocks.some((id) => !layout.header.hidden.includes(id));
    const hasVisibleFooter = layout.footer.blocks.some((id) => !layout.footer.hidden.includes(id));

    return (
        <div className="flex flex-col h-full">
            {/* Preview Header */}
            <div className="px-4 py-3 border-b border-border bg-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[10px] text-muted-foreground ml-2 bg-secondary px-2 py-0.5 rounded">
                        kampai-school.vercel.app
                    </span>
                </div>
                <span className="text-[10px] text-muted-foreground">Preview (60%)</span>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
                <div
                    className="mx-auto origin-top-left"
                    style={{ width: '100%', maxWidth: '720px' }}
                >
                    {/* Fake Site Header */}
                    <div className="bg-white border-b border-gray-200 rounded-t-lg px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-[7px] text-white font-bold">คผ</span>
                            </div>
                            <div>
                                <div className="h-1.5 bg-gray-300 rounded w-16" />
                                <div className="h-1 bg-gray-200 rounded w-10 mt-0.5" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {['หน้าแรก', 'เกี่ยวกับ', 'บุคลากร', 'ข่าว', 'ติดต่อ'].map((n) => (
                                <span key={n} className="text-[6px] text-gray-500">{n}</span>
                            ))}
                        </div>
                    </div>

                    {/* Header Zone — news ticker, banners */}
                    {hasVisibleHeader && (
                        <div className={`bg-white ${activeZone === 'header' ? 'ring-2 ring-primary/20' : ''}`}>
                            {renderZone('header', 'flex flex-col gap-0')}
                        </div>
                    )}

                    {/* 3-Column Layout */}
                    <div className="bg-gray-100 p-2">
                        <div className="grid gap-2" style={{ gridTemplateColumns: '60px 1fr 80px' }}>
                            {/* Left Sidebar */}
                            {renderZone('left', 'flex flex-col gap-1.5')}

                            {/* Main Content */}
                            {renderZone('main', 'flex flex-col gap-2')}

                            {/* Right Sidebar */}
                            {renderZone('right', 'flex flex-col gap-1.5')}
                        </div>
                    </div>

                    {/* Footer Zone */}
                    <div className={`bg-gray-800 text-white rounded-b-lg px-3 py-2 ${activeZone === 'footer' ? 'ring-2 ring-primary/40' : ''}`}>
                        {hasVisibleFooter ? (
                            <div className="grid grid-cols-4 gap-2">
                                {renderZone('footer', 'contents')}
                            </div>
                        ) : (
                            <div className="flex justify-between">
                                <div className="space-y-0.5">
                                    <div className="h-1.5 bg-white/30 rounded w-20" />
                                    <div className="h-1 bg-white/15 rounded w-14" />
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <div className="h-1.5 bg-white/30 rounded w-16 ml-auto" />
                                    <div className="h-1 bg-white/15 rounded w-10 ml-auto" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
