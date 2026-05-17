import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mailbox, MailOpen, SendHorizontal, Stamp, CalendarCheck, BookMarked,
    UserX, Award, Wallet, GraduationCap, ClipboardCheck, ShieldCheck,
    Target, FileText, FolderOpen, FileQuestion,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DocCategoryMeta } from '@/services/docs-hub.service';
import { CategoryCard, type CategoryCardTone } from './CategoryCard';

/**
 * ICON_MAP — explicit lookup จาก icon_name → component
 * ใช้แทน `import * as Lucide` เพื่อให้ Vite tree-shake icons ที่ไม่ได้ใช้
 * (ลดขนาด chunk จาก 721 KB → ~50 KB)
 */
const ICON_MAP: Record<string, LucideIcon> = {
    Mailbox, MailOpen, SendHorizontal, Stamp, CalendarCheck, BookMarked,
    UserX, Award, Wallet, GraduationCap, ClipboardCheck, ShieldCheck,
    Target, FileText, FolderOpen,
};

const isValidTone = (s: string): s is CategoryCardTone =>
    ['primary', 'success', 'warning', 'danger', 'info', 'accent', 'muted'].includes(s);

interface CategoryGridProps {
    categories: DocCategoryMeta[];
    counts?: Record<string, number | string | null>;
    badges?: Record<string, string>;
    className?: string;
}

export const CategoryGrid = ({ categories, counts, badges, className }: CategoryGridProps) => {
    const navigate = useNavigate();
    const items = useMemo(() => categories, [categories]);

    return (
        <div className={className ?? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'}>
            {items.map((cat) => (
                <CategoryCard
                    key={cat.key}
                    label={cat.label}
                    description={cat.description}
                    icon={ICON_MAP[cat.icon_name] ?? FileQuestion}
                    emoji={cat.emoji}
                    tone={isValidTone(cat.color_class) ? cat.color_class : 'primary'}
                    count={counts?.[cat.key] ?? null}
                    badge={badges?.[cat.key] ?? null}
                    onClick={() => navigate(cat.route)}
                />
            ))}
        </div>
    );
};
