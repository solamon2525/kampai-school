#!/usr/bin/env node
/**
 * Image → 3D via Hugging Face TripoSR Space (Gradio API)
 * Outputs GLB + OBJ, then converts OBJ → STL for 3D printing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client, handle_file } from "@gradio/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function argValue(name, fallback) {
  const eq = process.argv.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("-")) {
    return process.argv[i + 1];
  }
  return fallback;
}

async function download(fileData, dest) {
  const url = fileData?.url;
  if (!url) throw new Error("No download URL for " + dest);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return { dest, bytes: buf.length };
}

function objToStl(objText, stlPath) {
  const verts = [];
  const faces = [];
  for (const line of objText.split(/\r?\n/)) {
    if (line.startsWith("v ")) {
      const [, x, y, z] = line.trim().split(/\s+/);
      verts.push([+x, +y, +z]);
    } else if (line.startsWith("f ")) {
      const parts = line.trim().split(/\s+/).slice(1);
      const idx = parts.map((p) => {
        const i = parseInt(p.split("/")[0], 10);
        return i < 0 ? verts.length + i : i - 1;
      });
      for (let i = 1; i + 1 < idx.length; i++) {
        faces.push([idx[0], idx[i], idx[i + 1]]);
      }
    }
  }
  if (!faces.length) throw new Error("No faces in OBJ");

  const buf = Buffer.alloc(84 + faces.length * 50);
  buf.write("TripoSR image-to-3D", 0, "ascii");
  buf.writeUInt32LE(faces.length, 80);
  let o = 84;
  for (const [ia, ib, ic] of faces) {
    const a = verts[ia];
    const b = verts[ib];
    const c = verts[ic];
    const ux = b[0] - a[0],
      uy = b[1] - a[1],
      uz = b[2] - a[2];
    const vx = c[0] - a[0],
      vy = c[1] - a[1],
      vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    buf.writeFloatLE(nx, o);
    buf.writeFloatLE(ny, o + 4);
    buf.writeFloatLE(nz, o + 8);
    o += 12;
    for (const p of [a, b, c]) {
      buf.writeFloatLE(p[0], o);
      buf.writeFloatLE(p[1], o + 4);
      buf.writeFloatLE(p[2], o + 8);
      o += 12;
    }
    buf.writeUInt16LE(0, o);
    o += 2;
  }
  fs.writeFileSync(stlPath, buf.subarray(0, o));
  return { faces: faces.length, verts: verts.length, bytes: o };
}

async function main() {
  const inputPath = path.resolve(
    process.argv[2] || path.join(root, "exports/3d-print/staff-duo-nobg.png"),
  );
  const outDir = path.resolve(
    process.argv[3] || path.join(root, "exports/3d-print/staff-duo-image-to-3d"),
  );

  // Default: keep bg if PNG already has alpha (we pre-removed black)
  const REMOVE_BG = process.argv.includes("--remove-bg");
  const FG_RATIO = Number(argValue("--fg", "0.9"));
  const MC_RES = Number(argValue("--res", "256"));

  if (!fs.existsSync(inputPath)) {
    console.error("Input not found:", inputPath);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  console.log(
    JSON.stringify({ inputPath, outDir, REMOVE_BG, FG_RATIO, MC_RES }, null, 2),
  );

  console.log("Connecting to stabilityai/TripoSR ...");
  const client = await Client.connect("stabilityai/TripoSR", {
    events: ["status", "data"],
  });

  const image = handle_file(inputPath);

  console.log("1/3 check_input_image ...");
  await client.predict("/check_input_image", [image]);
  console.log("check ok");

  console.log("2/3 preprocess (remove_bg=%s, fg=%s) ...", REMOVE_BG, FG_RATIO);
  const pre = await client.predict("/preprocess", [image, REMOVE_BG, FG_RATIO]);
  const processed = Array.isArray(pre.data) ? pre.data[0] : pre.data;
  console.log("processed:", processed?.url || processed?.path || processed);

  // Save processed preview if available
  if (processed?.url) {
    try {
      await download(processed, path.join(outDir, "processed.png"));
    } catch (e) {
      console.warn("Could not save processed preview:", e.message);
    }
  }

  console.log("3/3 generate (mc_res=%s) — may take several minutes ...", MC_RES);
  const gen = await client.predict("/generate", [processed, MC_RES]);
  const [objFile, glbFile] = gen.data;
  console.log("OBJ:", objFile?.url || objFile);
  console.log("GLB:", glbFile?.url || glbFile);

  const objPath = path.join(outDir, "model.obj");
  const glbPath = path.join(outDir, "model.glb");
  const objInfo = await download(objFile, objPath);
  const glbInfo = await download(glbFile, glbPath);
  console.log("Saved", objInfo, glbInfo);

  const stlPath = path.join(outDir, "model.stl");
  const stlInfo = objToStl(fs.readFileSync(objPath, "utf8"), stlPath);
  console.log(
    JSON.stringify(
      {
        ok: true,
        outDir,
        files: { glb: glbPath, obj: objPath, stl: stlPath },
        stl: stlInfo,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("FAILED:", err?.message || err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
