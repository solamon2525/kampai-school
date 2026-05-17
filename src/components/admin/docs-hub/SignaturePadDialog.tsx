import { useRef, useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eraser, CheckCircle } from 'lucide-react';
import { signaturesService, type SignatureRole } from '@/services/signatures.service';
import { SignaturePad, type SignaturePadHandle } from './SignaturePad';

interface SignaturePadDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    entityType: string;
    entityId: string;
    role: SignatureRole;
    title?: string;
    description?: string;
    defaultSignerName?: string;
    defaultSignerPosition?: string;
    onSuccess?: (result: { id: string; url: string; signerName: string }) => void;
}

export const SignaturePadDialog = ({
    open, onOpenChange, entityType, entityId, role,
    title = 'ลงนามอิเล็กทรอนิกส์',
    description = 'ลงลายเซ็นด้วยปากกาหรือนิ้วลงในพื้นที่ด้านล่าง',
    defaultSignerName = '',
    defaultSignerPosition = '',
    onSuccess,
}: SignaturePadDialogProps) => {
    const padRef = useRef<SignaturePadHandle>(null);
    const [signerName, setSignerName] = useState(defaultSignerName);
    const [signerPosition, setSignerPosition] = useState(defaultSignerPosition);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const handleClear = () => padRef.current?.clear();

    const handleSave = async () => {
        if (!signerName.trim()) {
            toast({ title: 'กรุณากรอกชื่อผู้ลงนาม', variant: 'destructive' });
            return;
        }
        const blob = await padRef.current?.toBlob(true);
        if (!blob) {
            toast({ title: 'กรุณาวาดลายเซ็นก่อน', variant: 'destructive' });
            return;
        }
        setSaving(true);
        const res = await signaturesService.upload({
            blob, entityType, entityId, role,
            signerName: signerName.trim(),
            signerPosition: signerPosition.trim() || null,
        });
        setSaving(false);
        if (res.error || !res.data) {
            toast({
                title: 'อัปโหลดลายเซ็นล้มเหลว',
                description: res.error?.message ?? '',
                variant: 'destructive',
            });
            return;
        }
        toast({ title: 'ลงนามเรียบร้อย' });
        onSuccess?.({ id: res.data.id, url: res.data.url, signerName: signerName.trim() });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="mb-1.5 block text-xs">ชื่อผู้ลงนาม *</Label>
                            <Input
                                value={signerName}
                                onChange={(e) => setSignerName(e.target.value)}
                                placeholder="เช่น นาย/นาง... นามสกุล..."
                            />
                        </div>
                        <div>
                            <Label className="mb-1.5 block text-xs">ตำแหน่ง</Label>
                            <Input
                                value={signerPosition}
                                onChange={(e) => setSignerPosition(e.target.value)}
                                placeholder="ผู้อำนวยการ"
                            />
                        </div>
                    </div>
                    <SignaturePad ref={padRef} />
                    <p className="text-[11px] text-muted-foreground text-center">
                        ✍️ แตะ/คลิกแล้วลากเพื่อลงนาม
                    </p>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClear} disabled={saving}>
                        <Eraser className="w-4 h-4 mr-1" /> ล้าง
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {saving ? 'กำลังบันทึก…' : 'อนุมัติและลงนาม'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
