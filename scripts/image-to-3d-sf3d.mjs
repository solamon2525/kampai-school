#!/usr/bin/env node
/**
 * Image → 3D via Hugging Face Stable Fast 3D Space
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

async function main() {
  const inputPath = path.resolve(
    process.argv[2] || path.join(root, "exports/3d-print/staff-duo-nobg.png"),
  );
  const outDir = path.resolve(
    process.argv[3] || path.join(root, "exports/3d-print/staff-duo-image-to-3d"),
  );
  const FG = Number(argValue("--fg", "0.9"));
  const TEX = Number(argValue("--tex", "1024"));

  fs.mkdirSync(outDir, { recursive: true });
  console.log(JSON.stringify({ inputPath, outDir, FG, TEX }, null, 2));

  console.log("Connecting to stabilityai/stable-fast-3d ...");
  const client = await Client.connect("stabilityai/stable-fast-3d");
  const image = handle_file(inputPath);

  console.log("Running /run_button (may queue several minutes) ...");
  const result = await client.predict("/run_button", {
    input_image: image,
    foreground_ratio: FG,
    remesh_option: "None",
    vertex_count: -1,
    texture_size: TEX,
  });

  console.log("raw result keys:", Object.keys(result || {}));
  const data = result.data;
  console.log("data:", JSON.stringify(data, null, 2)?.slice(0, 2000));

  const preview = Array.isArray(data) ? data[0] : null;
  const model = Array.isArray(data) ? data[1] : data;

  if (preview?.url) {
    await download(preview, path.join(outDir, "sf3d-processed.png"));
  }
  if (!model?.url) throw new Error("No model URL in response");

  const glbPath = path.join(outDir, "model.glb");
  const info = await download(model, glbPath);
  console.log(JSON.stringify({ ok: true, glb: info }, null, 2));
}

main().catch((err) => {
  console.error("FAILED:", err?.message || err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
