import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Coins, Heart, Loader2, LockKeyhole, PawPrint, Pencil, Sparkles, Utensils } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  studentPetQueryKey,
  studentPetService,
  type PetRarity,
  type StudentPetCatalogItem,
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
  if (error.message.includes('PET_NOT_EQUIPPED')) return 'ต้องเลือกสวมใส่คู่หูก่อนทำกิจกรรม';
  if (error.message.includes('PET_NICKNAME_TOO_LONG')) return 'ชื่อเล่นต้องยาวไม่เกิน 24 ตัวอักษร';
  return 'ระบบคู่หูยังไม่พร้อม กรุณาลองใหม่อีกครั้ง';
};

export const StudentPetHub = ({ studentCode }: { studentCode: string }) => {
  const code = studentCode.trim();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = studentPetQueryKey(code);

  const [renameTarget, setRenameTarget] = useState<StudentPetCatalogItem | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');

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
      const petName = state.equipped?.nickname ? `"${state.equipped.nickname}" (${state.equipped.name_th})` : (state.equipped?.name_th ?? 'คู่หู');
      toast({ title: 'เลือกคู่หูแล้ว', description: `${petName} จะไปผจญภัยด้วยกัน` });
    },
    onError: (error: Error) => toast({ title: 'เลือกคู่หูไม่สำเร็จ', description: petErrorMessage(error), variant: 'destructive' }),
  });

  const nicknameMutation = useMutation({
    mutationFn: ({ petCode, nickname }: { petCode: string; nickname: string }) =>
      studentPetService.setNickname(code, petCode, nickname),
    onSuccess: async (state) => {
      await updateState(state);
      toast({
        title: 'บันทึกชื่อเล่นแล้ว',
        description: state.nickname ? `ตั้งชื่อเล่นเป็น "${state.nickname}" เรียบร้อยแล้ว` : 'รีเซ็ตเป็นชื่อเริ่มต้นแล้ว',
      });
      setRenameTarget(null);
    },
    onError: (error: Error) => toast({ title: 'ตั้งชื่อไม่สำเร็จ', description: petErrorMessage(error), variant: 'destructive' }),
  });

  const interactMutation = useMutation({
    mutationFn: (action: 'feed' | 'pet' | 'cheer') => studentPetService.interact(code, action),
    onSuccess: async (state) => {
      await updateState(state);
      const xp = state.xp_gained ?? 5;
      const actionName =
        state.action_type === 'feed'
          ? 'ให้อาหาร 🍎'
          : state.action_type === 'pet'
            ? 'ลูบหัว ❤️'
            : 'ส่งกำลังใจ ✨';
      toast({
        title: `${actionName} สำเร็จ!`,
        description: `ความผูกพันเพิ่มขึ้น +${xp} Bond XP`,
      });
    },
    onError: (error: Error) => toast({ title: 'ไม่สำเร็จ', description: petErrorMessage(error), variant: 'destructive' }),
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
  const equipped = state.equipped;
  const pendingCode = buyMutation.isPending
    ? buyMutation.variables
    : equipMutation.isPending
      ? equipMutation.variables
      : undefined;

  const openRenameModal = (pet: StudentPetCatalogItem) => {
    setRenameTarget(pet);
    setNicknameInput(pet.nickname ?? '');
  };

  return (
    <>
      <Card className="bg-card">
        <CardContent className="space-y-4 p-3 sm:p-4">
          {/* Top Banner: Equipped Pet & Star Coins */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {equipped ? (
                <div className="relative shrink-0">
                  <PetVisual visualKey={equipped.visual_key} label={equipped.name_th} className="h-16 w-16 ring-2 ring-primary/40" />
                  <span className="absolute -bottom-1 -right-1 rounded-full border border-background bg-primary px-1.5 py-0.5 text-[9px] font-black text-primary-foreground shadow">
                    LV.{equipped.friendship?.level ?? 1}
                  </span>
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <PawPrint className="h-8 w-8" />
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">คู่หูประจำตัว:</span>
                  <span className="truncate font-black text-foreground">
                    {equipped?.nickname ? `"${equipped.nickname}" (${equipped.name_th})` : (equipped?.name_th ?? 'ยังไม่ได้เลือก')}
                  </span>
                  {equipped && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      title="แก้ไขชื่อเล่นคู่หู"
                      onClick={() => {
                        const target = state.catalog.find((c) => c.code === equipped.code);
                        if (target) openRenameModal(target);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {equipped ? (
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-primary">
                        {equipped.friendship?.title ?? 'เพื่อนใหม่ 🌱'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {equipped.bond_xp.toLocaleString('th-TH')} Bond XP
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.round((equipped.friendship?.progress ?? 0) * 100)}
                        className="h-1.5 w-32 sm:w-44"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round((equipped.friendship?.progress ?? 0) * 100)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">เลือกคู่หูจากคลังด้านล่างเพื่อร่วมผจญภัย</p>
                )}
              </div>
            </div>

            {/* Interaction Buttons & Star Coins */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 sm:border-t-0 sm:pt-0">
              {equipped && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 px-2.5 text-xs font-bold"
                    disabled={interactMutation.isPending}
                    onClick={() => interactMutation.mutate('feed')}
                  >
                    <Utensils className="h-3.5 w-3.5 text-orange-500" />
                    <span>ให้อาหาร</span>
                    <span className="text-[10px] text-muted-foreground">+15</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 px-2.5 text-xs font-bold"
                    disabled={interactMutation.isPending}
                    onClick={() => interactMutation.mutate('pet')}
                  >
                    <Heart className="h-3.5 w-3.5 text-rose-500" />
                    <span>ลูบหัว</span>
                    <span className="text-[10px] text-muted-foreground">+5</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 px-2.5 text-xs font-bold"
                    disabled={interactMutation.isPending}
                    onClick={() => interactMutation.mutate('cheer')}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>เชียร์</span>
                    <span className="text-[10px] text-muted-foreground">+8</span>
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm font-black text-foreground shadow-sm">
                <Coins className="h-4 w-4 text-primary" />
                <span>{state.balance.toLocaleString('th-TH')}</span>
                <span className="text-[11px] font-normal text-muted-foreground">เหรียญ</span>
              </div>
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-foreground">คลังคู่หู ({state.catalog.filter((c) => c.owned).length}/{state.catalog.length})</span>
              <span className="text-[11px] text-muted-foreground">อ่านหนังสือและทำภารกิจเพื่อรับค่าความผูกพัน (Bond XP)</span>
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
                    <div className="relative">
                      <PetVisual visualKey={pet.visual_key} label={pet.name_th} className="mx-auto h-16 w-16" />
                      {pet.owned && (
                        <span className="absolute bottom-0 right-1 rounded-full bg-primary/10 px-1 text-[9px] font-bold text-primary">
                          LV.{pet.friendship?.level ?? 1}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 min-w-0 text-center">
                      <p className="truncate text-sm font-bold text-foreground">
                        {pet.nickname ? `"${pet.nickname}"` : pet.name_th}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {pet.species_th} · {RARITY_LABEL[pet.rarity]}
                      </p>
                      {pet.owned && pet.bond_xp > 0 && (
                        <p className="truncate text-[9px] font-semibold text-primary">
                          {pet.bond_xp} XP
                        </p>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={pet.equipped ? 'secondary' : pet.owned ? 'outline' : 'default'}
                        className="h-7 w-full px-1 text-[11px]"
                        disabled={pet.equipped || isPending || (!pet.owned && !canBuy)}
                        onClick={() => (pet.owned ? equipMutation.mutate(pet.code) : buyMutation.mutate(pet.code))}
                      >
                        {isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : pet.equipped ? (
                          <>
                            <Check className="mr-1 h-3.5 w-3.5" /> ใช้อยู่
                          </>
                        ) : pet.owned ? (
                          'เลือกเป็นคู่หู'
                        ) : (
                          <>
                            {canBuy ? <Coins className="mr-1 h-3.5 w-3.5" /> : <LockKeyhole className="mr-1 h-3.5 w-3.5" />}
                            {pet.price.toLocaleString('th-TH')}
                          </>
                        )}
                      </Button>

                      {pet.owned && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-5 w-full text-[10px] text-muted-foreground hover:text-foreground"
                          onClick={() => openRenameModal(pet)}
                        >
                          <Pencil className="mr-1 h-2.5 w-2.5" />
                          {pet.nickname ? 'เปลี่ยนชื่อ' : 'ตั้งชื่อเล่น'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ตั้งชื่อเล่นให้คู่หู</DialogTitle>
            <DialogDescription>
              {renameTarget && `ตั้งชื่อเล่นน่ารัก ๆ ให้กับ ${renameTarget.name_th} (${renameTarget.species_th})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pet-nickname" className="text-xs font-bold text-foreground">
                ชื่อเล่นใหม่ (เว้นว่างเพื่อใช้ชื่อเดิม)
              </Label>
              <Input
                id="pet-nickname"
                maxLength={24}
                placeholder={renameTarget?.name_th}
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">ความยาวไม่เกิน 24 ตัวอักษร</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameTarget(null)}
              disabled={nicknameMutation.isPending}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              disabled={nicknameMutation.isPending}
              onClick={() => {
                if (renameTarget) {
                  nicknameMutation.mutate({
                    petCode: renameTarget.code,
                    nickname: nicknameInput,
                  });
                }
              }}
            >
              {nicknameMutation.isPending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              บันทึกชื่อเล่น
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

