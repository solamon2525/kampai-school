/**
 * GameCoverAiDialog.tsx â€” à¸ªà¸£à¹‰à¸²à¸‡à¸›à¸à¹€à¸à¸¡à¸”à¹‰à¸§à¸¢ AI à¹à¸šà¸š "à¹€à¸Šà¹‡à¸à¸¥à¸´à¸ªà¸•à¹Œà¸ªà¸³à¹€à¸£à¹‡à¸ˆà¸£à¸¹à¸›" à¹à¸¥à¹‰à¸§à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™ thumbnail
 *
 * flow: à¹€à¸¥à¸·à¸­à¸à¸Šà¸´à¸› (à¸ªà¹„à¸•à¸¥à¹Œ/à¸ªà¸µ/à¸•à¸±à¸§à¹€à¸­à¸/à¸‰à¸²à¸/à¹€à¸­à¸Ÿà¹€à¸Ÿà¸à¸•à¹Œ â€” à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¸žà¸´à¸¡à¸žà¹Œ) â†’ "à¸ªà¸£à¹‰à¸²à¸‡à¸ à¸²à¸ž"
 *   (POST /api/generate-cover à¸”à¹‰à¸§à¸¢ parts[] â†’ Pollinations à¸„à¸·à¸™à¸ à¸²à¸žà¸¥à¹‰à¸§à¸™)
 * â†’ à¸§à¸²à¸”à¸¥à¸‡ canvas 1280Ã—720 + overlay à¸Šà¸·à¹ˆà¸­à¹€à¸à¸¡/à¸§à¸´à¸Šà¸² (Sarabun à¸à¸±à¹ˆà¸‡ client â†’ à¸•à¸±à¸§à¹„à¸—à¸¢à¸„à¸¡à¸Šà¸±à¸”)
 *   à¸•à¸²à¸¡à¸ªà¹„à¸•à¸¥à¹Œà¹‚à¸¥à¹‚à¸à¹‰à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸ â†’ preview â†’ "à¹ƒà¸Šà¹‰à¸›à¸à¸™à¸µà¹‰" â†’ à¸­à¸±à¸› storage + update thumbnail_url
 *
 * preset à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¸­à¸¢à¸¹à¹ˆà¸—à¸µà¹ˆ coverPresets.ts (à¹à¸à¹‰à¸ªà¹„à¸•à¸¥à¹Œà¸—à¸µà¹ˆà¹€à¸”à¸µà¸¢à¸§) Â· server gen = api/generate-cover.ts
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

// à¸•à¸±à¸” emoji/à¸Šà¹ˆà¸­à¸‡à¸§à¹ˆà¸²à¸‡à¸™à¸³à¸«à¸™à¹‰à¸²à¸­à¸­à¸à¸ˆà¸²à¸à¸Šà¸·à¹ˆà¸­à¹€à¸à¸¡ (à¹€à¸Šà¹ˆà¸™ "ðŸ”¤ English..." â†’ "English...") à¹€à¸žà¸·à¹ˆà¸­ overlay à¹ƒà¸«à¹‰à¸ªà¸§à¸¢
function cleanTitle(t: string): string {
    return t.replace(/^[\p{Extended_Pictographic}â€ï¸\s]+/u, '').trim();
}

// à¸§à¸²à¸”à¸«à¸±à¸§à¹€à¸£à¸·à¹ˆà¸­à¸‡ (Sarabun) à¸•à¸²à¸¡à¸ªà¹„à¸•à¸¥à¹Œà¹‚à¸¥à¹‚à¸à¹‰ â€” center à¸”à¹‰à¸²à¸™à¸šà¸™, auto-shrink à¹ƒà¸«à¹‰à¸žà¸­à¸”à¸µ
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
            // à¸—à¸­à¸‡à¸™à¸¹à¸™: à¹„à¸¥à¹ˆà¹€à¸‰à¸”à¸—à¸­à¸‡ + à¸‚à¸­à¸šà¹€à¸‚à¹‰à¸¡ + à¹€à¸‡à¸²à¸™à¸¹à¸™
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
            // à¸›à¹‰à¸²à¸¢à¹à¸šà¸™à¹€à¸™à¸­à¸£à¹Œ: à¹à¸–à¸šà¸à¸£à¸¡à¸—à¹ˆà¸²-à¸‚à¸­à¸šà¸—à¸­à¸‡ à¸«à¸¥à¸±à¸‡à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£ à¹à¸¥à¹‰à¸§à¸•à¸±à¸§à¸‚à¸²à¸§
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
            // à¸à¸²à¸£à¹Œà¸•à¸¹à¸™à¸›à¹Šà¸­à¸›: à¸ªà¸µà¸ªà¸” + à¸‚à¸­à¸šà¸‚à¸²à¸§à¸«à¸™à¸² + à¹€à¸‡à¸² drop
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
            // à¸™à¸µà¸­à¸­à¸™: à¸•à¸±à¸§à¸‚à¸²à¸§ + à¹€à¸£à¸·à¸­à¸‡à¹à¸ªà¸‡à¹„à¸‹à¹à¸­à¸™ (à¸‹à¹‰à¸­à¸™à¸«à¸¥à¸²à¸¢à¸Šà¸±à¹‰à¸™)
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
        case 'card': {
            const padX = 42;
            const padY = 18;
            const bw = Math.min(tw + padX * 2, COVER_W - 120);
            const bh = font + padY * 2;
            const bx = cx - bw / 2;
            const by = 42;
            ctx.shadowColor = 'rgba(0,0,0,0.22)';
            ctx.shadowBlur = 16;
            ctx.shadowOffsetY = 5;
            ctx.fillStyle = '#243b8f';
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 28);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(255,255,255,0.18)';
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 28);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillText(heading, cx, by + 10);
            break;
        }
        case 'classic':
        default: {
            // à¸„à¸¥à¸²à¸ªà¸ªà¸´à¸: à¸‚à¸²à¸§ + à¸‚à¸­à¸šà¸à¸£à¸¡à¸—à¹ˆà¸² + à¹€à¸‡à¸²
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

// à¸§à¸²à¸”à¸ à¸²à¸ž AI (cover-fit) + à¸«à¸±à¸§à¹€à¸£à¸·à¹ˆà¸­à¸‡à¹„à¸—à¸¢ + à¸›à¹‰à¸²à¸¢à¸§à¸´à¸Šà¸² à¸¥à¸‡ canvas
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

    // â”€â”€ à¸ à¸²à¸žà¸›à¸£à¸°à¸à¸­à¸š cover-fit â”€â”€
    const scale = Math.max(COVER_W / img.width, COVER_H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (COVER_W - dw) / 2, (COVER_H - dh) / 2, dw, dh);

    // â”€â”€ à¸«à¸±à¸§à¹€à¸£à¸·à¹ˆà¸­à¸‡ â”€â”€
    const heading = cleanTitle(title) || title;
    drawTitle(ctx, heading, titleStyle);

    // â”€â”€ à¸›à¹‰à¸²à¸¢à¸§à¸´à¸Šà¸² à¸¡à¸¸à¸¡à¸¥à¹ˆà¸²à¸‡à¸‹à¹‰à¸²à¸¢ (à¸—à¸­à¸‡/à¸à¸£à¸¡à¸—à¹ˆà¸² = brand) â”€â”€
    const badge = (subject || '').trim();
    if (badge && titleStyle !== 'card') {
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
    const imgRef = useRef<HTMLImageElement | null>(null); // à¸ à¸²à¸ž AI à¸¥à¹ˆà¸²à¸ªà¸¸à¸” (à¹„à¸§à¹‰à¸§à¸²à¸”à¸—à¸±à¸šà¹ƒà¸«à¸¡à¹ˆà¸•à¸­à¸™à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ªà¹„à¸•à¸¥à¹Œà¹‚à¸¥à¹‚à¸à¹‰)
    const [selection, setSelection] = useState<CoverSelection>({});
    const [titleStyle, setTitleStyle] = useState<TitleStyle>('classic');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);

    // à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ªà¹„à¸•à¸¥à¹Œà¹‚à¸¥à¹‚à¸à¹‰ â†’ à¸§à¸²à¸”à¸«à¸±à¸§à¹€à¸£à¸·à¹ˆà¸­à¸‡à¹ƒà¸«à¸¡à¹ˆà¸—à¸±à¸šà¸ à¸²à¸žà¹€à¸”à¸´à¸¡ (à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡ gen à¸ à¸²à¸žà¹ƒà¸«à¸¡à¹ˆ)
    useEffect(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        drawCover(canvas, img, item.title, item.subject ?? '', titleStyle);
        setPreviewUrl(canvas.toDataURL('image/png'));
    }, [titleStyle, item.title, item.subject]);

    const applyPack = (packId: string, pick: CoverSelection) => {
        setSelection(pick);
        if (packId === 'card') setTitleStyle('card');
    };
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
            if (!token) throw new Error('à¹€à¸‹à¸ªà¸Šà¸±à¸™à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸ â€” à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸šà¹ƒà¸«à¸¡à¹ˆ');

            const parts = buildParts(selection);
            const res = await fetch('/api/generate-cover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ subject: item.subject ?? '', parts, titleStyle }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            const { imageBase64, mimeType } = json as { imageBase64: string; mimeType: string };
            const img = new Image();
            img.src = `data:${mimeType};base64,${imageBase64}`;
            await img.decode();
            await document.fonts.ready; // à¹ƒà¸«à¹‰ Sarabun à¸žà¸£à¹‰à¸­à¸¡à¸à¹ˆà¸­à¸™à¸§à¸²à¸”à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£
            imgRef.current = img;
            const canvas = canvasRef.current;
            if (!canvas) throw new Error('canvas à¹„à¸¡à¹ˆà¸žà¸£à¹‰à¸­à¸¡');
            drawCover(canvas, img, item.title, item.subject ?? '', titleStyle);
            setPreviewUrl(canvas.toDataURL('image/png'));
        } catch (err) {
            toast({
                title: 'à¸ªà¸£à¹‰à¸²à¸‡à¸ à¸²à¸žà¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ',
                description: err instanceof Error ? err.message : 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”',
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
                canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('à¹à¸›à¸¥à¸‡à¸ à¸²à¸žà¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ'))), 'image/png'),
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
                title: 'à¸šà¸±à¸™à¸—à¸¶à¸à¸›à¸à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ',
                description: err instanceof Error ? err.message : 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”',
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
                <DialogTitle>à¸ªà¸£à¹‰à¸²à¸‡à¸›à¸ AI â€” {item.title}</DialogTitle>
                <DialogDescription>
                    à¹€à¸¥à¸·à¸­à¸à¸ˆà¸²à¸à¹€à¸Šà¹‡à¸à¸¥à¸´à¸ªà¸•à¹Œ (à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¸žà¸´à¸¡à¸žà¹Œ) â€” AI à¸§à¸²à¸”à¸ à¸²à¸žà¸›à¸£à¸°à¸à¸­à¸š 16:9 à¹à¸¥à¹‰à¸§à¹ƒà¸ªà¹ˆà¸Šà¸·à¹ˆà¸­à¹€à¸à¸¡/à¸§à¸´à¸Šà¸²à¸—à¸±à¸šà¹ƒà¸«à¹‰à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* à¸Šà¸¸à¸”à¸ªà¸³à¹€à¸£à¹‡à¸ˆà¸£à¸¹à¸› â€” à¸„à¸¥à¸´à¸à¹€à¸”à¸µà¸¢à¸§à¹€à¸‹à¹‡à¸•à¸—à¸¸à¸à¹à¸à¸™ */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">à¸Šà¸¸à¸”à¸ªà¸³à¹€à¸£à¹‡à¸ˆà¸£à¸¹à¸› (à¸„à¸¥à¸´à¸à¹€à¸”à¸µà¸¢à¸§)</label>
                    <div className="flex flex-wrap gap-1.5">
                        {STYLE_PACKS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                disabled={generating || saving}
                                onClick={() => applyPack(p.id, p.pick)}
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
                            <Dice5 className="h-3.5 w-3.5" /> à¸ªà¸¸à¹ˆà¸¡
                        </button>
                    </div>
                </div>

                {/* à¹à¸à¸™à¹€à¸¥à¸·à¸­à¸à¸—à¸µà¸¥à¸°à¸”à¹‰à¸²à¸™ */}
                {COVER_GROUPS.map((group) => (
                    <div key={group.key} className="space-y-1.5">
                        <label className="text-sm font-medium">
                            {group.label}
                            {group.multi && <span className="text-xs text-muted-foreground"> (à¹€à¸¥à¸·à¸­à¸à¹„à¸”à¹‰à¸«à¸¥à¸²à¸¢à¸­à¸¢à¹ˆà¸²à¸‡)</span>}
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

                {/* à¸ªà¹„à¸•à¸¥à¹Œà¹‚à¸¥à¹‚à¸à¹‰à¸Šà¸·à¹ˆà¸­à¹€à¸à¸¡ (à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¹„à¸”à¹‰à¸—à¸±à¸™à¸—à¸µà¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡ gen à¹ƒà¸«à¸¡à¹ˆ) */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">à¸ªà¹„à¸•à¸¥à¹Œà¹‚à¸¥à¹‚à¸à¹‰à¸Šà¸·à¹ˆà¸­à¹€à¸à¸¡</label>
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
                        alt="à¸•à¸±à¸§à¸­à¸¢à¹ˆà¸²à¸‡à¸›à¸"
                        className="w-full aspect-video object-contain rounded-lg border border-border bg-muted"
                    />
                ) : (
                    <div className="w-full aspect-video rounded-lg border border-dashed border-border bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                        <ImageIcon className="h-6 w-6" />
                        à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸ à¸²à¸ž â€” à¹€à¸¥à¸·à¸­à¸à¸Šà¸´à¸›à¹à¸¥à¹‰à¸§à¸à¸” "à¸ªà¸£à¹‰à¸²à¸‡à¸ à¸²à¸ž"
                    </div>
                )}
                <canvas ref={canvasRef} width={COVER_W} height={COVER_H} className="hidden" />

                <Button variant="outline" className="w-full" onClick={handleGenerate} disabled={generating || saving}>
                    {generating
                        ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> à¸à¸³à¸¥à¸±à¸‡à¸ªà¸£à¹‰à¸²à¸‡à¸ à¸²à¸žâ€¦</>
                        : <><Sparkles className="h-4 w-4 mr-1" /> {previewUrl ? 'à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸«à¸¡à¹ˆà¸­à¸µà¸à¸„à¸£à¸±à¹‰à¸‡' : 'à¸ªà¸£à¹‰à¸²à¸‡à¸ à¸²à¸ž'}</>}
                </Button>
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={onCancel} disabled={saving || generating}>à¸¢à¸à¹€à¸¥à¸´à¸</Button>
                <Button onClick={handleSave} disabled={!previewUrl || saving || generating}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> à¸à¸³à¸¥à¸±à¸‡à¸šà¸±à¸™à¸—à¸¶à¸â€¦</> : 'à¹ƒà¸Šà¹‰à¸›à¸à¸™à¸µà¹‰'}
                </Button>
            </DialogFooter>
        </>
    );
};
