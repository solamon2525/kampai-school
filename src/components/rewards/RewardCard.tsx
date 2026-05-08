import { Gift, Sparkles, Package } from 'lucide-react';
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

  return (
    <div
      className={cn(
        'group relative bg-card border border-border rounded-2xl overflow-hidden',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
      )}
    >
      <div className={cn('relative aspect-square overflow-hidden bg-gradient-to-br', tier.gradient)}>
        {reward.image_url ? (
          <img
            src={reward.image_url}
            alt={reward.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Gift className="w-16 h-16 opacity-40" />
          </div>
        )}

        <div className="absolute top-3 left-3">
          <Badge className={cn('border gap-1', tier.badge)}>
            <span>{tier.emoji}</span>
            <span className="font-medium">{tier.label}</span>
          </Badge>
        </div>

        {reward.stock !== null && reward.stock !== undefined && (
          <div className="absolute top-3 right-3">
            <Badge
              variant="outline"
              className={cn(
                'gap-1 backdrop-blur-sm bg-background/80',
                outOfStock ? 'text-destructive border-destructive/40' : 'text-muted-foreground',
              )}
            >
              <Package className="w-3 h-3" />
              {outOfStock ? 'หมด' : `เหลือ ${reward.stock}`}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1">{reward.name}</h3>
          {reward.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{reward.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-lg font-bold">{reward.points_cost}</span>
            <span className="text-xs text-muted-foreground">แต้ม</span>
          </div>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={() => onClaim(reward)}
            className="bg-primary hover:bg-primary/90"
          >
            {outOfStock ? 'หมดสต็อก' : 'แลกรางวัล'}
          </Button>
        </div>
      </div>
    </div>
  );
}
