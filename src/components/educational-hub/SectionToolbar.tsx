/**
 * SectionToolbar.tsx
 *
 * Global toolbar above all category sections on EducationalHubTeacher page.
 * Controls: search, sort, view-mode, multi-select filters (subject/grade/tags/type).
 * State is owned by parent (URL-free state) — toolbar is purely presentational.
 */

import { useMemo } from 'react';
import { Search, X, Rows, Grid3x3, LayoutGrid, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/hooks/useViewMode';
import type { EduHubItem, EduHubItemType } from '@/services/educational-hub.service';

export type SortMode = 'default' | 'newest' | 'popular' | 'alpha';

export const SORT_LABEL: Record<SortMode, string> = {
    default: 'ลำดับเริ่มต้น',
    newest: 'ใหม่ล่าสุด',
    popular: 'ยอดนิยม',
    alpha: 'ก-ฮ / A-Z',
};

const TYPE_LABEL: Record<EduHubItemType, string> = {
    file: 'ไฟล์',
    link: 'ลิงก์',
    youtube: 'YouTube',
    text: 'ข้อความ',
};

export interface FilterState {
    search: string;
    subjects: string[];
    grades: string[];
    tags: string[];
    types: EduHubItemType[];
}

export const EMPTY_FILTER: FilterState = {
    search: '',
    subjects: [],
    grades: [],
    tags: [],
    types: [],
};

interface Props {
    filter: FilterState;
    onFilterChange: (next: FilterState) => void;
    sort: SortMode;
    onSortChange: (next: SortMode) => void;
    viewMode: ViewMode;
    onViewModeChange: (next: ViewMode) => void;
    /** All items (unfiltered) used to derive available filter options */
    allItems: EduHubItem[];
}

export const SectionToolbar = ({
    filter,
    onFilterChange,
    sort,
    onSortChange,
    viewMode,
    onViewModeChange,
    allItems,
}: Props) => {
    // Derive distinct filter options from items present in this teacher's collection
    const options = useMemo(() => {
        const subjects = new Set<string>();
        const grades = new Set<string>();
        const tags = new Set<string>();
        const types = new Set<EduHubItemType>();
        for (const it of allItems) {
            if (it.subject) subjects.add(it.subject);
            (it.grade_levels ?? []).forEach((g) => grades.add(g));
            (it.tags ?? []).forEach((t) => tags.add(t));
            types.add(it.item_type);
        }
        return {
            subjects: Array.from(subjects).sort(),
            grades: Array.from(grades).sort(),
            tags: Array.from(tags).sort(),
            types: Array.from(types).sort(),
        };
    }, [allItems]);

    const activeCount =
        (filter.search.trim() ? 1 : 0) +
        filter.subjects.length +
        filter.grades.length +
        filter.tags.length +
        filter.types.length;

    const toggleIn = <T,>(list: T[], value: T): T[] =>
        list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

    return (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3 shadow-sm">
            {/* Row 1: search + view-mode + sort + filter button */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาในชื่อ/คำอธิบาย"
                        value={filter.search}
                        onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
                        className="pl-7 h-9"
                    />
                    {filter.search && (
                        <button
                            type="button"
                            onClick={() => onFilterChange({ ...filter, search: '' })}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="ล้างคำค้น"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* View mode */}
                <div className="inline-flex rounded-md border border-border overflow-hidden">
                    <ViewBtn icon={Rows} active={viewMode === 'compact'} onClick={() => onViewModeChange('compact')} title="แสดงแบบกะทัดรัด" />
                    <ViewBtn icon={Grid3x3} active={viewMode === 'grid'} onClick={() => onViewModeChange('grid')} title="แสดงแบบตาราง" />
                    <ViewBtn icon={LayoutGrid} active={viewMode === 'spotlight'} onClick={() => onViewModeChange('spotlight')} title="แสดงแบบเด่น" />
                </div>

                {/* Sort */}
                <Select value={sort} onValueChange={(v) => onSortChange(v as SortMode)}>
                    <SelectTrigger className="w-[160px] h-9">
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(SORT_LABEL) as SortMode[]).map((s) => (
                            <SelectItem key={s} value={s}>{SORT_LABEL[s]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Filter popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-1">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            ตัวกรอง
                            {activeCount > 0 && (
                                <Badge className="ml-1 h-5 px-1.5 text-[10px]">{activeCount}</Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 max-h-[60vh] overflow-y-auto" align="end">
                        <div className="space-y-4">
                            <FilterGroup
                                title="วิชา"
                                options={options.subjects}
                                selected={filter.subjects}
                                onToggle={(v) => onFilterChange({ ...filter, subjects: toggleIn(filter.subjects, v) })}
                            />
                            <FilterGroup
                                title="ระดับชั้น"
                                options={options.grades}
                                selected={filter.grades}
                                onToggle={(v) => onFilterChange({ ...filter, grades: toggleIn(filter.grades, v) })}
                            />
                            <FilterGroup
                                title="แท็ก"
                                options={options.tags}
                                selected={filter.tags}
                                onToggle={(v) => onFilterChange({ ...filter, tags: toggleIn(filter.tags, v) })}
                            />
                            <FilterGroup
                                title="ประเภท"
                                options={options.types}
                                selected={filter.types}
                                onToggle={(v) => onFilterChange({ ...filter, types: toggleIn(filter.types, v as EduHubItemType) })}
                                labelMap={TYPE_LABEL}
                            />
                            {activeCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onFilterChange(EMPTY_FILTER)}
                                    className="w-full"
                                >
                                    ล้างตัวกรองทั้งหมด
                                </Button>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Row 2: active filter chips */}
            {activeCount > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                    {filter.subjects.map((s) => (
                        <ChipRemovable key={`s-${s}`} label={`วิชา: ${s}`} onRemove={() => onFilterChange({ ...filter, subjects: filter.subjects.filter((x) => x !== s) })} />
                    ))}
                    {filter.grades.map((g) => (
                        <ChipRemovable key={`g-${g}`} label={g} onRemove={() => onFilterChange({ ...filter, grades: filter.grades.filter((x) => x !== g) })} />
                    ))}
                    {filter.tags.map((t) => (
                        <ChipRemovable key={`t-${t}`} label={`#${t}`} onRemove={() => onFilterChange({ ...filter, tags: filter.tags.filter((x) => x !== t) })} />
                    ))}
                    {filter.types.map((t) => (
                        <ChipRemovable key={`type-${t}`} label={TYPE_LABEL[t]} onRemove={() => onFilterChange({ ...filter, types: filter.types.filter((x) => x !== t) })} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── small subcomponents ────────────────────────────────────────────────────

const ViewBtn = ({
    icon: Icon,
    active,
    onClick,
    title,
}: {
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    onClick: () => void;
    title: string;
}) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        aria-pressed={active}
        className={cn(
            'h-9 w-9 inline-flex items-center justify-center transition-colors',
            active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-accent',
        )}
    >
        <Icon className="h-4 w-4" />
    </button>
);

const FilterGroup = <T extends string>({
    title,
    options,
    selected,
    onToggle,
    labelMap,
}: {
    title: string;
    options: T[];
    selected: T[];
    onToggle: (value: T) => void;
    labelMap?: Record<string, string>;
}) => {
    if (options.length === 0) return null;
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-semibold text-foreground">{title}</p>
            <div className="flex flex-wrap gap-1">
                {options.map((opt) => {
                    const active = selected.includes(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => onToggle(opt)}
                            className={cn(
                                'px-2 py-0.5 text-[11px] rounded-full border transition-colors',
                                active
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-card text-foreground border-border hover:bg-accent',
                            )}
                        >
                            {labelMap?.[opt] ?? opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const ChipRemovable = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <Badge variant="secondary" className="text-[10px] gap-1 pr-1">
        {label}
        <button
            type="button"
            onClick={onRemove}
            className="ml-0.5 rounded-sm hover:bg-muted-foreground/20"
            aria-label={`ลบ ${label}`}
        >
            <X className="h-3 w-3" />
        </button>
    </Badge>
);
