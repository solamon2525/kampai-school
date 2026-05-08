import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';

export type RecorderOption = {
  id: string;
  name: string;
  position: string | null;
  order_position: number;
  source: 'staff' | 'administrator';
};

export const useRecorderOptions = () =>
  useQuery({
    queryKey: ['recorder-options'],
    queryFn: async (): Promise<RecorderOption[]> => {
      const { data, error } = await staffService.getRecorderOptions();
      if (error) throw error;
      return (data ?? []) as RecorderOption[];
    },
    staleTime: 5 * 60 * 1000,
  });
