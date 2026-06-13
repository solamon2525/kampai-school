/**
 * GameDocsDialog.tsx — รายละเอียดเกม (Game Docs)
 *
 * สเปกเดียวต่อเกม แก้ทับได้ — รูปแบบ / ฟีเจอร์ / เวอร์ชันบิลด์ / notes.
 * เห็นเฉพาะเจ้าของเกม (owner_staff_id) + admin ผ่าน RLS (table game_docs, migration 168);
 * ไม่ล็อกอิน/ไม่ใช่เจ้าของ = query คืน null → ฟอร์มว่าง.
 *
 * ใช้ร่วมกัน: GamesTab (admin) + TeacherEduHubManager (เจ้าของเกม).
 */

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    gameDocsService,
    type EduHubItem,
    type GameDoc,
} from '@/services/educational-hub.service';

export const GameDocsDialog = ({
    item,
    onClose,
}: {
    item: EduHubItem;
    onClose: () => void;
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [format, setFormat] = useState('');
    const [featuresText, setFeaturesText] = useState('');
    const [version, setVersion] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const { data: doc, isLoading } = useQuery({
        queryKey: ['game-docs', item.id],
        queryFn: async () => {
            const { data, error } = await gameDocsService.getByItem(item.id);
            if (error) throw error;
            return (data as GameDoc | null) ?? null;
        },
    });

    // เติมค่าเดิมเมื่อโหลดเสร็จ
    useEffect(() => {
        if (doc) {
            setFormat(doc.game_format ?? '');
            setFeaturesText((doc.features ?? []).join('\n'));
            setVersion(doc.version ?? '');
            setNotes(doc.notes ?? '');
        }
    }, [doc]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const features = featuresText
                .split('\n')
                .map((f) => f.trim())
                .filter(Boolean);
            const { error } = await gameDocsService.upsert({
                item_id: item.id,
                owner_staff_id: item.owner_staff_id,
                game_format: format.trim() || null,
                features,
                version: version.trim() || null,
                notes: notes.trim() || null,
            });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['game-docs', item.id] });
            toast({ title: 'บันทึกรายละเอียดเกมสำเร็จ' });
            onClose();
        } catch (err) {
            toast({
                title: 'บันทึกไม่สำเร็จ',
                description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>รายละเอียดเกม — {item.title}</DialogTitle>
                <DialogDescription>
                    บันทึกรูปแบบ ฟีเจอร์ และเวอร์ชันของเกม — เห็นเฉพาะเจ้าของเกมและผู้ดูแลระบบ
                    (ต้องอัปเดตทุกครั้งที่สร้าง/แก้เกม)
                </DialogDescription>
            </DialogHeader>

            {isLoading ? (
                <div className="py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">รูปแบบเกม</label>
                        <Input
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            placeholder="เช่น ตอบคำถาม/quiz, จับคู่, platformer, ลากวาง"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">ฟีเจอร์ในเกม</label>
                        <Textarea
                            value={featuresText}
                            onChange={(e) => setFeaturesText(e.target.value)}
                            rows={5}
                            placeholder={'บรรทัดละ 1 ฟีเจอร์ เช่น\nเสียงไทย TTS\nโหมดศึกษา\nเล่นออนไลน์'}
                        />
                        <p className="text-xs text-muted-foreground">บรรทัดละ 1 ฟีเจอร์</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">เวอร์ชันบิลด์ล่าสุด</label>
                        <Input
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            placeholder="เช่น v1.2.0"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">บันทึก / changelog ย่อ (ไม่บังคับ)</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="สรุปสิ่งที่เปลี่ยนในเวอร์ชันนี้"
                        />
                    </div>

                    {doc?.updated_at && (
                        <p className="text-[11px] text-muted-foreground">
                            แก้ไขล่าสุด: {new Date(doc.updated_at).toLocaleString('th-TH')}
                        </p>
                    )}
                </div>
            )}

            <DialogFooter>
                <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
                <Button onClick={handleSave} disabled={saving || isLoading}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> บันทึก...</> : 'บันทึก'}
                </Button>
            </DialogFooter>
        </>
    );
};
