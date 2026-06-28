import { useEffect, useRef, useState } from 'react';
import {
    type CharacterAnimationConfig,
    characterFrameRect,
    characterPoseLabel,
    pickCharacterFrameIndex,
    poseKeyFromPlayerState,
    resolveCharacterAnimation,
    resolveFootAnchor,
    shouldFlipCharacterFace,
    getPoseFrames,
} from '@/lib/character-animation';
import type { CharacterColorConfig } from '@/lib/character-color';
import { recolorImageToCanvas } from '@/lib/sprite-recolor';
import { SPRITE_CHECKERBOARD_STYLE } from '@/lib/sprite-background';
import { cn } from '@/lib/utils';

type Props = {
    sheetUrl: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    animationConfig?: CharacterAnimationConfig | null;
    colorConfig?: CharacterColorConfig | null;
    player?: 1 | 2;
    width?: number;
    height?: number;
    className?: string;
    drawW?: number;
    drawH?: number;
};

const RUN_PX = 72;
const WALK_PX = 42;
const GRAVITY = 720;
const JUMP_VY = -260;
const RUN_SPEED = 4.5;
const MARGIN = 28;
const GROUND_PAD = 14;

type SimState = {
    x: number;
    vx: number;
    vy: number;
    jumpY: number;
    onGround: boolean;
    state: string;
    face: number;
    animTime: number;
    idleLeft: number;
    jumpCd: number;
    flairLeft: number;
    flairState: string | null;
    dir: 1 | -1;
};

function hasPose(config: CharacterAnimationConfig, pose: string): boolean {
    return getPoseFrames(config, pose as never) != null;
}

