/**
 * TeacherHubCard.tsx — supports 4 layout variants
 *
 * - grid (default)   : Portrait Stack (4:5 photo on top, info below)
 * - featured         : Same as grid but col-span-2 + larger fonts + bio 3 lines
 * - list             : Horizontal (photo left h-28 + info right)
 * - compact          : 1-line row (avatar + name + position + count + arrow)
 *
 * Photo never distorts thanks to aspect-[X/Y] + object-cover object-top.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ExternalLink, ChevronRight, Folder } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import type { EduHubCategory, EduHubTeacherCard } from '@/services/educational-hub.service';

export type CardVariant = 'grid' | 'featured' | 'list' | 'compact';

interface Props {
    teacher: EduHubTeacherCard;
    categories: EduHubCategory[];
    variant?: CardVariant;
}

export const TeacherHubCard = ({ teacher, categories, variant = 'grid' }: Props) => {
    const counts = teacher.counts_by_category ?? {};

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

    const topCategories = useMemo(() => {
        return categories.filter((c) => (counts[c.id] ?? 0) > 0).slice(0, 4);
    }, [categories, counts]);

    const linkTo = teacher.username
        ? `/h/${teacher.username}`
        : `/educational-hub/${teacher.staff_id}`;

    // ─── Compact: 1-line row ─────────────────────────────────────────────
    if (variant === 'compact') {
        return (
            <Link to={linkTo} className="group block">
                <Card className="flex items-center gap-3 p-2 hover:bg-accent/30 transition-colors">
                    <div className="rounded-full bg-background p-0.5 shadow-sm shrink-0">
                        <PersonAvatar name={teacher.name} photoUrl={teacher.photo_url} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                            {teacher.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {teacher.position}
                            {teacher.subject && ` · ${teacher.subject}`}
                        </p>
                    </div>
                    <span className="text-xs shrink-0">
                        <span className="font-bold text-primary">{teacher.total_items}</span>
                        <span className="text-muted-foreground ml-0.5">รายการ</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Card>
            </Link>
        );
    }

    // ─── List: horizontal row (photo left, info right) ───────────────────
    if (variant === 'list') {
        return (
            <Link to={linkTo} className="group block">
                <Card className="flex gap-3 p-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    {/* Photo — square h-28 w-28 */}
                    <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-lg overflow-hidden bg-muted">
                        {teacher.photo_url ? (
                            <img
                                src={teacher.photo_url}
                                alt={teacher.name}
                                loading="lazy"
                                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <FallbackInitials initials={initials} large={false} />
                        )}
                    </div>
                    {/* Body */}
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-foreground text-base leading-tight group-hover:text-primary">
                                    {teacher.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {teacher.position}
                                    {teacher.department && ` · ${teacher.department}`}
                                </p>
                            </div>
                            {teacher.external_url && (
                                <ExternalUrlPill href={teacher.external_url} />
                            )}
                        </div>
                        {teacher.subject && (
                            <Badge variant="outline" className="text-[10px] self-start mt-1.5">
                                {teacher.subject}
                            </Badge>
                        )}
                        {teacher.hub_bio && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                                {teacher.hub_bio}
                            </p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {topCategories.map((cat) => (
                                    <CategoryPill
                                        key={cat.id}
                                        iconName={cat.icon_name}
                                        label={cat.name}
                                        count={counts[cat.id] ?? 0}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-primary inline-flex items-center gap-1 font-medium group-hover:gap-1.5 transition-all">
                                <span className="font-bold">{teacher.total_items}</span>
                                <span>รายการ</span>
                                <ChevronRight className="h-4 w-4" />
                            </span>
                        </div>
                    </div>
                </Card>
            </Link>
        );
    }

    // ─── Grid + Featured: Portrait Stack ─────────────────────────────────
    const isFeatured = variant === 'featured';

    return (
        <Link to={linkTo} className={cn('group block', isFeatured && 'sm:col-span-2')}>
            <Card className="relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                {/* Photo block — 4:5 portrait */}
                <div className={cn(
                    'relative w-full overflow-hidden bg-muted',
                    isFeatured ? 'aspect-[3/2] sm:aspect-[2/1]' : 'aspect-[4/5]',
                )}>
                    {teacher.photo_url ? (
                        <img
                            src={teacher.photo_url}
                            alt={teacher.name}
                            loading="lazy"
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <FallbackInitials initials={initials} large />
                    )}

                    {teacher.external_url && (
                        <div className="absolute top-2 right-2 z-20">
                            <ExternalUrlPill href={teacher.external_url} />
                        </div>
                    )}

                    {isFeatured && (
                        <div className="absolute top-2 left-2 z-20">
                            <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] font-bold shadow">
                                ✨ แนะนำ
                            </Badge>
                        </div>
                    )}

                    {/* Bottom gradient overlay with name */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-10">
                        <h3 className={cn(
                            'text-white font-bold leading-tight line-clamp-2 drop-shadow',
                            isFeatured ? 'text-lg sm:text-xl' : 'text-sm sm:text-base',
                        )}>
                            {teacher.name}
                        </h3>
                        <p className={cn(
                            'text-white/85 mt-0.5 line-clamp-1 drop-shadow',
                            isFeatured ? 'text-xs sm:text-sm' : 'text-[11px]',
                        )}>
                            {teacher.position}
                            {teacher.department && ` · ${teacher.department}`}
                        </p>
                    </div>
                </div>

                {/* Body block */}
                <div className={cn(
                    'flex flex-col flex-1 space-y-2',
                    isFeatured ? 'p-4 space-y-3' : 'p-3',
                )}>
                    {teacher.subject && (
                        <Badge variant="outline" className="text-[10px] self-start">
                            {teacher.subject}
                        </Badge>
                    )}

                    {teacher.hub_bio ? (
                        <p className={cn(
                            'text-muted-foreground flex-1',
                            isFeatured ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2',
                        )}>
                            {teacher.hub_bio}
                        </p>
                    ) : (
                        <div className="flex-1" />
                    )}

                    {topCategories.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                            {topCategories.map((cat) => (
                                <CategoryPill
                                    key={cat.id}
                                    iconName={cat.icon_name}
                                    label={cat.name}
                                    count={counts[cat.id] ?? 0}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-[10px] text-muted-foreground italic">ยังไม่มีสื่อในคลัง</p>
                    )}

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

// ─── Helper components ──────────────────────────────────────────────────────

const FallbackInitials = ({ initials, large }: { initials: string; large: boolean }) => (
    <div className="w-full h-full bg-gradient-to-br from-primary/40 via-primary/30 to-accent/30 flex items-center justify-center">
        <span className={cn(
            'font-bold text-white/70 drop-shadow-lg select-none',
            large ? 'text-5xl sm:text-6xl' : 'text-2xl sm:text-3xl',
        )}>
            {initials || '?'}
        </span>
    </div>
);

const ExternalUrlPill = ({ href }: { href: string }) => (
    <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur px-2 py-1 text-[10px] font-medium text-foreground shadow-sm hover:bg-background hover:scale-105 transition-transform"
        title="เว็บส่วนตัวครู"
    >
        <ExternalLink className="h-3 w-3" />
        <span className="hidden sm:inline">เว็บส่วนตัว</span>
    </a>
);

const CategoryPill = ({
    iconName, label, count,
}: { iconName: string; label: string; count: number }) => {
    const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] ?? Folder;
    return (
        <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted/70"
            title={label}
        >
            <Icon className="h-3 w-3" />
            <span className="font-semibold text-foreground">{count}</span>
        </span>
    );
};
