import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Coins, Loader2, LockKeyhole, PawPrint } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  studentPetQueryKey,
  studentPetService,
  type PetRarity,
  type StudentPetState,
} from '@/services/student-pet.service';
import { PetVisual } from '@/components/games/PetVisual';

const RARITY_LABEL: Record<PetRarity, string> = {
  common: 'ทั่วไป',
  rare: 'หายาก',
  epic: 'พิเศษ',
};

const petErrorMessage = (error: Error) => {
  if (error.message.includes('PET_INSUFFICIENT_COINS')) return 'เหรียญดาวยังไม่พอสำหรับคู่หูตัวนี้';
  if (error.message.includes('PET_NOT_OWNED')) return 'ยังไม่ได้เป็นเจ้าของคู่หูตัวนี้';
  return 'ระบบคู่หูยังไม่พร้อม กรุณาลองใหม่อีกครั้ง';
};

export const StudentPetHub = ({ studentCode }: { studentCode: string }) => {
  const code = studentCode.trim();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = studentPetQueryKey(code);

  const stateQuery = useQuery({
    queryKey,
    queryFn: () => studentPetService.getState(code),
    enabled: !!code,
  });

  const updateState = async (state: StudentPetState) => {
    queryClient.setQueryData(queryKey, state);
    await queryClient.invalidateQueries({ queryKey });
  };

  const buyMutation = useMutation({
    mutationFn: (petCode: string) => studentPetService.buy(code, petCode),
    onSuccess: async (state) => {
      await updateState(state);
      const pet = state.catalog.find((item) => item.code === state.pet_code);
      toast({ title: 'รับคู่หูใหม่แล้ว', description: pet ? `${pet.name_th} เข้าคลังคู่หูของฉัน` : undefined });
    },
    onError: (error: Error) => toast({ title: 'ซื้อไม่สำเร็จ', description: petErrorMessage(error), variant: 'destructive' }),
  });

  const equipMutation = useMutation({
    mutationFn: (petCode: string) => studentPetService.equip(code, petCode),
    onSuccess: async (state) => {
      await updateState(state);
      toast({ title: 'เลือกคู่หูแล้ว', description: `${state.equipped?.name_th ?? 'คู่หู'} จะไปเล่นเกมด้วยกัน` });
    },
    onError: (error: Error) => toast({ title: 'เลือกคู่หูไม่สำเร็จ', description: petErrorMessage(error), variant: 'destructive' }),
  });

  if (stateQuery.isLoading) {
    return (
      <Card className="bg-card">
        <CardContent className="flex items-center justify-center gap-2 p-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> กำลังเปิดบ้านคู่หู...
        </CardContent>
      </Card>
    );
  }

  if (!stateQuery.data || stateQuery.isError) {
    return (
      <Card className="bg-card">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <span className="text-sm text-muted-foreground">โหลดข้อมูลคู่หูไม่สำเร็จ</span>
          <Button size="sm" variant="outline" onClick={() => stateQuery.refetch()}>ลองใหม่</Button>
        </CardContent>
      </Card>
    );
  }

  const state = stateQuery.data;
  const pendingCode = buyMutation.isPending
    ? buyMutation.variables
    : equipMutation.isPending
      ? equipMutation.variables
      : undefined;

  return (
    <Card className="bg-card">
      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          {state.equipped ? (
            <PetVisual visualKey={state.equipped.visual_key} label={state.equipped.name_th} className="h-14 w-14 shrink-0" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <PawPrint className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">คู่หูที่ใช้งาน</p>
            <p className="truncate font-bold text-foreground">{state.equipped?.name_th ?? 'ยังไม่ได้เลือกคู่หู'}</p>
            <p className="text-xs text-muted-foreground">เล่น 3 รอบแรกของวันและทำภารกิจ เพื่อรับเหรียญดาว</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 font-bold text-foreground">
            <Coins className="h-4 w-4 text-primary" /> {state.balance.toLocaleString('th-TH')}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {state.catalog.map((pet) => {
            const isPending = pendingCode === pet.code && (buyMutation.isPending || equipMutation.isPending);
            const canBuy = state.balance >= pet.price;
            return (
              <div
                key={pet.code}
                className={cn(
                  'flex min-w-0 flex-col rounded-xl border bg-card p-2 transition-colors',
                  pet.equipped ? 'border-primary ring-1 ring-primary/30' : 'border-border',
                )}
              >
                <PetVisual visualKey={pet.visual_key} label={pet.name_th} className="mx-auto h-16 w-16" />
                <div className="mt-1 min-w-0 text-center">
                  <p className="truncate text-sm font-bold text-foreground">{pet.name_th}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{pet.species_th} · {RARITY_LABEL[pet.rarity]}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={pet.equipped ? 'secondary' : pet.owned ? 'outline' : 'default'}
                  className="mt-2 h-7 w-full px-1 text-[11px]"
                  disabled={pet.equipped || isPending || (!pet.owned && !canBuy)}
                  onClick={() => pet.owned ? equipMutation.mutate(pet.code) : buyMutation.mutate(pet.code)}
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : pet.equipped ? <><Check className="mr-1 h-3.5 w-3.5" /> ใช้อยู่</>
                    : pet.owned ? 'เลือกเป็นคู่หู'
                    : <>{canBuy ? <Coins className="mr-1 h-3.5 w-3.5" /> : <LockKeyhole className="mr-1 h-3.5 w-3.5" />}{pet.price.toLocaleString('th-TH')}</>}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