export function CharacterSheetScenePreview({
    sheetUrl,
    frameWidth,
    frameHeight,
    frameCount,
    animationConfig,
    colorConfig,
    player = 1,
    width = 320,
    height = 148,
    className,
    drawW = 96,
    drawH = 128,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const simRef = useRef<SimState>({
        x: 48,
        vx: RUN_PX,
        vy: 0,
        jumpY: 0,
        onGround: true,
        state: 'run',
        face: 1,
        animTime: 0,
        idleLeft: 0,
        jumpCd: 1.2,
        flairLeft: 0,
        flairState: null,
        dir: 1,
    });
    const [label, setLabel] = useState('วิ่ง');
    const labelRef = useRef('วิ่ง');
    const [drawSrc, setDrawSrc] = useState<CanvasImageSource | null>(null);

    useEffect(() => {
        let cancelled = false;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            if (cancelled) return;
            setDrawSrc(await recolorImageToCanvas(img, colorConfig, player));
        };
        img.onerror = () => { if (!cancelled) setDrawSrc(null); };
        img.src = sheetUrl;
        return () => { cancelled = true; };
    }, [sheetUrl, colorConfig, player]);

    useEffect(() => {
        simRef.current = {
            x: 48,
            vx: RUN_PX,
            vy: 0,
            jumpY: 0,
            onGround: true,
            state: 'run',
            face: 1,
            animTime: 0,
            idleLeft: 0,
            jumpCd: 1.2,
            flairLeft: 0,
            flairState: null,
            dir: 1,
        };
    }, [sheetUrl, animationConfig, frameCount]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const anim = resolveCharacterAnimation(animationConfig, frameCount);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        let raf = 0;
        let last = 0;

        const tick = (now: number) => {
            const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
            last = now;
            const sim = simRef.current;
            const w = canvas.width;
            const h = canvas.height;
            const groundY = h - GROUND_PAD;
            const minX = MARGIN;
            const maxX = w - MARGIN;

            sim.animTime += dt;

            if (sim.flairLeft > 0) {
                sim.flairLeft -= dt;
                sim.vx = 0;
                sim.vy = 0;
                sim.onGround = true;
                sim.state = sim.flairState ?? 'idle';
                if (sim.flairLeft <= 0) {
                    sim.flairState = null;
                    sim.vx = sim.dir * RUN_PX;
                    sim.state = 'run';
                }
            } else if (sim.idleLeft > 0) {
                sim.idleLeft -= dt;
                sim.vx = 0;
                sim.vy = 0;
                sim.onGround = true;
                sim.state = 'idle';
                if (sim.idleLeft <= 0) {
                    sim.dir = sim.x >= maxX - 4 ? -1 : 1;
                    sim.face = sim.dir;
                    sim.vx = sim.dir * RUN_PX;
                    sim.state = 'run';
                    sim.jumpCd = 0.8;
                }
            } else {
                sim.jumpCd -= dt;

                if (sim.onGround) {
                    sim.x += sim.vx * dt;
                    sim.face = sim.vx >= 0 ? 1 : -1;

                    if (sim.x >= maxX) {
                        sim.x = maxX;
                        sim.vx = 0;
                        sim.idleLeft = 0.65;
                        sim.state = 'idle';
                        if (hasPose(anim, 'happy')) {
                            sim.flairState = 'happy';
                            sim.flairLeft = 0.85;
                        } else if (hasPose(anim, 'attack')) {
                            sim.flairState = 'attack';
                            sim.flairLeft = 0.55;
                        }
                    } else if (sim.x <= minX) {
                        sim.x = minX;
                        sim.vx = 0;
                        sim.idleLeft = 0.65;
                        sim.state = 'idle';
                    } else if (sim.jumpCd <= 0 && Math.abs(sim.vx) > 0) {
                        sim.vy = JUMP_VY;
                        sim.jumpY = 0;
                        sim.onGround = false;
                        sim.state = 'jump';
                        sim.jumpCd = 2.4 + Math.random() * 1.2;
                    } else {
                        sim.state = Math.abs(sim.vx) >= WALK_PX * 0.9 ? 'run' : 'walk';
                    }
                } else {
                    sim.vy += GRAVITY * dt;
                    sim.jumpY += sim.vy * dt;
                    sim.x += sim.vx * dt * 0.85;
                    sim.state = 'jump';
                    if (sim.jumpY >= 0) {
                        sim.jumpY = 0;
                        sim.vy = 0;
                        sim.onGround = true;
                        sim.state = hasPose(anim, 'land') ? 'land' : 'run';
                        if (sim.state === 'land') {
                            sim.flairState = 'land';
                            sim.flairLeft = 0.2;
                            sim.vx = 0;
                        }
                    }
                }
            }

            const playerSim = {
                state: sim.state,
                vx: sim.vx / 16,
                vy: sim.vy / 60,
                onGround: sim.onGround,
                animTime: sim.animTime,
            };
            const pose = poseKeyFromPlayerState(playerSim, { runSpeed: RUN_SPEED });
            const frameIdx = pickCharacterFrameIndex(playerSim, anim, { runSpeed: RUN_SPEED });
            const { sx, sy } = characterFrameRect(frameIdx, frameWidth, frameHeight, anim);
            const foot = resolveFootAnchor(anim, pose);
            const scale = Math.min((w - 24) / drawW, (h - 28) / drawH);
            const dw = drawW * scale;
            const dh = drawH * scale;
            const dy = groundY - dh * foot.anchorFoot + foot.feetPad * scale + sim.jumpY;
            const flip = shouldFlipCharacterFace(sim.face, anim);

            ctx.clearRect(0, 0, w, h);

            const sky = ctx.createLinearGradient(0, 0, 0, groundY);
            sky.addColorStop(0, 'hsl(var(--muted) / 0.35)');
            sky.addColorStop(1, 'hsl(var(--background))');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, w, groundY);

            ctx.fillStyle = 'hsl(var(--muted) / 0.55)';
            ctx.fillRect(0, groundY, w, h - groundY);
            ctx.strokeStyle = 'hsl(var(--border))';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, groundY);
            ctx.lineTo(w, groundY);
            ctx.stroke();

            for (let i = 0; i < 5; i++) {
                const bx = ((i * 67 + Math.floor(sim.animTime * 12) * sim.dir) % (w + 40)) - 20;
                ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.15)';
                ctx.fillRect(bx, groundY - 22 - (i % 3) * 8, 12, 4);
            }

            if (drawSrc) {
                ctx.save();
                if (flip) {
                    ctx.translate(sim.x, dy);
                    ctx.scale(-1, 1);
                    ctx.drawImage(drawSrc, sx, sy, frameWidth, frameHeight, -dw / 2, 0, dw, dh);
                } else {
                    ctx.drawImage(drawSrc, sx, sy, frameWidth, frameHeight, sim.x - dw / 2, dy, dw, dh);
                }
                ctx.restore();
            }

            const poseLabel = characterPoseLabel(pose);
            if (labelRef.current !== poseLabel) {
                labelRef.current = poseLabel;
                setLabel(poseLabel);
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [drawSrc, sheetUrl, frameWidth, frameHeight, frameCount, animationConfig, drawW, drawH]);

    return (
        <div className={cn('space-y-1', className)}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="w-full rounded border border-border"
                style={{
                    imageRendering: 'pixelated',
                    maxWidth: width,
                    ...SPRITE_CHECKERBOARD_STYLE,
                }}
                aria-label={`จำลองเกม — ${label}`}
            />
            <p className="text-[10px] text-center text-muted-foreground">
                🎮 จำลองเกม — เดิน·วิ่ง·กระโดด·หยุดขอบ · ท่า: {label}
            </p>
        </div>
    );
}
