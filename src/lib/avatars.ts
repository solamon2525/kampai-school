export const getInitials = (name: string): string => {
    const w = name.trim().split(/\s+/);
    return w.length >= 2 ? (w[0]?.[0] ?? '') + (w[1]?.[0] ?? '') : name.slice(0, 2);
};
