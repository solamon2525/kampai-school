import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MenuConfig, MenuItem } from '@/lib/menuDefaults';
import { resolveMenuIcon } from '@/lib/menuIcons';

interface Props {
    config: MenuConfig;
}

/**
 * NavbarPreview — live mock of public navbar using the supplied draft config.
 * Uses inline style so it reflects unsaved changes immediately.
 *
 * Top-level items render inline; items with children render as a hover dropdown.
 */
export const NavbarPreview = ({ config }: Props) => {
    const { style, items } = config;
    const [openId, setOpenId] = useState<string | null>(null);

    const topLevel = useMemo(
        () => items.filter((i) => i.parent === null).sort((a, b) => a.order - b.order),
        [items]
    );

    const childrenByParent = useMemo(() => {
        const map = new Map<string, MenuItem[]>();
        items.forEach((i) => {
            if (i.parent) {
                const arr = map.get(i.parent) ?? [];
                arr.push(i);
                map.set(i.parent, arr);
            }
        });
        map.forEach((arr) => arr.sort((a, b) => a.order - b.order));
        return map;
    }, [items]);

    return (
        <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ตัวอย่างเมนู (Live Preview)
            </div>
            <nav
                className="rounded-lg overflow-visible border shadow-sm"
                style={{
                    backgroundColor: style.navBg,
                    color: style.navText,
                    borderColor: 'var(--border)',
                }}
            >
                <div className="flex flex-wrap items-stretch px-1">
                    {topLevel.map((item) => {
                        const Icon = resolveMenuIcon(item.icon);
                        const children = childrenByParent.get(item.id);
                        const hasChildren = !!children?.length;
                        const isOpen = openId === item.id;

                        return (
                            <div
                                key={item.id}
                                className="relative"
                                onMouseEnter={() => hasChildren && setOpenId(item.id)}
                                onMouseLeave={() => hasChildren && setOpenId(null)}
                            >
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 border-transparent"
                                    style={{
                                        color: style.navText,
                                        fontWeight: style.fontWeight as any,
                                        fontSize: style.fontSize,
                                    }}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                    {hasChildren && <ChevronDown className="w-3 h-3 opacity-70" />}
                                </button>

                                {hasChildren && isOpen && (
                                    <div
                                        className="absolute top-full left-0 mt-0.5 min-w-[180px] rounded-md shadow-lg border z-10"
                                        style={{
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--foreground)',
                                            borderColor: 'var(--border)',
                                        }}
                                    >
                                        {children!.map((child) => {
                                            const ChildIcon = resolveMenuIcon(child.icon);
                                            return (
                                                <div
                                                    key={child.id}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm"
                                                    style={{
                                                        color: 'var(--foreground)',
                                                        fontWeight: style.fontWeight as any,
                                                    }}
                                                >
                                                    <ChildIcon className="w-3.5 h-3.5 opacity-70" />
                                                    {child.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </nav>
            <p className="text-[11px] text-muted-foreground">
                💡 เลื่อนเม้าส์ทับเมนูที่มี dropdown (เช่น "บริการ") จะเห็นเมนูย่อยขึ้นมา
            </p>
        </div>
    );
};

export default NavbarPreview;
