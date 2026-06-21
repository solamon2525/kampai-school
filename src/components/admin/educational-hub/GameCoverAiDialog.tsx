/**
 * GameCoverAiDialog.tsx — สร้างปกเกมด้วย AI แบบ "เช็กลิสต์สำเร็จรูป" แล้วเปลี่ยน thumbnail
 *
 * flow: เลือกชิป (สไตล์/สี/ตัวเอก/ฉาก/เอฟเฟกต์ — ไม่ต้องพิมพ์) → "สร้างภาพ"
 *   (POST /api/generate-cover ด้วย parts[] → Pollinations คืนภาพล้วน)
 * → วาดลง canvas 1280×720 + overlay ชื่อเกม/วิชา (Sarabun ฝั่ง client → ตัวไทยคมชัด)
 *   ตามสไตล์โลโก้ที่เลือก → preview → "ใช้ปกนี้" → อัป storage + update thumbnail_url
 *
 * preset ทั้งหมดอยู่ที่ coverPresets.ts (แก้สไตล์ที่เดียว) · server gen = api/generate-cover.ts
 */

import { useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, ImageIcon, Dice5 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { educationalHubService, type EduHubItem } from '@/services/educational-hub.service';
import {
    COVER_GROUPS, STYLE_PACKS, TITLE_STYLES,
    buildParts, randomSelection,
    type CoverSelection, type TitleStyle,
} from './coverPresets';

const COVER_W = 1280;
const COVER_H = 720;

// ตัด emoji/ช่องว่างนำหน้าออกจากชื่อเกม (เช่น "🔤 English..." → "English...") เพื่อ overlay ให้สวย
function cleanTitle(t: string): string {
    return t.replace(/^[\p{Extended_Pictographic}‍️\s]+/u, '').trim();
}

// วาดหัวเรื่อง (Sarabun) ตามสไตล์โลโก้ — center ด้านบน, auto-shrink ให้พอดี
function drawTitle(ctx: CanvasRenderingContext2D, heading: string, titleStyle: TitleStyle) {
    let font = 76;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    do {
        ctx.font = `800 ${font}px Sarabun, sans-serif`;
        if (ctx.measureText(heading).width <= COVER_W - 140) break;
        font -= 4;
    } while (font > 40);

    const cx = COVER_W / 2;
    const top = 34;
    const tw = ctx.measureText(heading).width;

    ctx.save();
    ctx.lineJoin = 'round';

    switch (titleStyle) {
        case 'gold': {
            // ทองนูน: ไล่เฉดทอง + ขอบเข้ม + เงานูน
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 4;
            ctx.lineWidth = font * 0.18;
            ctx.strokeStyle = '#7c4a03';
            ctx.strokeText(heading, cx, top);
            ctx.shadowColor = 'transparent';
            const grad = ctx.createLinearGradient(0, top, 0, top + font);
            grad.addColorStop(0, '#fff7cc');
            grad.addColorStop(0.5, '#fcd34d');
            grad.addColorStop(1, '#d97706');
            ctx.fillStyle = grad;
            ctx.fillText(heading, cx, top);
            break;
        }
        case 'banner': {
            // ป้ายแบนเนอร์: แถบกรมท่า-ขอบทอง หลังตัวอักษร แล้วตัวขาว
            const padX = 40;
            const bh = font + 28;
            const bw = Math.min(tw + padX * 2, COVER_W - 40);
            const bx = cx - bw / 2;
            const by = top - 14;
            ctx.shadowColor = 'rgba(0,0,0,0.35)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = '#1e3a5f';
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 18);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 18);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillText(heading, cx, top);
            break;
        }
        case 'pop': {
            // การ์ตูนป๊อป: สีสด + ขอบขาวหนา + เงา drop
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetY = 6;
            ctx.lineWidth = font * 0.22;
            ctx.strokeStyle = '#ffffff';
            ctx.strokeText(heading, cx, top);
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = '#ff4d8d';
            ctx.fillText(heading, cx, top);
            break;
        }
        case 'neon': {
            // นีออน: ตัวขาว + เรืองแสงไซแอน (ซ้อนหลายชั้น)
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#22d3ee';
            for (let i = 0; i < 3; i++) {
                ctx.shadowBlur = 24;
                ctx.fillText(heading, cx, top);
            }
            ctx.shadowBlur = 0;
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#0891b2';
            ctx.strokeText(heading, cx, top);
            ctx.fillText(heading, cx, top);
            break;
        }
        case 'classic':
        default: {
            // คลาสสิก: ขาว + ขอบกรมท่า + เงา
            ctx.shadowColor = 'rgba(0,0,0,0.55)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 3;
            ctx.lineWidth = font * 0.16;
            ctx.strokeStyle = '#1e3a5f';
            ctx.strokeText(heading, cx, top);
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(heading, cx, top);
            break;
        }
    }
    ctx.restore();
}

