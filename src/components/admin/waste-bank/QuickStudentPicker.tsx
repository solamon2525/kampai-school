import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PersonAvatar } from '@/components/shared/PersonAvatar';

export interface StudentOption {
  id: string;
  name: string;
  class: string;
  photo_url: string | null;
}

interface QuickStudentPickerProps {
  classes: string[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
  students: StudentOption[];
  loadingStudents: boolean;
  selectedStudentId: string;
  onStudentSelect: (id: string, name: string) => void;
}

interface StudentCardProps {
  student: StudentOption;
  isSelected: boolean;
  onSelect: (id: string, name: string) => void;
}

const StudentCard = memo(function StudentCard({ student, isSelected, onSelect }: StudentCardProps) {
  const handleClick = useCallback(() => {
    onSelect(student.id, student.name);
  }, [onSelect, student.id, student.name]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all transform-gpu will-change-transform',
        isSelected
          ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-1'
          : 'border-border bg-card hover:bg-muted hover:border-primary/50'
      )}
    >
      <PersonAvatar
        name={student.name}
        photoUrl={student.photo_url}
        size="lg"
        className="h-16 w-16 aspect-square rounded-xl shrink-0"
      />
      <span className="text-xs text-center leading-tight line-clamp-2 text-foreground w-full">
        {student.name}
      </span>
    </button>
  );
});

export const QuickStudentPicker = memo(function QuickStudentPicker({
  classes,
  selectedClass,
  onClassChange,
  students,
  loadingStudents,
  selectedStudentId,
  onStudentSelect,
}: QuickStudentPickerProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      {/* Class buttons */}
      <div className="flex flex-row flex-wrap md:flex-col md:w-24 gap-1.5 shrink-0">
        {classes.map((cls) => (
          <button
            key={cls}
            type="button"
            onClick={() => onClassChange(cls)}
            className={cn(
              'px-3 py-2 text-sm font-semibold rounded-lg border transition-colors text-center transform-gpu',
              selectedClass === cls
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-muted text-foreground'
            )}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Student grid */}
      <div className="flex-1 min-h-[140px]">
        {!selectedClass && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            เลือกชั้นก่อน
          </div>
        )}
        {selectedClass && loadingStudents && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            กำลังโหลด...
          </div>
        )}
        {selectedClass && !loadingStudents && students.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            ไม่พบนักเรียนในชั้นนี้
          </div>
        )}
        {selectedClass && !loadingStudents && students.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {students.map((s) => (
              <StudentCard
                key={s.id}
                student={s}
                isSelected={selectedStudentId === s.id}
                onSelect={onStudentSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
