import { useMemo } from 'react';
import { addDays, format, startOfWeek, subDays, isSameMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * GitHub-style activity heatmap.
 * `data` = Map of "YYYY-MM-DD" → count.
 * Renders a Sun→Sat grid spanning the last N weeks (default 52).
 */

export interface ActivityHeatmapProps {
  data: Record<string, number>;
  weeks?: number;
  title?: string;
  className?: string;
  /** Custom intensity thresholds — defaults to [1, 3, 5, 10]. */
  thresholds?: [number, number, number, number];
  /** Show month labels above grid. */
  showMonths?: boolean;
}

const DEFAULT_THRESHOLDS: [number, number, number, number] = [1, 3, 5, 10];
const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MONTH_LABELS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const intensityClass = (count: number, t: [number, number, number, number]) => {
  if (count === 0) return 'bg-muted/40 hover:bg-muted';
  if (count < t[0]) return 'bg-primary/20 hover:bg-primary/30';
  if (count < t[1]) return 'bg-primary/40 hover:bg-primary/50';
  if (count < t[2]) return 'bg-primary/60 hover:bg-primary/70';
  if (count < t[3]) return 'bg-primary/80 hover:bg-primary/90';
  return 'bg-primary hover:bg-primary';
};

export const ActivityHeatmap = ({
  data,
  weeks = 52,
  title,
  className,
  thresholds = DEFAULT_THRESHOLDS,
  showMonths = true,
}: ActivityHeatmapProps) => {
  const grid = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(subDays(today, weeks * 7 - 1), { weekStartsOn: 0 });
    const cols: Array<Array<{ date: Date; count: number; key: string }>> = [];
    for (let w = 0; w < weeks; w++) {
      const col: Array<{ date: Date; count: number; key: string }> = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const key = format(date, 'yyyy-MM-dd');
        col.push({ date, key, count: date > today ? -1 : data[key] ?? 0 });
      }
      cols.push(col);
    }
    return cols;
  }, [data, weeks]);

  const monthHeaders = useMemo(() => {
    if (!showMonths) return [];
    const headers: Array<{ col: number; label: string }> = [];
    grid.forEach((col, i) => {
      const firstDate = col[0].date;
      if (i === 0 || !isSameMonth(firstDate, grid[i - 1][0].date)) {
        headers.push({ col: i, label: MONTH_LABELS_TH[firstDate.getMonth()] });
      }
    });
    return headers;
  }, [grid, showMonths]);

  const totalContributions = useMemo(
    () => Object.values(data).reduce((acc, n) => acc + n, 0),
    [data],
  );

  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground">{totalContributions.toLocaleString()} ครั้ง · {weeks} สัปดาห์</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {showMonths && (
            <div className="grid grid-flow-col gap-[2px] mb-1 pl-7" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}>
              {grid.map((_, i) => {
                const header = monthHeaders.find((h) => h.col === i);
                return (
                  <span key={i} className="text-[10px] text-muted-foreground h-3 leading-3 col-span-1">
                    {header?.label ?? ''}
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex gap-[2px]">
            <div className="flex flex-col gap-[2px] mr-1 text-[9px] text-muted-foreground">
              {DAY_LABELS.map((d, i) => (
                <span key={d} className="h-3 leading-3 w-5">
                  {i % 2 === 1 ? d : ''}
                </span>
              ))}
            </div>
            <div className="grid grid-flow-col gap-[2px]" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}>
              {grid.map((col, c) => (
                <div key={c} className="flex flex-col gap-[2px]">
                  {col.map((cell) => (
                    <div
                      key={cell.key}
                      title={cell.count === -1 ? '' : `${format(cell.date, 'd MMM yyyy', { locale: th })}: ${cell.count} ครั้ง`}
                      className={cn(
                        'w-3 h-3 rounded-[2px] transition-colors',
                        cell.count === -1 ? 'opacity-0' : intensityClass(cell.count, thresholds),
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2 pl-7">
            <span>น้อย</span>
            {[0, ...thresholds].map((n) => (
              <div key={n} className={cn('w-3 h-3 rounded-[2px]', intensityClass(n === 0 ? 0 : n, thresholds))} />
            ))}
            <span>มาก</span>
          </div>
        </div>
      </div>
    </div>
  );
};
