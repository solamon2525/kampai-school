import * as Icons from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EduHubItemCard } from './EduHubItemCard';
import type { EduHubCategory, EduHubItem } from '@/services/educational-hub.service';
import type { ViewMode } from '@/hooks/useViewMode';

interface Props {
    /** Pass null when rendering items outside a category (e.g. Favorites section) */
    category: EduHubCategory | null;
    items: EduHubItem[];
    viewMode?: ViewMode;
    isFavorite?: (id: string) => boolean;
    onToggleFavorite?: (id: string) => void;
    /** Skip rendering the section header (parent supplies its own) */
    hideHeader?: boolean;
}

const COLOR_TO_TEXT: Record<string, string> = {
    primary: 'text-primary',
    accent: 'text-accent-foreground',
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
    muted: 'text-muted-foreground',
};

const COLOR_TO_BG: Record<string, string> = {
    primary: 'bg-primary/10',
    accent: 'bg-accent/20',
    info: 'bg-blue-100',
    success: 'bg-green-100',
    warning: 'bg-amber-100',
    muted: 'bg-muted',
};

// Grid class per view mode — compact = 1 col list; grid = 2-3 cols; spotlight = 1-2 large
const GRID_CLASS: Record<ViewMode, string> = {
    compact: 'grid grid-cols-1 gap-2',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    spotlight: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
};

export const CategorySection = ({
    category,
    items,
    viewMode = 'grid',
    isFavorite,
    onToggleFavorite,
    hideHeader = false,
}: Props) => {
    const Icon = category
        ? ((Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[category.icon_name]
            ?? Icons.Folder)
        : Icons.Folder;

    const textColor = category ? (COLOR_TO_TEXT[category.color_class] ?? 'text-primary') : 'text-primary';
    const bgColor = category ? (COLOR_TO_BG[category.color_class] ?? 'bg-primary/10') : 'bg-primary/10';

    return (
        <section
            id={category ? `cat-${category.category_key}` : undefined}
            className="scroll-mt-24 space-y-4"
        >
            {!hideHeader && category && (
                <header className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">{category.name}</h2>
                        {category.description && (
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                        {items.length} รายการ
                    </span>
                </header>
            )}

            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 px-4 flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8 opacity-40" />
                    <p className="text-sm">ยังไม่มีในหมวดนี้</p>
                </div>
            ) : (
                <div className={cn(GRID_CLASS[viewMode])}>
                    {items.map((item) => (
                        <EduHubItemCard
                            key={item.id}
                            item={item}
                            viewMode={viewMode}
                            isFavorite={isFavorite?.(item.id) ?? false}
                            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};
