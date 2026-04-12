import { useMemo } from 'react';
import { MAIN_BLOCKS, RIGHT_BLOCKS, LEFT_BLOCKS } from './BlockPalette';

type ZoneKey = 'left' | 'main' | 'right';

interface HomepagePreviewProps {
    layout: Record<ZoneKey, { blocks: string[]; hidden: string[] }>;
    selectedBlock: string | null;
    onSelectBlock: (id: string | null) => void;
    activeZone: ZoneKey;
}

// Mini block renderers — lightweight previews (not actual components to keep it fast)
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
    news: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-purple-800 text-white px-2 py-1 flex items-center justify-between">
                <span className="text-[8px] font-semibold flex items-center gap-1">
                    <span className="w-0.5 h-2 bg-yellow-400 rounded-full inline-block" />
                    ข่าวสารล่าสุด
                </span>
                <span className="text-[6px] text-yellow-300">ดูทั้งหมด →</span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-gray-100">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 aspect-[4/3]" />
                <div className="col-span-2 grid grid-cols-2 gap-px">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-200 aspect-[4/3]" />
                    ))}
                </div>
            </div>
        </div>
    ),
    about: () => (
        <div className="bg-white border border-gray-200 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[6px] font-bold text-purple-700 uppercase border-l-2 border-purple-700 pl-1">ABOUT</span>
                <span className="text-[6px] text-gray-400">—</span>
                <span className="text-[7px] font-bold text-gray-800">WHO WE ARE</span>
            </div>
            <div className="space-y-1">
                <div className="h-1.5 bg-gray-200 rounded w-full" />
                <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                <div className="h-1.5 bg-gray-200 rounded w-1/2" />
            </div>
            <span className="text-[6px] text-purple-700 mt-1 inline-block">อ่านเพิ่มเติม →</span>
        </div>
    ),
    calendar: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-purple-800 text-white px-2 py-1">
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
};

const RightBlockPreview: Record<string, () => JSX.Element> = {
    categories: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-purple-800 text-white px-2 py-1 text-[7px] font-semibold">รายการหมวดหมู่</div>
            <div className="divide-y divide-gray-100">
                {['ข่าวประชาสัมพันธ์', 'กิจกรรม', 'ผลงาน'].map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1">
                        <div className={`w-1. h-1.5 rounded-full ${['bg-blue-500', 'bg-green-500', 'bg-purple-500'][i]}`} />
                        <span className="text-[6px] text-gray-700">{c}</span>
                    </div>
                ))}
            </div>
        </div>
    ),
    gallery: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-purple-800 text-white px-2 py-1 text-[7px] font-semibold">🖼️ ภาพกิจกรรม</div>
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
            <div className="bg-purple-800 text-white px-2 py-1 text-[7px] font-semibold">โซเชียลมีเดีย</div>
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
            <div className="bg-purple-800 text-white px-2 py-1 text-[7px] font-semibold">👥 สถิติผู้เข้าชม</div>
            <div className="divide-y divide-gray-100">
                {['วันนี้', 'เมื่อวาน', 'ทั้งหมด'].map((l, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1">
                        <span className="text-[6px] text-gray-600">{l}</span>
                        <span className="text-[7px] font-bold text-purple-700">{[42, 38, 1280][i]}</span>
                    </div>
                ))}
            </div>
        </div>
    ),
    documents: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-purple-800 text-white px-2 py-1 text-[7px] font-semibold">📄 เอกสารล่าสุด</div>
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
            <div className="bg-purple-800 text-white px-2 py-1 text-[7px] font-semibold">👤 ผู้อำนวยการ</div>
            <div className="p-2 text-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 mx-auto mb-1 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">ผ</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-1 bg-gray-100 rounded w-1/2 mx-auto mt-0.5" />
            </div>
        </div>
    ),
    menu: () => (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-purple-800 text-white px-2 py-1 text-[7px] font-semibold">เมนูทาง</div>
            <div className="divide-y divide-gray-100">
                {['ประวัติ', 'บุคลากร', 'นักเรียน', 'หลักสูตร', 'แกลเลอรี่'].map((m, i) => (
                    <div key={i} className="px-2 py-1 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-sm bg-purple-300 flex-shrink-0" />
                        <span className="text-[6px] text-gray-700">{m}</span>
                    </div>
                ))}
            </div>
        </div>
    ),
};

const PREVIEW_MAP: Record<ZoneKey, Record<string, () => JSX.Element>> = {
    main: MainBlockPreview,
    right: RightBlockPreview,
    left: LeftBlockPreview,
};

export const HomepagePreview = ({
    layout,
    selectedBlock,
    onSelectBlock,
    activeZone,
}: HomepagePreviewProps) => {

    const renderZone = (zone: ZoneKey, className: string) => {
        const { blocks, hidden } = layout[zone];
        const previews = PREVIEW_MAP[zone];

        return (
            <div className={className}>
                {blocks
                    .filter((id) => !hidden.includes(id))
                    .map((id) => {
                        const Preview = previews[id];
                        if (!Preview) return null;
                        const isSelected = selectedBlock === id && activeZone === zone;
                        return (
                            <div
                                key={id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectBlock(isSelected ? null : id);
                                }}
                                className={`relative transition-all cursor-pointer ${
                                    isSelected
                                        ? 'ring-2 ring-primary ring-offset-1 rounded-lg'
                                        : 'hover:ring-1 hover:ring-primary/30 rounded-lg'
                                }`}
                            >
                                <Preview />
                                {isSelected && (
                                    <div className="absolute -top-2 -right-1 bg-primary text-primary-foreground text-[6px] px-1.5 py-0.5 rounded-full font-bold shadow-md z-10">
                                        ✏️ {
                                            [...MAIN_BLOCKS, ...RIGHT_BLOCKS, ...LEFT_BLOCKS].find(
                                                (b) => b.id === id
                                            )?.label
                                        }
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>
        );
    };

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
                    {/* Fake Header */}
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

                    {/* Fake News Ticker */}
                    <div className="bg-purple-800 px-3 py-1 flex items-center gap-2">
                        <span className="text-[6px] text-yellow-400 font-bold flex-shrink-0">ข่าวด่วน</span>
                        <div className="h-1 bg-white/20 rounded flex-1" />
                    </div>

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

                    {/* Fake Footer */}
                    <div className="bg-gray-800 text-white rounded-b-lg px-3 py-2">
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
                    </div>
                </div>
            </div>
        </div>
    );
};
