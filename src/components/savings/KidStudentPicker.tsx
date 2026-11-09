import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, RefreshCw, Sparkles } from 'lucide-react';
import { studentsService } from '@/services/students.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

interface Props {
  onSelectCode: (code: string) => void;
  selectedCode?: string;
}

export const KidStudentPicker = ({ onSelectCode, selectedCode }: Props) => {
  const [selectedClass, setSelectedClass] = useState<string>('ป.1');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students-by-class-public', selectedClass],
    queryFn: async () => {
      const res = await studentsService.getByClass(selectedClass);
      return res.data ?? [];
    },
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      {/* Step 1: Class Selector Pills */}
      <div>
        <label className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
            1
          </span>
          เลือกระดับชั้นเรียนของคุณ:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CLASSES.map((cls) => {
            const isActive = selectedClass === cls;
            return (
              <Button
                key={cls}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedClass(cls)}
                className={cn(
                  'h-8 text-xs font-bold transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {cls}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Student Grid by Photo & Roll Number */}
      <div>
        <label className="text-xs font-bold text-foreground mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
              2
            </span>
            จิ้มที่รูปหรือชื่อของคุณ (ชั้น {selectedClass}):
          </span>
          <span className="text-[11px] text-muted-foreground font-normal">
            พบ {students.length} คน
          </span>
        </label>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
            <p className="text-xs">กำลังโหลดรายชื่อนักเรียน...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
            <Users className="w-6 h-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">ไม่พบรายชื่อในชั้นนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto p-1">
            {students.map((st) => {
              const isSelected = selectedCode && st.student_code === selectedCode;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    if (st.student_code) {
                      onSelectCode(st.student_code);
                    }
                  }}
                  className={cn(
                    'p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer',
                    isSelected
                      ? 'border-amber-400 bg-amber-500/15 shadow-sm ring-2 ring-amber-400/30'
                      : 'border-border/80 bg-card hover:bg-muted/40 hover:border-border'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <PersonAvatar
                      name={st.name}
                      photoUrl={st.photo_url}
                      size="sm"
                    />
                    <span className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-background border border-border text-[9px] font-black flex items-center justify-center text-foreground tabular-nums shadow-2xs">
                      {st.class_number ?? '—'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {st.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      เลขที่ {st.class_number ?? '—'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
