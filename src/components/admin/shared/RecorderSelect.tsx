import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useRecorderOptions } from '@/hooks/useRecorderOptions';
import { useAuth } from '@/contexts/AuthProvider';
import { cn } from '@/lib/utils';

export type RecorderValue = {
  staffId: string | null;
  administratorId: string | null;
  name: string;
};

export const EMPTY_RECORDER: RecorderValue = {
  staffId: null,
  administratorId: null,
  name: '',
};

interface Props {
  value: RecorderValue;
  onChange: (val: RecorderValue) => void;
  label?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const RecorderSelect = ({
  value,
  onChange,
  label = 'ผู้บันทึก',
  required,
  className,
  placeholder = 'เลือกครู/ผอ.',
}: Props) => {
  const { data: options = [], isLoading } = useRecorderOptions();
  const { staffId, administratorId } = useAuth();

  useEffect(() => {
    if (isLoading || options.length === 0) return;
    if (value.staffId || value.administratorId) return;
    const match = options.find(
      (o) =>
        (o.source === 'staff' && o.id === staffId) ||
        (o.source === 'administrator' && o.id === administratorId),
    );
    if (match) {
      onChange({
        staffId: match.source === 'staff' ? match.id : null,
        administratorId: match.source === 'administrator' ? match.id : null,
        name: match.name,
      });
    }
  }, [isLoading, options, staffId, administratorId, value.staffId, value.administratorId, onChange]);

  const selectedKey = value.staffId
    ? `staff:${value.staffId}`
    : value.administratorId
      ? `administrator:${value.administratorId}`
      : '';

  return (
    <div className={cn('space-y-1', className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select
        value={selectedKey}
        onValueChange={(key) => {
          const [source, id] = key.split(':') as ['staff' | 'administrator', string];
          const opt = options.find((o) => o.source === source && o.id === id);
          if (!opt) return;
          onChange({
            staffId: source === 'staff' ? id : null,
            administratorId: source === 'administrator' ? id : null,
            name: opt.name,
          });
        }}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? 'กำลังโหลด...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={`${o.source}:${o.id}`} value={`${o.source}:${o.id}`}>
              {o.name}
              {o.position ? ` (${o.position})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
