import { Link } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EduHubCategory, EduHubTeacherCard } from '@/services/educational-hub.service';

interface Props {
    teacher: EduHubTeacherCard;
    categories: EduHubCategory[];
}

export const TeacherHubCard = ({ teacher, categories }: Props) => {
    const counts = teacher.counts_by_category ?? {};

    return (
        <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            {/* Banner header — falls back to soft gradient */}
            <div
                className={cn(
                    'h-20 sm:h-24 relative',
                    teacher.banner_url ? '' : 'bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5',
                )}
                style={teacher.banner_url ? { backgroundImage: `url(${teacher.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
                {/* External link pill */}
                {teacher.external_url && (
                    <a
                        href={teacher.external_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur px-2 py-1 text-[10px] font-medium text-foreground shadow-sm hover:bg-background"
                        title="เว็บส่วนตัวครู"
                    >
                        <ExternalLink className="h-3 w-3" />
                        เว็บส่วนตัว
                    </a>
                )}
            </div>

            <Link
                to={teacher.username ? `/h/${teacher.username}` : `/educational-hub/${teacher.staff_id}`}
                className="block p-4 -mt-8"
            >
                {/* Avatar overlapping the banner */}
                <div className="relative inline-block">
                    <div className="rounded-full bg-background p-1 shadow-md">
                        <PersonAvatar name={teacher.name} photoUrl={teacher.photo_url} size="lg" />
                    </div>
                </div>

                <div className="mt-3 space-y-1">
                    <h3 className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors">
                        {teacher.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{teacher.position}</p>
                    {teacher.subject && (
                        <Badge variant="outline" className="text-[10px]">{teacher.subject}</Badge>
                    )}
                </div>

                {teacher.hub_bio && (
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{teacher.hub_bio}</p>
                )}

                {/* Per-category counts */}
                {teacher.total_items > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {categories.map((cat) => {
                            const n = counts[cat.category_key] ?? 0;
                            if (n <= 0) return null;
                            return (
                                <span
                                    key={cat.id}
                                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground"
                                    title={cat.name}
                                >
                                    <span className="font-semibold">{n}</span>
                                    <span className="text-muted-foreground">{cat.name}</span>
                                </span>
                            );
                        })}
                    </div>
                )}

                {teacher.total_items === 0 && (
                    <p className="mt-4 text-xs text-muted-foreground italic">ยังไม่มีสื่อในคลัง</p>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        ดูคลังของครู
                        <ArrowRight className="h-3 w-3" />
                    </span>
                    <span className="text-[10px] text-muted-foreground">รวม {teacher.total_items} รายการ</span>
                </div>
            </Link>
        </Card>
    );
};
