import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calculator, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { eggFarmService, type EggSettings } from '@/services/egg-farm.service';
import type { RecorderValue } from '@/components/admin/shared/RecorderSelect';

const priceSchema = z.object({
  price_per_egg: z.coerce.number().min(0, 'ราคาต่อฟองต้องไม่ติดลบ'),
  price_per_tray: z.coerce.number().min(0, 'ราคาต่อแผงต้องไม่ติดลบ'),
  eggs_per_tray: z.coerce.number().int('ต้องเป็นจำนวนเต็ม').min(1, 'ต้องมีอย่างน้อย 1 ฟองต่อแผง'),
  flock_size: z.coerce.number().int('ต้องเป็นจำนวนเต็ม').min(0, 'จำนวนแม่ไก่ต้องไม่ติดลบ'),
});

type PriceFormValues = z.infer<typeof priceSchema>;

interface EggPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings?: EggSettings;
  recorder?: RecorderValue;
}

export function EggPriceDialog({
  open,
  onOpenChange,
  settings,
  recorder,
}: EggPriceDialogProps) {
  const qc = useQueryClient();

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      price_per_egg: settings?.price_per_egg ?? 5,
      price_per_tray: settings?.price_per_tray ?? 150,
      eggs_per_tray: settings?.eggs_per_tray ?? 30,
      flock_size: settings?.flock_size ?? 0,
    },
  });

  useEffect(() => {
    if (open && settings) {
      form.reset({
        price_per_egg: settings.price_per_egg,
        price_per_tray: settings.price_per_tray,
        eggs_per_tray: settings.eggs_per_tray,
        flock_size: settings.flock_size,
      });
    }
  }, [open, settings, form]);

  const mutation = useMutation({
    mutationFn: (values: PriceFormValues) =>
      eggFarmService.updateSettings({
        price_per_egg: values.price_per_egg,
        price_per_tray: values.price_per_tray,
        eggs_per_tray: values.eggs_per_tray,
        flock_size: values.flock_size,
        updated_by_staff_id: recorder?.staffId ?? null,
        updated_by_administrator_id: recorder?.administratorId ?? null,
        updated_by_name: recorder?.name || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['egg-settings'] });
      toast.success('บันทึกการตั้งค่าราคาไข่เรียบร้อย');
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
    },
  });

  const handleAutoCalcTray = () => {
    const eggPrice = Number(form.getValues('price_per_egg')) || 0;
    const perTray = Number(form.getValues('eggs_per_tray')) || 30;
    form.setValue('price_per_tray', Math.round(eggPrice * perTray * 100) / 100, {
      shouldValidate: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            ตั้งค่าราคาไข่ &amp; ข้อมูลฟาร์ม
          </DialogTitle>
          <DialogDescription>
            ราคาที่ตั้งจะใช้เป็นค่าเริ่มต้นสำหรับการบันทึกขายครั้งถัดไป (รายการขายเดิมยังคงราคาเดิม)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price_per_egg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคาต่อฟอง (บาท)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eggs_per_tray"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนฟองต่อแผง</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price_per_tray"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>ราคาต่อแผง (บาท)</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-primary"
                      onClick={handleAutoCalcTray}
                    >
                      <Calculator className="w-3.5 h-3.5 mr-1" />
                      คำนวณจากราคา/ฟอง
                    </Button>
                  </div>
                  <FormControl>
                    <Input type="number" step="1" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flock_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>จำนวนแม่ไก่ไข่ทั้งหมด (ตัว)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    ใช้คำนวณเปอร์เซ็นต์การออกไข่ในหน้าภาพรวม (ใส่ 0 หากไม่ต้องการแสดง)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                บันทึกการตั้งค่า
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
