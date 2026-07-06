import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { curriculumService } from '@/services/curriculum.service';

/** Batch ดึงตัวชี้วัดที่ผูกกับเกมหลายการ์ด — ใช้ใน GamesCategorySection / CategorySection */
export function useGameCardIndicators(itemIds: string[]) {
    const stableKey = useMemo(
        () => [...itemIds].sort().join(','),
        [itemIds],
    );

    return useQuery({
        queryKey: ['game-card-indicators', stableKey],
        queryFn: () => curriculumService.listIndicatorsByGameIds(itemIds),
        enabled: itemIds.length > 0,
        staleTime: 10 * 60 * 1000,
    });
}
