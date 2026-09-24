import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = "D:/kampai-school-main/output/infographics";
const outDir = "D:/kampai-school-main/output/canva/assets-small";
const outFile = "D:/kampai-school-main/output/canva/kampai-school-infographics-embedded-small.html";

const labels = [
  "ภาพรวมระบบเว็บโรงเรียน",
  "เว็บไซต์ประชาสัมพันธ์โรงเรียน",
  "Admin Dashboard",
  "Teacher and Parent Portal",
  "คลังสื่อและเกมการศึกษา",
  "ข้อมูล เอกสาร และความปลอดภัย",
];

await fs.mkdir(outDir, { recursive: true });
const files = (await fs.readdir(sourceDir))
  .filter((name) => name.endsWith(".png"))
  .sort();

const pages = [];

for (const [index, file] of files.entries()) {
  const inputPath = path.join(sourceDir, file);
  const outputName = file.replace(/\.png$/i, ".jpg");
  const outputPath = path.join(outDir, outputName);

  await sharp(inputPath)
    .resize(1280, 720, { fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outputPath);

  const image = await fs.readFile(outputPath);
  const base64 = image.toString("base64");
  const label = labels[index] ?? `Slide ${index + 1}`;
  pages.push(
    `<section class="slide" data-document-role="page" data-label="${label}"><img src="data:image/jpeg;base64,${base64}" alt="${label}"></section>`
  );
}

const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ระบบเว็บโรงเรียนครบวงจร โรงเรียนบ้านคำไผ่</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#eef7ff}
.slide{width:1600px;height:900px;overflow:hidden;background:#fff;position:relative}
.slide img{width:100%;height:100%;object-fit:cover;display:block}
</style>
</head>
<body>
${pages.join("\n")}
</body>
</html>
`;

await fs.writeFile(outFile, html, "utf8");
const stat = await fs.stat(outFile);
console.log(JSON.stringify({ outFile, bytes: stat.size }, null, 2));
