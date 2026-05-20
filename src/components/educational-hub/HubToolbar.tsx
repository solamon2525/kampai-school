/**
 * HubToolbar.tsx
 *
 * Top toolbar for /educational-hub teacher list page:
 * - Search input (filters by name/subject/department)
 * - View mode toggle (grid / list / compact / featured)
 * - Column selector (visible only for grid/featured): 3 | 4 | 5 | 6
 * - Sort dropdown
 *
 * State owned by parent (EducationalHub) via useHubViewMode hook.
 */

import { Search, X, Grid3x3, Rows, AlignJustify, Star, ArrowUpDown, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { HubViewMode, HubColumns, HubSort } from '@/hooks/useHubViewMode';

const SORT_LABEL: Record<HubSort, string> = {
    default: 'ลำดับตั้งต้น',
    popular: 'ยอดนิยม',
    alpha: 'ก-ฮ / A-Z',
    newest: 'อัพเดทล่าสุด',
};

interface Props {
    search: string;
    onSearchChange: (v: string) => void;
    viewMode: HubViewMode;
    onViewModeChange: (m: HubViewMode) => void;
    columns: HubColumns;
    onColumnsChange: (c: HubColumns) => void;
    sort: HubSort;
    onSortChange: (s: HubSort) => void;
    totalCount: number;
    visibleCount: number;
    /** When true, admin has locked the layout — disable layout controls (search still works) */
    readonly?: boolean;
}

export const HubToolbar = ({
    search, onSearchChange,
    viewMode, onViewModeChange,
    columns, onColumnsChange,
    sort, onSortChange,
    totalCount, visibleCount,
    readonly = false,
}: Props) => {
    const showColumns = viewMode === 'grid' || viewMode === 'featured';

    return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm space-y-2">
            <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาชื่อครู / วิชา / ฝ่าย..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-7 h-9"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="ล้างคำค้น"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* View mode toggle */}
                <div className={cn('inline-flex rounded-md border border-border overflow-hidden', readonly && 'opacity-50')}>
                    <ViewBtn icon={Grid3x3} active={viewMode === 'grid'} onClick={() => onViewModeChange('grid')} title="ตาราง" disabled={readonly} />
                    <ViewBtn icon={Star} active={viewMode === 'featured'} onClick={() => onViewModeChange('featured')} title="เด่นตัวแรก" disabled={readonly} />
                    <ViewBtn icon={Rows} active={viewMode === 'list'} onClick={() => onViewModeChange('list')} title="รายการ" disabled={readonly} />
                    <ViewBtn icon={AlignJustify} active={viewMode === 'compact'} onClick={() => onViewModeChange('compact')} title="กะทัดรัด" disabled={readonly} />
                </div>

                {/* Column selector */}
                {showColumns && (
                    <div className={cn('inline-flex rounded-md border border-border overflow-hidden', readonly && 'opacity-50')}>
                        {([3, 4, 5, 6] as HubColumns[]).map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => onColumnsChange(c)}
                                disabled={readonly}
                                className={cn(
                                    'h-9 px-2 text-xs font-medium transition-colors min-w-[28px]',
                                    columns === c
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card text-foreground hover:bg-accent',
                                    readonly && 'cursor-not-allowed',
                                )}
                                aria-pressed={columns === c}
                                title={`${c} คอลัมน์`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}

                {/* Sort dropdown */}
                <Select value={sort} onValueChange={(v) => onSortChange(v as HubSort)} disabled={readonly}>
                    <SelectTrigger className={cn('w-[160px] h-9', readonly && 'opacity-50 cursor-not-allowed')}>
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(SORT_LABEL) as HubSort[]).map((s) => (
                            <SelectItem key={s} value={s}>{SORT_LABEL[s]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Lock badge + Count */}
                <div className="flex items-center gap-2 ml-auto">
                    {readonly && (
                        <Badge
                            variant="secondary"
                            className="text-[10px] gap-1 bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100"
                            title="แอดมินล็อกการแสดงผลไว้ — ผู้ใช้ทุกคนเห็นเหมือนกัน"
                        >
                            <Lock className="h-3 w-3" />
                            ล็อกโดยแอดมิน
                        </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                        {visibleCount === totalCount
                            ? `${totalCount} ท่าน`
                            : `${visibleCount}/${totalCount} ท่าน`}
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─── Subcomponent ────────────────────────────────────────────────────────────

const ViewBtn = ({
    icon: Icon, active, onClick, title, disabled,
}: {
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    onClick: () => void;
    title: string;
    disabled?: boolean;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={title}
        aria-pressed={active}
        className={cn(
            'h-9 w-9 inline-flex items-center justify-center transition-colors',
            active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-accent',
            disabled && 'cursor-not-allowed',
        )}
    >
        <Icon className="h-4 w-4" />
    </button>
);
