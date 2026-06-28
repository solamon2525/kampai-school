/**
 * Node.js — ตัดพื้นหลัง sprite (sharp + scripts)
 */

export function isWhiteish(r, g, b, tolerance) {
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    return min >= 255 - tolerance - 40 && max - min <= tolerance;
}

function colorDist(r, g, b, tr, tg, tb) {
    return Math.max(Math.abs(r - tr), Math.abs(g - tg), Math.abs(b - tb));
}

export function sampleCornerBg(px, w, h) {
    const pts = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
    let sr = 0, sg = 0, sb = 0, n = 0;
    const sampleR = Math.min(12, Math.floor(w / 8), Math.floor(h / 8));
    for (const [cx, cy] of pts) {
        for (let dy = 0; dy < sampleR; dy++) {
            for (let dx = 0; dx < sampleR; dx++) {
                const x = cx === 0 ? dx : cx - dx;
                const y = cy === 0 ? dy : cy - dy;
                if (x < 0 || x >= w || y < 0 || y >= h) continue;
                const o = (y * w + x) * 4;
                sr += px[o]; sg += px[o + 1]; sb += px[o + 2];
                n++;
            }
        }
    }
    if (!n) return [255, 255, 255];
    return [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)];
}

export function removeBackgroundFromRgba(rgba, w, h, opts = {}) {
    const px = Buffer.from(rgba);
    const tol = opts.tolerance ?? 32;
    const mode = opts.mode ?? 'auto';
    const [tr, tg, tb] = sampleCornerBg(px, w, h);

    let isBg;
    if (mode === 'white') {
        isBg = (r, g, b) => isWhiteish(r, g, b, tol);
    } else if (mode === 'corner') {
        isBg = (r, g, b) => colorDist(r, g, b, tr, tg, tb) <= tol;
    } else {
        isBg = (r, g, b) => colorDist(r, g, b, tr, tg, tb) <= tol || isWhiteish(r, g, b, tol);
    }

    const vis = new Uint8Array(w * h);
    const q = [];

    function trySeed(x, y) {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const i = y * w + x;
        if (vis[i]) return;
        const o = i * 4;
        if (!isBg(px[o], px[o + 1], px[o + 2])) return;
        vis[i] = 1;
        q.push(i);
    }

    for (let x = 0; x < w; x++) { trySeed(x, 0); trySeed(x, h - 1); }
    for (let y = 0; y < h; y++) { trySeed(0, y); trySeed(w - 1, y); }

    while (q.length) {
        const i = q.pop();
        const x = i % w;
        const y = (i / w) | 0;
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const ni = ny * w + nx;
            if (vis[ni]) continue;
            const o = ni * 4;
            if (!isBg(px[o], px[o + 1], px[o + 2])) continue;
            vis[ni] = 1;
            q.push(ni);
        }
    }

    for (let i = 0; i < w * h; i++) {
        if (vis[i]) px[i * 4 + 3] = 0;
    }
    return px;
}
