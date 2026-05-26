import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parentChildrenService, type ChildSummary } from '@/services/parent-children.service';
import { useAuth } from '@/contexts/AuthProvider';

const STORAGE_KEY = 'kampai_active_child_id';

interface ActiveChildContextValue {
  children: ChildSummary[];
  activeChild: ChildSummary | null;
  setActiveChildId: (id: string) => void;
  loading: boolean;
}

const ActiveChildContext = createContext<ActiveChildContextValue>({
  children: [],
  activeChild: null,
  setActiveChildId: () => {},
  loading: false,
});

export const useActiveChild = () => useContext(ActiveChildContext);

export const ActiveChildProvider = ({ children: kids }: { children: ReactNode }) => {
  const { session, isParent, isAdmin } = useAuth();
  const enabled = !!session && (isParent || isAdmin);

  const { data: list = [], isLoading } = useQuery<ChildSummary[]>({
    queryKey: ['my-children', session?.user?.id],
    queryFn: () => parentChildrenService.list(),
    enabled,
    staleTime: 5 * 60_000,
  });

  const [activeId, setActiveIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  // Default to primary child when list loads
  useEffect(() => {
    if (!list.length) return;
    if (!activeId || !list.some((c) => c.id === activeId)) {
      const fallback = list.find((c) => c.is_primary) ?? list[0];
      setActiveIdState(fallback.id);
      localStorage.setItem(STORAGE_KEY, fallback.id);
    }
  }, [list, activeId]);

  const setActiveChildId = (id: string) => {
    setActiveIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const activeChild = useMemo(
    () => list.find((c) => c.id === activeId) ?? null,
    [list, activeId],
  );

  return (
    <ActiveChildContext.Provider value={{ children: list, activeChild, setActiveChildId, loading: isLoading }}>
      {kids}
    </ActiveChildContext.Provider>
  );
};
