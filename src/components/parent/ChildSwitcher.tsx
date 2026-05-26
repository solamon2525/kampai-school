import { Check, ChevronsUpDown, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useActiveChild } from '@/hooks/useActiveChild';
import { cn } from '@/lib/utils';

export const ChildSwitcher = () => {
  const { children: list, activeChild, setActiveChildId } = useActiveChild();
  const [open, setOpen] = useState(false);

  // Hide when there's nothing useful to switch
  if (!list.length) return null;
  if (list.length === 1) {
    // Single child — just show, no switcher
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
        <PersonAvatar name={activeChild?.name ?? ''} photoUrl={activeChild?.photo_url} size="xs" />
        <span className="text-sm font-medium truncate max-w-[140px]">{activeChild?.name}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {activeChild ? (
            <>
              <PersonAvatar name={activeChild.name} photoUrl={activeChild.photo_url} size="xs" />
              <span className="truncate max-w-[160px]">{activeChild.name}</span>
            </>
          ) : (
            <>
              <GraduationCap className="w-4 h-4" />
              <span>เลือกบุตร</span>
            </>
          )}
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>ไม่มีบุตรในระบบ</CommandEmpty>
            <CommandGroup heading={`บุตรของคุณ (${list.length} คน)`}>
              {list.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.class ?? ''} ${c.student_code ?? ''}`}
                  onSelect={() => {
                    setActiveChildId(c.id);
                    setOpen(false);
                  }}
                >
                  <PersonAvatar name={c.name} photoUrl={c.photo_url} size="sm" />
                  <div className="ml-2 flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[c.class, c.room].filter(Boolean).join('/')}
                      {c.student_code ? ` · ${c.student_code}` : ''}
                    </p>
                  </div>
                  <Check className={cn('ml-2 h-4 w-4', activeChild?.id === c.id ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
