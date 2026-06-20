/**
 * GameCoverAiDialog.tsx — สร้างปกเกมด้วย AI (Gemini) แล้วเปลี่ยน thumbnail
 *
 * flow: กรอกฉาก/โทนสี → "สร้างภาพ" (POST /api/generate-cover → Gemini คืนภาพล้วน)
 * → วาดลง canvas 1280×720 + overlay ชื่อเกม/วิชา (ฟอนต์ Sarabun ฝั่ง client → ตัวไทยคมชัด)
 * → preview → "ใช้ปกนี้" → อัปขึ้น storage + update educational_hub_items.thumbnail_url
 *
 * ดู public/COVER-PROMPT.md (มาตรฐานปก) · server gen = api/generate-cover.ts
 */

import { useState, useRef } from 'react';
import { Loader2, Sparkles, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { educationalHubService, type EduHubItem } from '@/services/educational-hub.service';

const COVER_W = 1280;
const COVER_H = 720;

// ตัด emoji/ช่องว่างนำหน้าออกจากชื่อเกม (เช่น "🔤 English..." → "English...") เพื่อ overlay ให้สวย
function cleanTitle(t: string): string {
    return t.replace(/^[\p{Extended_Pictographic}‍️\s]+/u, '').trim();
}

// วาดภาพ AI (cover-fit) + หัวเรื่องไทย + ป้ายวิชา ลง canvas
function drawCover(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    title: string,
    subject: string,
) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, COVER_W, COVER_H);

    // ── ภาพประกอบ cover-fit ──
    const scale = Math.max(COVER_W / img.width, COVER_H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (COVER_W - dw) / 2, (COVER_H - dh) / 2, dw, dh);

    // ── หัวเรื่อง (ขาว + เส้นขอบกรมท่า + เงา) อ่านออกทุกพื้นหลัง ──
    const heading = cleanTitle(title) || title;
    let font = 76;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    do {
        ctx.font = `700 ${font}px Sarabun, sans-serif`;
        if (ctx.measureText(heading).width <= COVER_W - 140) break;
        font -= 4;
    } while (font > 40);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.lineJoin = 'round';
    ctx.lineWidth = font * 0.16;
    ctx.strokeStyle = '#1e3a5f';
    ctx.strokeText(heading, COVER_W / 2, 34);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(heading, COVER_W / 2, 34);
    ctx.restore();

    // ── ป้ายวิชา มุมล่างซ้าย (ทอง/กรมท่า = brand) ──
    const badge = (subject || '').trim();
    if (badge) {
        ctx.font = '700 34px Sarabun, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const padX = 22;
        const tw = ctx.measureText(badge).width;
        const bw = tw + padX * 2;
        const bh = 56;
        const bx = 36;
        const by = COVER_H - bh - 36;
        ctx.fillStyle = '#f59e0b';
        // roundRect รองรับในเบราว์เซอร์สมัยใหม่
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 14);
        ctx.fill();
        ctx.fillStyle = '#1e3a5f';
        ctx.fillText(badge, bx + padX, by + bh / 2 + 1);
    }
}

export const GameCoverAiDialog = ({
    item,
    onSaved,
    onCancel,
}: {
    item: EduHubItem;
    onSaved: () => void;
    onCancel: () => void;
}) => {
    const { toast } = useToast();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scene, setScene] = useState('');
    const [colors, setColors] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('เซสชันหมดอายุ — เข้าสู่ระบบใหม่');

            const res = await fetch('/api/generate-cover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ subject: item.subject ?? '', scene, colors }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            const { imageBase64, mimeType } = json as { imageBase64: string; mimeType: string };
            const img = new Image();
            img.src = `data:${mimeType};base64,${imageBase64}`;
            await img.decode();
            await document.fonts.ready; // ให้ Sarabun พร้อมก่อนวาดตัวอักษร
            const canvas = canvasRef.current;
            if (!canvas) throw new Error('canvas ไม่พร้อม');
            drawCover(canvas, img, item.title, item.subject ?? '');
            setPreviewUrl(canvas.toDataURL('image/png'));
        } catch (err) {
            toast({
                title: 'สร้างภาพไม่สำเร็จ',
                description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
                variant: 'destructive',
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !previewUrl) return;
        setSaving(true);
        try {
            const blob: Blob = await new Promise((resolve, reject) =>
                canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('แปลงภาพไม่สำเร็จ'))), 'image/png'),
            );
            const slug = item.game_slug || 'game';
            const file = new File([blob], `${slug}-cover.png`, { type: 'image/png' });
            const { url, error: upErr } = await educationalHubService.uploadFile('shared/covers', file);
            if (upErr) throw upErr;
            const { error: updErr } = await educationalHubService.updateItem(item.id, { thumbnail_url: url });
            if (updErr) throw updErr;
            onSaved();
        } catch (err) {
            toast({
                title: 'บันทึกปกไม่สำเร็จ',
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
                <DialogTitle>สร้างปก AI — {item.title}</DialogTitle>
                <DialogDescription>
                    AI วาดภาพประกอบตามมาตรฐาน (chibi เด็กไทย 16:9) แล้วใส่ชื่อเกม/วิชาทับให้อัตโนมัติ —
                    กดสร้าง ดูตัวอย่าง แล้วค่อยกด "ใช้ปกนี้"
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">ฉาก / สิ่งที่เด็กกำลังทำ (สื่อ gameplay)</label>
                    <Textarea
                        value={scene}
                        onChange={(e) => setScene(e.target.value)}
                        rows={3}
                        placeholder={'เช่น "เด็กยืนเลือกคำตอบ 3 ป้ายภาษาอังกฤษ" / "เด็กต่อวงจรไฟฟ้าเข้าหลอดไฟที่สว่างขึ้น"'}
                    />
                    <p className="text-xs text-muted-foreground">เว้นว่างได้ — AI จะเดาจากวิชา "{item.subject ?? '—'}"</p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">โทนสีหลัก (ไม่บังคับ)</label>
                    <Input
                        value={colors}
                        onChange={(e) => setColors(e.target.value)}
                        placeholder="เช่น ฟ้า-น้ำเงิน / ม่วง-ทอง / เขียวสด"
                    />
                </div>

                {/* preview */}
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="ตัวอย่างปก"
                        className="w-full aspect-video object-contain rounded-lg border border-border bg-muted"
                    />
                ) : (
                    <div className="w-full aspect-video rounded-lg border border-dashed border-border bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                        <ImageIcon className="h-6 w-6" />
                        ยังไม่มีภาพ — กด "สร้างภาพ"
                    </div>
                )}
                <canvas ref={canvasRef} width={COVER_W} height={COVER_H} className="hidden" />

                <Button variant="outline" className="w-full" onClick={handleGenerate} disabled={generating || saving}>
                    {generating
                        ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> กำลังสร้างภาพ…</>
                        : <><Sparkles className="h-4 w-4 mr-1" /> {previewUrl ? 'สร้างใหม่อีกครั้ง' : 'สร้างภาพ'}</>}
                </Button>
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={onCancel} disabled={saving || generating}>ยกเลิก</Button>
                <Button onClick={handleSave} disabled={!previewUrl || saving || generating}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> กำลังบันทึก…</> : 'ใช้ปกนี้'}
                </Button>
            </DialogFooter>
        </>
    );
};
