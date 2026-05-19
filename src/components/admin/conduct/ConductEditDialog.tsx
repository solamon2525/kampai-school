import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { conductService, type ConductRecord } from '@/services/conduct.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ADD_CATEGORIES = ['ความดี', 'จิตอาสา', 'วินัย', 'วิชาการ', 'กีฬา'];
const DEDUCT_CATEGORIES = ['วินัย', 'ทรัพย์สิน', 'การเรียน', 'ความประพฤติ'];

const schema = z.object({
    type: z.enum(['add', 'deduct']),
    score: z.coerce.number().int().min(1).max(100),
    category: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
    reason: z.string().trim().min(1, 'กรุณากรอกเหตุผล'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    record: ConductRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export const ConductEditDialog = ({ record, open, onOpenChange, onSaved }: Props) => {
    const { toast } = useToast();
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { type: 'add', score: 1, category: 'ความดี', reason: '' },
    });

    useEffect(() => {
        if (record) {
            form.reset({
                type: record.type,
                score: record.score,
                category: record.category,
                reason: record.reason,
            });
        }
    }, [record, form]);

    const type = form.watch('type');
    const categories = type === 'add' ? ADD_CATEGORIES : DEDUCT_CATEGORIES;

    const onSubmit = async (values: FormValues) => {
        if (!record) return;
        const { error } = await conductService.update(record.id, values);
        if (error) {
            toast({ variant: 'destructive', title: 'แก้ไขไม่สำเร็จ', description: error.message });
            return;
        }
        toast({ title: 'บันทึกการแก้ไขสำเร็จ' });
        onSaved();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>แก้ไขรายการคะแนน</DialogTitle>
                    <DialogDescription>
                        {record?.students?.name ?? '—'} · {record?.students?.class ?? ''}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ประเภท</FormLabel>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant={field.value === 'add' ? 'default' : 'outline'}
                                            className={`gap-1 ${field.value === 'add' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                            onClick={() => { field.onChange('add'); form.setValue('category', ADD_CATEGORIES[0]); }}
                                        >
                                            <Plus className="w-4 h-4" /> บวกคะแนน
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={field.value === 'deduct' ? 'default' : 'outline'}
                                            className={`gap-1 ${field.value === 'deduct' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                            onClick={() => { field.onChange('deduct'); form.setValue('category', DEDUCT_CATEGORIES[0]); }}
                                        >
                                            <Minus className="w-4 h-4" /> หักคะแนน
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>หมวดหมู่</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="score"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>จำนวนคะแนน</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={100}
                                            {...field}
                                            onChange={e => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>เหตุผล</FormLabel>
                                    <FormControl>
                                        <Textarea rows={3} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className={type === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            >
                                {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
