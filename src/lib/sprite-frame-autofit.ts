/**
 * Auto-fit sprite sheet grid — หา fw/fh จาก gutter + content bbox
 * ให้ตัวละครอยู่ในเฟรม ไม่ล้นไปแตะเฟรมถัดไปในแถวเดียวกัน
 */

export type SpriteAutoFitOptions = {
    /** จำนวนคอลัมน์ที่คาด (จาก preset) — ว่าง = ตรวจอัตโนมัติ */
    cols?: number;
    /** จำนวนแถวที่คาด */
    rows?: number;
    frameCount?: number;
    alphaThreshold?: number;
    /** ช่องว่างขั้นต่ำระหว่าง sprite (px) */
    gutterMin?: number;
    /** padding ขอบในเซลล์ที่ยอมให้ content ใกล้ขอบ */
    cellPadding?: number;
};

export type SpriteCellAnalysis = {
    frame: number;
    row: number;
    col: number;
    /** bbox ของ content ในเซลล์ (relative 0..fw/fh) */
    contentLeft: number;
    contentTop: number;
    contentRight: number;
    contentBottom: number;
    hasContent: boolean;
    overflowLeft: boolean;
    overflowRight: boolean;
    overflowTop: boolean;
    overflowBottom: boolean;
};

export type SpriteAutoFitResult = {
    frameWidth: number;
    frameHeight: number;
    cols: number;
    rows: number;
    frameCount: number;
    /** 0–1 ความมั่นใจจาก gutter + ไม่ overflow */
    confidence: number;
    overflowFrames: number[];
    cells: SpriteCellAnalysis[];
    /** ข้อความสรุป */
    summary: string;
};

function columnDensity(
    data: Uint8ClampedArray,
    imgW: number,
    y0: number,
    y1: number,
    alphaThreshold: number,
): number[] {
    const density = new Array<number>(imgW).fill(0);
    for (let y = y0; y < y1; y++) {
        const row = y * imgW * 4;
        for (let x = 0; x < imgW; x++) {
            if (data[row + x * 4 + 3] >= alphaThreshold) density[x]++;
        }
    }
    return density;
}

function rowDensity(
    data: Uint8ClampedArray,
    imgW: number,
    imgH: number,
    alphaThreshold: number,
): number[] {
    const density = new Array<number>(imgH).fill(0);
    for (let y = 0; y < imgH; y++) {
        const row = y * imgW * 4;
        for (let x = 0; x < imgW; x++) {
            if (data[row + x * 4 + 3] >= alphaThreshold) density[y]++;
        }
    }
    return density;
}

function smoothDensity(density: number[], radius: number): number[] {
    if (radius <= 0) return density;
    const out = new Array<number>(density.length).fill(0);
    for (let i = 0; i < density.length; i++) {
        let sum = 0;
        let n = 0;
        for (let d = -radius; d <= radius; d++) {
            const j = i + d;
            if (j >= 0 && j < density.length) {
                sum += density[j];
                n++;
            }
        }
        out[i] = sum / n;
    }
    return out;
}

function findValleyCenters(density: number[], gutterMin: number): number[] {
    const max = Math.max(...density, 1);
    const threshold = max * 0.08;
    const valleys: number[] = [];
    let inGap = false;
    let gapStart = 0;
    for (let i = 1; i < density.length - 1; i++) {
        const low = density[i] <= threshold;
        if (low && !inGap) {
            inGap = true;
            gapStart = i;
        } else if (!low && inGap) {
            const gapW = i - gapStart;
            if (gapW >= gutterMin) valleys.push(Math.floor((gapStart + i) / 2));
            inGap = false;
        }
    }
    if (inGap) {
        const gapW = density.length - gapStart;
        if (gapW >= gutterMin) valleys.push(Math.floor((gapStart + density.length) / 2));
    }
    return valleys;
}

/** เลือก N เส้นแบ่งจาก valleys ให้ใกล้ตำแหน่ง ideal มากที่สุด */
function pickSplitLines(
    valleys: number[],
    segmentCount: number,
    totalLen: number,
): number[] {
    const need = segmentCount - 1;
    if (need <= 0) return [];
    const ideal = Array.from({ length: need }, (_, i) => ((i + 1) * totalLen) / segmentCount);
    if (valleys.length >= need) {
        const used = new Set<number>();
        return ideal.map((target) => {
            let best = valleys[0];
            let bestD = Infinity;
            for (const v of valleys) {
                if (used.has(v)) continue;
                const d = Math.abs(v - target);
                if (d < bestD) {
                    bestD = d;
                    best = v;
                }
            }
            used.add(best);
            return best;
        });
    }
    return ideal.map((x) => Math.round(x));
}

function boundariesFromSplits(totalLen: number, splits: number[]): number[] {
    const sorted = [...splits].sort((a, b) => a - b);
    return [0, ...sorted, totalLen];
}

