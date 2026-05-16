import { LayoutGrid, Boxes, Maximize2, Image, GanttChart, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode } from './types';

interface Props {
    value: ViewMode;
    onChange: (v: ViewMode) => void;
    isDark: boolean;
    onToggleDark: () => void;
}

const MODES: { id: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'grid', label: 'กริด', icon: LayoutGrid },
    { id: 'bento', label: 'เบนโตะ', icon: Boxes },
    { id: 'spotlight', label: 'ไฮไลท์', icon: Maximize2 },
    { id: 'polaroid', label: 'โพลารอยด์', icon: Image },
    { id: 'timeline', label: 'ไทม์ไลน์', icon: GanttChart },
];

export const ViewModeSwitcher = ({ value, onChange, isDark, onToggleDark }: Props) => {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-0.5 bg-muted rounded-lg border">
                {MODES.map((m) => {
                    const Icon = m.icon;
                    const active = value === m.id;
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => onChange(m.id)}
                            aria-pressed={active}
                            aria-label={m.label}
                            title={m.label}
                            className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                                active
                                    ? 'bg-card text-foreground shadow-sm ring-1 ring-violet-300'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60',
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{m.label}</span>
                        </button>
                    );
                })}
            </div>
            <button
                type="button"
                onClick={onToggleDark}
                aria-label={isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
                title={isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
                className="inline-flex items-center justify-center h-9 w-9 rounded-md border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
        </div>
    );
};
