/** Offset follows the actual page length, including servers capped below 1,000. */
export async function readBankPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const result: T[] = [];
  for (;;) {
    const { data, error } = await fetchPage(result.length, result.length + 999);
    if (error) throw error;
    if (!data?.length) return result;
    result.push(...data);
  }
}
