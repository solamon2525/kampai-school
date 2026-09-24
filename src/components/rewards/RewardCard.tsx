import { Gift, Package, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { tierFor } from './tier';
import type { Reward } from '@/services/waste-bank.service';
import { RewardCostDisplay } from './RewardCostDisplay';
import { totalRewardCost } from './reward-cost';

interface RewardCardProps {
  reward: Reward;
  onClaim: (reward: Reward) => void;
}

function cleanThaiTitle(name: string | null): string | null {
  if (!name) return null;
  return name.trim().replace(/^(นาย|นางสาว|นาง|ดร\.|ครู|อาจารย์)\s*/, '');
}

export function RewardCard({ reward, onClaim }: RewardCardProps) {
  const { settings } = useSchoolSettings();
  const tier = tierFor(totalRewardCost(reward));
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
        <div className="absolute bottom-2.5 right-2.5 z-10 flex flex-col items-center gap-1 sm:gap-1.5 bg-white/35 sm:bg-white/95 backdrop-blur-md p-1 pb-1.5 sm:p-1.5 sm:pb-2 rounded-xl border border-border/80 shadow-md transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-lg w-[50px] sm:w-[84px]">
          {isCentral ? (
            <>
              {settings.school_logo_url ? (
                <img
                  src={settings.school_logo_url}
                  alt={settings.school_name || 'โลโก้โรงเรียน'}
                  className="w-9 h-9 sm:w-16 sm:h-16 rounded-lg object-cover shadow-sm shrink-0 ring-1 ring-yellow-400/30"
                />
              ) : (
                <div className="w-9 h-9 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm shrink-0">
                  <Globe2 className="w-4 h-4 sm:w-7 sm:h-7 text-white animate-spin-slow" />
                </div>
              )}
              <span className="hidden sm:block text-[10px] font-bold text-sky-800 text-center leading-none mt-1">รางวัลกลาง</span>
            </>
          ) : (
            <>
              {ownerPhoto ? (
                <img
                  src={ownerPhoto}
                  alt={ownerName || ''}
                  className="w-9 h-9 sm:w-16 sm:h-16 rounded-lg object-cover shadow-sm shrink-0 ring-1 ring-emerald-500/10"
                />
              ) : (
                <div className="w-9 h-9 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shrink-0 text-white text-lg font-bold">
                  {(ownerName || '?').slice(0, 1)}
                </div>
              )}
              <span className="hidden sm:block text-[10px] font-extrabold text-slate-800 text-center truncate w-full px-0.5 leading-tight mt-0.5" title={`ครู${cleanThaiTitle(ownerName)}`}>
                ครู{cleanThaiTitle(ownerName)}
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
          <RewardCostDisplay waste={reward.waste_points_cost} virtue={reward.virtue_points_cost} className="shrink-0 text-xs" />
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

