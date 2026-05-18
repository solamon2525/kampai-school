import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EduHubCategory } from '@/services/educational-hub.service';

interface Props {
    categories: EduHubCategory[];
    counts: Record<string, number>;
}

export const CategoryChipStrip = ({ categories, counts }: Props) => {
    const [activeKey, setActiveKey] = useState<string | null>(null);

    // Highlight the section in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible[0]) {
                    const key = visible[0].target.id.replace('cat-', '');
                    setActiveKey(key);
                }
            },
            { rootMargin: '-100px 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
        );

        categories.forEach((c) => {
            const el = document.getElementById(`cat-${c.category_key}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [categories]);

    const handleClick = (key: string) => {
        const el = document.getElementById(`cat-${key}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (categories.length === 0) return null;

    return (
        <div className="sticky top-16 z-30 -mx-4 px-4 py-2 bg-background/90 backdrop-blur border-b border-border">
            <div className="container mx-auto max-w-6xl overflow-x-auto scrollbar-none">
                <div className="flex gap-2 min-w-max">
                    {categories.map((c) => {
                        const Icon =
                            (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon_name]
                            ?? Icons.Folder;
                        const n = counts[c.category_key] ?? 0;
                        const isActive = activeKey === c.category_key;
                        return (
                            <button
                                key={c.id}
                                onClick={() => handleClick(c.category_key)}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-card text-foreground border-border hover:bg-accent',
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="font-medium">{c.name}</span>
                                {n > 0 && (
                                    <span className={cn(
                                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                                        isActive ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
                                    )}>
                                        {n}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