function median(values: number[]): number {
    if (!values.length) return 0;
    const s = [...values].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function cellContentBBox(
    data: Uint8ClampedArray,
    imgW: number,
    x0: number,
    y0: number,
    cw: number,
    ch: number,
    alphaThreshold: number,
): { left: number; top: number; right: number; bottom: number; empty: boolean } {
    let minX = cw;
    let minY = ch;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < ch; y++) {
        const gy = y0 + y;
        const row = gy * imgW * 4;
        for (let x = 0; x < cw; x++) {
            const gx = x0 + x;
            if (data[row + gx * 4 + 3] >= alphaThreshold) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }
    if (maxX < 0) return { left: 0, top: 0, right: 0, bottom: 0, empty: true };
    return { left: minX, top: minY, right: maxX, bottom: maxY, empty: false };
}

/** ตรวจว่า content สองเซลล์ในแถวเดียวกันทับซ้อนกัน (ล้นไปแตะเพื่อน) */
function rowCellsContentOverlap(
    cells: SpriteCellAnalysis[],
    col: number,
    frameWidth: number,
): boolean {
    const a = cells.find((c) => c.col === col);
    const b = cells.find((c) => c.col === col + 1);
    if (!a?.hasContent || !b?.hasContent) return false;
    const aRightGlobal = col * frameWidth + a.contentRight;
    const bLeftGlobal = (col + 1) * frameWidth + b.contentLeft;
    return aRightGlobal > bLeftGlobal;
}

export function analyzeSpriteSheetGrid(
    data: Uint8ClampedArray,
    imgW: number,
    imgH: number,
    opts: SpriteAutoFitOptions = {},
): SpriteAutoFitResult | null {
    if (imgW <= 0 || imgH <= 0) return null;
    const alphaThreshold = opts.alphaThreshold ?? 16;
    const gutterMin = opts.gutterMin ?? 2;
    const cellPadding = opts.cellPadding ?? 1;

    let cols = opts.cols ?? 0;
    let rows = opts.rows ?? 0;
    const frameCountHint = opts.frameCount ?? 0;

    if (frameCountHint && cols && !rows) rows = Math.max(1, Math.round(frameCountHint / cols));
    if (frameCountHint && rows && !cols) cols = Math.max(1, Math.round(frameCountHint / rows));

    const knownGrid = cols > 0 && rows > 0;

    if (!knownGrid) {
        const rowD = smoothDensity(rowDensity(data, imgW, imgH, alphaThreshold), 2);
        const rowValleys = findValleyCenters(rowD, Math.max(gutterMin, Math.floor(imgH * 0.02)));
        rows = rowValleys.length >= 1 ? rowValleys.length + 1 : 1;

        const rowSplits = pickSplitLines(rowValleys, rows, imgH);
        const rowBounds = boundariesFromSplits(imgH, rowSplits);
        const y0 = rowBounds[0] ?? 0;
        const y1 = rowBounds[1] ?? imgH;
        const colD = smoothDensity(columnDensity(data, imgW, y0, y1, alphaThreshold), 2);
        const colValleys = findValleyCenters(colD, gutterMin);
        cols = colValleys.length >= 1 ? colValleys.length + 1 : 1;
    }

    const frameCount = frameCountHint || cols * rows;

    let frameWidth: number;
    let frameHeight: number;

    if (knownGrid) {
        frameWidth = Math.floor(imgW / cols);
        frameHeight = Math.floor(imgH / rows);
    } else {
        const rowD = smoothDensity(rowDensity(data, imgW, imgH, alphaThreshold), 2);
        const rowValleys = findValleyCenters(rowD, Math.max(gutterMin, Math.floor(imgH * 0.02)));
        const rowSplits = pickSplitLines(rowValleys, rows, imgH);
        const rowBounds = boundariesFromSplits(imgH, rowSplits);

        const colWidthsPerRow: number[] = [];
        for (let r = 0; r < rowBounds.length - 1; r++) {
            const y0 = rowBounds[r];
            const y1 = rowBounds[r + 1];
            const colD = smoothDensity(columnDensity(data, imgW, y0, y1, alphaThreshold), 2);
            const colValleys = findValleyCenters(colD, gutterMin);
            const rowCols = cols || (colValleys.length >= 1 ? colValleys.length + 1 : 1);
            if (!cols) cols = rowCols;
            const colSplits = pickSplitLines(colValleys, rowCols, imgW);
            const colBounds = boundariesFromSplits(imgW, colSplits);
            for (let c = 0; c < colBounds.length - 1; c++) {
                colWidthsPerRow.push(colBounds[c + 1] - colBounds[c]);
            }
        }
        const uniformFw = cols > 0 ? Math.floor(imgW / cols) : imgW;
        const uniformFh = rows > 0 ? Math.floor(imgH / rows) : imgH;
        const gutterFw = colWidthsPerRow.length ? median(colWidthsPerRow) : uniformFw;
        const rowHeights: number[] = [];
        for (let r = 0; r < rows; r++) rowHeights.push(uniformFh);
        const gutterFh = rowHeights.length ? median(rowHeights) : uniformFh;
        frameWidth = Math.max(1, Math.min(uniformFw, gutterFw));
        frameHeight = Math.max(1, Math.min(uniformFh, gutterFh));
    }

    frameWidth = Math.max(1, frameWidth);
    frameHeight = Math.max(1, frameHeight);

    const cells: SpriteCellAnalysis[] = [];
    const overflowFrames: number[] = [];

    for (let i = 0; i < frameCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x0 = col * frameWidth;
        const y0 = row * frameHeight;
        if (x0 + frameWidth > imgW || y0 + frameHeight > imgH) continue;

        const bbox = cellContentBBox(data, imgW, x0, y0, frameWidth, frameHeight, alphaThreshold);

        const overflowLeft = false;
        const overflowRight = false;
        const overflowTop = !bbox.empty && bbox.top < cellPadding;
        const overflowBottom = !bbox.empty && bbox.bottom >= frameHeight - cellPadding;

        const cell: SpriteCellAnalysis = {
            frame: i,
            row,
            col,
            contentLeft: bbox.left,
            contentTop: bbox.top,
            contentRight: bbox.right,
            contentBottom: bbox.bottom,
            hasContent: !bbox.empty,
            overflowLeft,
            overflowRight,
            overflowTop,
            overflowBottom,
        };
        cells.push(cell);
    }

    for (let row = 0; row < rows; row++) {
        const rowCells = cells.filter((c) => c.row === row);
        for (let col = 0; col < cols - 1; col++) {
            if (rowCellsContentOverlap(rowCells, col, frameWidth)) {
                const rightFrame = row * cols + col;
                const leftFrame = row * cols + col + 1;
                if (!overflowFrames.includes(rightFrame)) overflowFrames.push(rightFrame);
                if (!overflowFrames.includes(leftFrame)) overflowFrames.push(leftFrame);
                const a = rowCells.find((c) => c.col === col);
                const b = rowCells.find((c) => c.col === col + 1);
                if (a) a.overflowRight = true;
                if (b) b.overflowLeft = true;
            }
        }
    }

    for (const c of cells) {
        if (c.overflowLeft || c.overflowRight) {
            if (!overflowFrames.includes(c.frame)) overflowFrames.push(c.frame);
        }
    }

    let confidence = 0.9;
    if (overflowFrames.length) {
        confidence = Math.max(0.25, 0.9 - (overflowFrames.length / Math.max(frameCount, 1)) * 0.55);
    }
    if (Math.abs(frameWidth * cols - imgW) > cols) confidence -= 0.08;
    if (Math.abs(frameHeight * rows - imgH) > rows) confidence -= 0.08;
    confidence = Math.max(0, Math.min(1, confidence));

    const summary = overflowFrames.length
        ? `${frameWidth}×${frameHeight} · ${cols}×${rows} = ${frameCount} เฟรม · ⚠ เฟรม ${overflowFrames.join(', ')} ล้น/แตะเพื่อนในแถว`
        : `${frameWidth}×${frameHeight} · ${cols}×${rows} = ${frameCount} เฟรม · พอดีทุกเซลล์`;

    return {
        frameWidth,
        frameHeight,
        cols,
        rows,
        frameCount,
        confidence,
        overflowFrames,
        cells,
        summary,
    };
}

export function analyzeSpriteSheetFromImageData(
    imageData: ImageData,
    opts?: SpriteAutoFitOptions,
): SpriteAutoFitResult | null {
    return analyzeSpriteSheetGrid(imageData.data, imageData.width, imageData.height, opts);
}

export async function analyzeSpriteSheetFromUrl(
    url: string,
    opts?: SpriteAutoFitOptions,
): Promise<SpriteAutoFitResult | null> {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return analyzeSpriteSheetFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height), opts);
}

export async function analyzeSpriteSheetFromFile(
    file: File,
    opts?: SpriteAutoFitOptions,
): Promise<SpriteAutoFitResult | null> {
    const url = URL.createObjectURL(file);
    try {
        return await analyzeSpriteSheetFromUrl(url, opts);
    } finally {
        URL.revokeObjectURL(url);
    }
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/** ใช้แทน suggestFrameSizeFromImage เมื่อต้องการ content-aware */
export function autoFitToLegacySuggest(result: SpriteAutoFitResult): {
    frameWidth: number;
    frameHeight: number;
    cols: number;
    rows: number;
    frameCount: number;
} {
    return {
        frameWidth: result.frameWidth,
        frameHeight: result.frameHeight,
        cols: result.cols,
        rows: result.rows,
        frameCount: result.frameCount,
    };
}
