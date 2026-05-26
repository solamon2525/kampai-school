import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { User, Newspaper, Users, FileText } from 'lucide-react';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useAuth } from '@/contexts/AuthProvider';
import { getVisibleCommands, type CommandRole } from '@/lib/commands/registry';
import { globalSearchService } from '@/services/global-search.service';
import { fuseOptions, type SearchIndexItem, type SearchResultType } from '@/lib/search/fuse-config';

const RESULT_ICONS: Record<SearchResultType, typeof User> = {
  student: User,
  staff: Users,
  news: Newspaper,
  document: FileText,
};

const RESULT_GROUP_LABEL: Record<SearchResultType, string> = {
  student: 'นักเรียน',
  staff: 'ครู/บุคลากร',
  news: 'ข่าวสาร',
  document: 'เอกสาร',
};

export const CommandPalette = () => {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const { role, session } = useAuth();
  const [query, setQuery] = useState('');

  // Reset input when closing
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setQuery(''), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  const effectiveRole: CommandRole | null = role
    ? (role === 'viewer' ? null : (role as CommandRole))
    : (session ? null : 'public');

  const visibleCommands = useMemo(() => getVisibleCommands(effectiveRole), [effectiveRole]);

  // Fetch search index lazily — only when palette has been opened at least once
  const { data: searchIndex = [] } = useQuery<SearchIndexItem[]>({
    queryKey: ['global-search-index'],
    queryFn: () => globalSearchService.fetchIndex(),
    enabled: open,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const fuse = useMemo(() => (searchIndex.length ? new Fuse(searchIndex, fuseOptions) : null), [searchIndex]);

  const searchResults = useMemo<SearchIndexItem[]>(() => {
    const q = query.trim();
    if (!fuse || q.length < 2) return [];
    return fuse.search(q, { limit: 20 }).map((r) => r.item);
  }, [fuse, query]);

  const groupedResults = useMemo(() => {
    const groups: Record<SearchResultType, SearchIndexItem[]> = {
      student: [],
      staff: [],
      news: [],
      document: [],
    };
    for (const item of searchResults) {
      if (groups[item.type].length < 5) groups[item.type].push(item);
    }
    return groups;
  }, [searchResults]);

  // Group static commands by their `group` field
  const groupedCommands = useMemo(() => {
    const map = new Map<string, typeof visibleCommands>();
    for (const c of visibleCommands) {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    }
    return Array.from(map.entries());
  }, [visibleCommands]);

  const closeAndRun = (run: () => void) => {
    setOpen(false);
    // Defer to allow dialog close animation
    setTimeout(run, 50);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Command Palette — ค้นหาและคำสั่ง</DialogTitle>
      <DialogDescription className="sr-only">ค้นหานักเรียน ครู ข่าว หรือไปยังหน้าใดก็ได้ในระบบ</DialogDescription>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="ค้นหานักเรียน/ครู/ข่าว หรือพิมพ์คำสั่ง..."
      />
      <CommandList>
        <CommandEmpty>ไม่พบผลลัพธ์</CommandEmpty>

        {/* Live search results — show first when user is typing */}
        {(['student', 'staff', 'news'] as SearchResultType[]).map((type) => {
          const items = groupedResults[type];
          if (!items.length) return null;
          const Icon = RESULT_ICONS[type];
          return (
            <CommandGroup key={type} heading={`ผลค้นหา · ${RESULT_GROUP_LABEL[type]}`}>
              {items.map((item) => (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  value={`${item.type}-${item.id}-${item.title}-${item.subtitle ?? ''}`}
                  onSelect={() => closeAndRun(() => navigate(item.path))}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{item.title}</span>
                  {item.subtitle && (
                    <span className="ml-2 truncate text-xs text-muted-foreground">{item.subtitle}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}

        {searchResults.length > 0 && <CommandSeparator />}

        {/* Static command groups */}
        {groupedCommands.map(([groupLabel, items]) => (
          <CommandGroup key={groupLabel} heading={groupLabel}>
            {items.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <CommandItem
                  key={cmd.id}
                  value={`${cmd.label} ${(cmd.keywords ?? []).join(' ')}`}
                  onSelect={() =>
                    closeAndRun(() => {
                      if (cmd.action.type === 'navigate') navigate(cmd.action.path);
                      else cmd.action.fn();
                    })
                  }
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{cmd.label}</span>
                  {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
