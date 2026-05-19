/**
 * TeacherHubCard.tsx — Portrait Stack design
 *
 * Layout:
 *   ┌─────────────────────────┐
 *   │ [PHOTO 4:5 aspect]      │  ← teacher.photo_url, object-cover object-top
 *   │   ┌─────────────────┐   │  ← bottom gradient overlay
 *   │   │ Name            │   │     name (white, bold)
 *   │   │ Position        │   │     position (white/85, xs)
 *   │   └─────────────────┘   │
 *   ├─────────────────────────┤
 *   │ [Subject][Dept]         │  badge row
 *   │ Bio 2 lines             │  hub_bio
 *   │ ───────────             │
 *   │ 📁 6  🎮 3  ✏️ 2        │  per-category counts (small)
 *   │ 11 รายการ          →    │  total + arrow
 *   └─────────────────────────┘
 *
 * Photo never distorts — fixed aspect-[4/5] + object-cover + object-top so
 * the face stays in frame even on weird image ratios.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ExternalLink, ChevronRight, Folder } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EduHubCategory, EduHubTeacherCard } from '@/services/educational-hub.service';

interface Props {
    teacher: EduHubTeacherCard;
    categories: EduHubCategory[];
}

export const TeacherHubCard = ({ teacher, categories }: Props) => {
    const counts = teacher.counts_by_category ?? {};

    // Initials for fallback when no photo
    const initials = useMemo(() => {
        return teacher.name
            .replace(/[นาง|นาย|นางสาว|ครู]\s*/g, '')
            .trim()
            .split(/\s+/)
            .map((s) => s[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('');
    }, [teacher.name]);

    // Top categories with non-zero counts (max 4)
    const topCategories = useMemo(() => {
        return categories
            .filter((c) => (counts[c.category_key] ?? 0) > 0)
            .slice(0, 4);
    }, [categories, counts]);

    const linkTo = teacher.username
        ? `/h/${teacher.username}`
        : `/educational-hub/${teacher.staff_id}`;

    return (
        <Link to={linkTo} className="group block">
            <Card className="relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                {/* Photo block — 4:5 portrait */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                    {teacher.photo_url ? (
                        <img
                            src={teacher.photo_url}
                            alt={teacher.name}
                            loading="lazy"
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        // Fallback: gradient + initials
                        <div className="w-full h-full bg-gradient-to-br from-primary/40 via-primary/30 to-accent/30 flex items-center justify-center">
                            <span className="text-5xl sm:text-6xl font-bold text-white/70 drop-shadow-lg select-none">
                                {initials || '?'}
                            </span>
                        </div>
                    )}

                    {/* External link pill — top-right */}
                    {teacher.external_url && (
                        <a
                            href={teacher.external_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 right-2 z-20 inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur px-2 py-1 text-[10px] font-medium text-foreground shadow-sm hover:bg-background hover:scale-105 transition-transform"
                            title="เว็บส่วนตัวครู"
                        >
                            <ExternalLink className="h-3 w-3" />
                            <span className="hidden sm:inline">เว็บส่วนตัว</span>
                        </a>
                    )}

                    {/* Bottom gradient overlay with name */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-10">
                        <h3 className="text-white font-bold text-sm sm:text-base leading-tight line-clamp-2 drop-shadow">
                            {teacher.name}
                        </h3>
                        <p className="text-white/85 text-[11px] mt-0.5 line-clamp-1 drop-shadow">
                            {teacher.position}
                            {teacher.department && ` · ${teacher.department}`}
                        </p>
                    </div>
                </div>

                {/* Body block */}
                <div className="p-3 flex flex-col flex-1 space-y-2">
                    {/* Subject badge */}
                    {teacher.subject && (
                        <Badge variant="outline" className="text-[10px] self-start">
                            {teacher.subject}
                        </Badge>
                    )}

                    {/* Bio */}
                    {teacher.hub_bio ? (
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                            {teacher.hub_bio}
                        </p>
                    ) : (
                        <div className="flex-1" />
                    )}

                    {/* Category counts row */}
                    {topCategories.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                            {topCategories.map((cat) => (
                                <CategoryPill
                                    key={cat.id}
                                    iconName={cat.icon_name}
                                    label={cat.name}
                                    count={counts[cat.category_key] ?? 0}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-[10px] text-muted-foreground italic">ยังไม่มีสื่อในคลัง</p>
                    )}

                    {/* Footer — total + arrow */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-xs">
                            <span className="font-bold text-primary">{teacher.total_items}</span>
                            <span className="text-muted-foreground ml-1">รายการ</span>
                        </span>
                        <span className="text-primary inline-flex items-center gap-0.5 text-xs font-medium group-hover:gap-1.5 transition-all">
                            <span className="hidden sm:inline">ดูคลัง</span>
                            <ChevronRight className="h-4 w-4" />
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
};

// ─── Helper component ──────────────────────────────────────────────────────

const CategoryPill = ({
    iconName,
    label,
    count,
}: {
    iconName: string;
    label: string;
    count: number;
}) => {
    const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] ?? Folder;
    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md',
                'bg-muted/70',
            )}
            title={label}
        >
            <Icon className="h-3 w-3" />
            <span className="font-semibold text-foreground">{count}</span>
        </span>
    );
};