// วาดภาพ AI (cover-fit) + หัวเรื่องไทย + ป้ายวิชา ลง canvas
function drawCover(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    title: string,
    subject: string,
    titleStyle: TitleStyle,
) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, COVER_W, COVER_H);

    // ── ภาพประกอบ cover-fit ──
    const scale = Math.max(COVER_W / img.width, COVER_H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (COVER_W - dw) / 2, (COVER_H - dh) / 2, dw, dh);

    // ── หัวเรื่อง ──
    const heading = cleanTitle(title) || title;
    drawTitle(ctx, heading, titleStyle);

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
    const imgRef = useRef<HTMLImageElement | null>(null); // ภาพ AI ล่าสุด (ไว้วาดทับใหม่ตอนเปลี่ยนสไตล์โลโก้)
    const [selection, setSelection] = useState<CoverSelection>({});
    const [titleStyle, setTitleStyle] = useState<TitleStyle>('classic');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);

    // เปลี่ยนสไตล์โลโก้ → วาดหัวเรื่องใหม่ทับภาพเดิม (ไม่ต้อง gen ภาพใหม่)
    useEffect(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        drawCover(canvas, img, item.title, item.subject ?? '', titleStyle);
        setPreviewUrl(canvas.toDataURL('image/png'));
    }, [titleStyle, item.title, item.subject]);

    const applyPack = (pick: CoverSelection) => setSelection(pick);
    const randomize = () => setSelection(randomSelection());

    const toggle = (groupKey: string, multi: boolean, id: string) => {
        setSelection((prev) => {
            if (!multi) return { ...prev, [groupKey]: prev[groupKey] === id ? '' : id };
            const cur = Array.isArray(prev[groupKey]) ? (prev[groupKey] as string[]) : [];
            const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
            return { ...prev, [groupKey]: next };
        });
    };

    const isSelected = (groupKey: string, multi: boolean, id: string): boolean => {
        const sel = selection[groupKey];
        return multi ? Array.isArray(sel) && sel.includes(id) : sel === id;
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('เซสชันหมดอายุ — เข้าสู่ระบบใหม่');

            const parts = buildParts(selection);
            const res = await fetch('/api/generate-cover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ subject: item.subject ?? '', parts }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            const { imageBase64, mimeType } = json as { imageBase64: string; mimeType: string };
            const img = new Image();
            img.src = `data:${mimeType};base64,${imageBase64}`;
            await img.decode();
            await document.fonts.ready; // ให้ Sarabun พร้อมก่อนวาดตัวอักษร
            imgRef.current = img;
            const canvas = canvasRef.current;
            if (!canvas) throw new Error('canvas ไม่พร้อม');
            drawCover(canvas, img, item.title, item.subject ?? '', titleStyle);
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

    const chipBase =
        'px-2.5 py-1 text-xs rounded-full border transition-colors disabled:opacity-50';

    return (
        <>
            <DialogHeader>
                <DialogTitle>สร้างปก AI — {item.title}</DialogTitle>
                <DialogDescription>
                    เลือกจากเช็กลิสต์ (ไม่ต้องพิมพ์) — AI วาดภาพประกอบ 16:9 แล้วใส่ชื่อเกม/วิชาทับให้อัตโนมัติ
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* ชุดสำเร็จรูป — คลิกเดียวเซ็ตทุกแกน */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">ชุดสำเร็จรูป (คลิกเดียว)</label>
                    <div className="flex flex-wrap gap-1.5">
                        {STYLE_PACKS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                disabled={generating || saving}
                                onClick={() => applyPack(p.pick)}
                                className={cn(chipBase, 'bg-card text-foreground border-border hover:bg-accent')}
                            >
                                {p.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            disabled={generating || saving}
                            onClick={randomize}
                            className={cn(chipBase, 'bg-card text-foreground border-border hover:bg-accent inline-flex items-center gap-1')}
                        >
                            <Dice5 className="h-3.5 w-3.5" /> สุ่ม
                        </button>
                    </div>
                </div>

                {/* แกนเลือกทีละด้าน */}
                {COVER_GROUPS.map((group) => (
                    <div key={group.key} className="space-y-1.5">
                        <label className="text-sm font-medium">
                            {group.label}
                            {group.multi && <span className="text-xs text-muted-foreground"> (เลือกได้หลายอย่าง)</span>}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {group.options.map((opt) => {
                                const active = isSelected(group.key, group.multi, opt.id);
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        disabled={generating || saving}
                                        onClick={() => toggle(group.key, group.multi, opt.id)}
                                        className={cn(
                                            chipBase,
                                            active
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-card text-foreground border-border hover:bg-accent',
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* สไตล์โลโก้ชื่อเกม (เปลี่ยนได้ทันทีไม่ต้อง gen ใหม่) */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">สไตล์โลโก้ชื่อเกม</label>
                    <div className="flex flex-wrap gap-1.5">
                        {TITLE_STYLES.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                disabled={saving}
                                onClick={() => setTitleStyle(t.id)}
                                className={cn(
                                    chipBase,
                                    titleStyle === t.id
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-card text-foreground border-border hover:bg-accent',
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
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
                        ยังไม่มีภาพ — เลือกชิปแล้วกด "สร้างภาพ"
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
