export const EDUCATIONAL_HUB_BATCH_SIZE = 120;

export type EducationalHubPageResult<T> = {
    data: T[];
    count: number;
    error: Error | null;
};

export const collectAllEducationalHubItems = async <T extends { id: string }, TOptions extends object>(
    fetchPage: (options: TOptions & { limit: number; offset: number }) => Promise<EducationalHubPageResult<T>>,
    options: TOptions,
): Promise<EducationalHubPageResult<T>> => {
    const firstPage = await fetchPage({ ...options, limit: EDUCATIONAL_HUB_BATCH_SIZE, offset: 0 });
    if (firstPage.error) return { data: [], count: firstPage.count, error: firstPage.error };

    const expectedCount = firstPage.count;
    const offsets = Array.from(
        { length: Math.max(0, Math.ceil(expectedCount / EDUCATIONAL_HUB_BATCH_SIZE) - 1) },
        (_, index) => (index + 1) * EDUCATIONAL_HUB_BATCH_SIZE,
    );
    const remainingPages = await Promise.all(offsets.map((offset) => fetchPage({
        ...options,
        limit: EDUCATIONAL_HUB_BATCH_SIZE,
        offset,
    })));
    const failedPage = remainingPages.find((page) => page.error);
    if (failedPage?.error) return { data: [], count: expectedCount, error: failedPage.error };

    const countChanged = remainingPages.some((page) => page.count !== expectedCount);
    const data = [firstPage, ...remainingPages].flatMap((page) => page.data);
    const uniqueIds = new Set(data.map((item) => item.id));
    if (countChanged || data.length !== expectedCount || uniqueIds.size !== expectedCount) {
        return {
            data: [],
            count: expectedCount,
            error: new Error('โหลดรายการสื่อไม่ครบหรือพบรายการซ้ำ กรุณาลองใหม่'),
        };
    }

    return { data, count: expectedCount, error: null };
};
