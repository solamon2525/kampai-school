import { Gift, Sparkles, Package, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { tierFor } from './tier';
import type { Reward } from '@/services/waste-bank.service';

interface RewardCardProps {
  reward: Reward;
  onClaim: (reward: Reward) => void;
}

export function RewardCard({ reward, onClaim }: RewardCardProps) {
  const tier = tierFor(reward.points_cost);
  const outOfStock = reward.stock !== null && reward.stock !== undefined && reward.stock <= 0;

  const ownerName = reward.staff?.name || reward.administrators?.name || null;
  const ownerPhoto = reward.staff?.photo_url || reward.administrators?.photo_url || null;
  const isCentral = !reward.staff && !reward.administrators;

  return (
    <div
      className={cn(
        'group relative bg-card border border-border/80 rounded-2xl overflow-hidden flex flex-col h-full',
        'transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/30',
      )}
    >
      {/* ── Image area ── */}
      <div className={cn('relative aspect-square overflow-hidden bg-gradient-to-br shrink-0', tier.gradient)}>
        {reward.image_url ? (
          <img
            src={reward.image_url}
            alt={reward.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Gift className="w-16 h-16 opacity-40 animate-pulse" />
          </div>
        )}

        {/* Tier badge — top-left */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className={cn('border gap-1 backdrop-blur-md shadow-sm', tier.badge)}>
            <span>{tier.emoji}</span>
            <span className="font-semibold">{tier.label}</span>
          </Badge>
        </div>

        {/* Stock badge — top-right */}
        {reward.stock !== null && reward.stock !== undefined && (
          <div className="absolute top-3 right-3 z-10">
            <Badge
              variant="outline"
              className={cn(
                'gap-1 backdrop-blur-md bg-background/80 shadow-sm border border-border/50',
                outOfStock ? 'text-destructive border-destructive/40 bg-destructive/5' : 'text-muted-foreground',
              )}
            >
              <Package className="w-3 h-3" />
              {outOfStock ? 'หมด' : `เหลือ ${reward.stock}`}
            </Badge>
          </div>
        )}

        {/* Floating Teacher / Central Owner Capsule — bottom-right */}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-background/98 dark:bg-background/95 backdrop-blur-md p-1 pr-3 rounded-full border border-border/80 shadow-md transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-lg">
          {isCentral ? (
            <>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm shrink-0">
                <Globe2 className="w-3.5 h-3.5 text-white animate-spin-slow" />
              </div>
              <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300">รางวัลกลาง</span>
            </>
          ) : (
            <>
              {ownerPhoto ? (
                <img
                  src={ownerPhoto}
                  alt={ownerName || ''}
                  className="w-6 h-6 rounded-full object-cover shadow-sm shrink-0 ring-1 ring-emerald-500/20"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shrink-0 text-white text-[9px] font-bold">
                  {(ownerName || '?').slice(0, 1)}
                </div>
              )}
              <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-100 truncate max-w-[95px] sm:max-w-[125px]">
                ครู{ownerName?.split(' ')[0]}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <h3 
            className="font-semibold text-foreground text-sm md:text-base line-clamp-1 group-hover:text-primary transition-colors duration-200" 
            title={reward.name}
          >
            {reward.name}
          </h3>
          {reward.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {reward.description}
            </p>
          )}
        </div>

        {/* Points and action button */}
        <div className="flex items-center justify-between gap-1.5 pt-2 mt-auto border-t border-border/40">
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-base md:text-lg font-extrabold tabular-nums">{reward.points_cost}</span>
            <span className="text-[10px] text-muted-foreground">แต้ม</span>
          </div>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={() => onClaim(reward)}
            className={cn(
              "h-7 md:h-8 text-[11px] md:text-xs px-2.5 md:px-3 font-medium transition-all active:scale-95 shrink-0 shadow-sm",
              outOfStock 
                ? "bg-muted text-muted-foreground" 
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {outOfStock ? 'หมด' : 'แลกรางวัล'}
          </Button>
        </div>
      </div>
    </div>
  );
}

