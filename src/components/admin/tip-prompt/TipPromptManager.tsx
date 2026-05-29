import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Lightbulb, Search, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TIPS, TIP_CATEGORIES, type TipEntry } from '@/lib/tipsRegistry';

const ALL = 'all';

export const TipPromptManager = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(TIPS, {
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'description', weight: 0.25 },
          { name: 'keywords', weight: 0.15 },
          { name: 'whenToUse', weight: 0.1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [],
  );

  const filtered = useMemo(() => {
    const base = query.trim()
      ? fuse.search(query.trim()).map((r) => r.item)
      : TIPS;
    return category === ALL ? base : base.filter((t) => t.category === category);
  }, [query, category, fuse]);

  const grouped = useMemo(() => {
    const map = new Map<string, TipEntry[]>();
    for (const tip of filtered) {
      if (!map.has(tip.category)) map.set(tip.category, []);
      map.get(tip.category)!.push(tip);
    }
    return map;
  }, [filtered]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1500);
    } catch {
      toast({ title: 'คัดลอกไม่สำเร็จ', variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto w-full">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-6 h-6 text-amber-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Tip Prompt</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            คลังคำสั่ง / prompt / tip workflow ของ Claude Code (อัปเดตโดยทีมพัฒนา)
          </p>
        </div>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา tip... (ชื่อ, คำอธิบาย, keyword)"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={category === ALL}
            label="ทั้งหมด"
            icon="🗂"
            onClick={() => setCategory(ALL)}
            count={TIPS.length}
          />
          {TIP_CATEGORIES.map((cat) => {
            const count = TIPS.filter((t) => t.category === cat.id).length;
            return (
              <CategoryChip
                key={cat.id}
                active={category === cat.id}
                label={cat.label}
                icon={cat.icon}
                onClick={() => setCategory(cat.id)}
                count={count}
              />
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 py-10 text-center text-sm text-muted-foreground">
          ไม่พบ tip ที่ตรงกับคำค้น
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([catId, tips]) => {
            const cat = TIP_CATEGORIES.find((c) => c.id === catId);
            return (
              <section key={catId} className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>{cat?.icon ?? '•'}</span>
                  <span>{cat?.label ?? catId}</span>
                  <Badge variant="outline" className="ml-1 text-[10px]">
                    {tips.length}
                  </Badge>
                </h2>
                <div className="grid gap-2">
                  {tips.map((tip) => (
                    <TipCard
                      key={tip.id}
                      tip={tip}
                      copied={copiedId === tip.id}
                      onCopy={() => handleCopy(tip.id, tip.code ?? tip.title)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CategoryChip = ({
  active,
  label,
  icon,
  onClick,
  count,
}: {
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
  count: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
      active
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-background text-muted-foreground border-border hover:bg-muted'
    }`}
  >
    <span>{icon}</span>
    <span>{label}</span>
    <span
      className={`text-[10px] px-1.5 rounded-full ${
        active ? 'bg-primary-foreground/20' : 'bg-muted'
      }`}
    >
      {count}
    </span>
  </button>
);

const TipCard = ({
  tip,
  copied,
  onCopy,
}: {
  tip: TipEntry;
  copied: boolean;
  onCopy: () => void;
}) => (
  <Card>
    <CardContent className="p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <code className="text-sm font-mono font-semibold text-foreground break-all">
          {tip.title}
        </code>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCopy}
          className="shrink-0 h-7 text-xs"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" /> คัดลอกแล้ว
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" /> คัดลอก
            </>
          )}
        </Button>
      </div>

      <p className="text-sm text-foreground/90">{tip.description}</p>

      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>
          <span className="font-medium text-foreground/80">ใช้ตอน:</span> {tip.whenToUse}
        </p>
        {tip.example ? (
          <p>
            <span className="font-medium text-foreground/80">ตัวอย่าง:</span> {tip.example}
          </p>
        ) : null}
      </div>
    </CardContent>
  </Card>
);
