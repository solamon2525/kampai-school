import PptxGenJS from "pptxgenjs";
import { createRequire } from "module";
import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import os from "os";

const skillDir = "C:/Users/Administrator/AppData/Roaming/Claude/local-agent-mode-sessions/skills-plugin/4c45c0be-6487-49ab-9d76-b5594e7156e2/dcefb09a-0935-4e2e-bf75-031e22325c48/skills/pptx";
const req = createRequire(skillDir + "/dummy.js");
const JSZip = req("jszip");

const numbers = [
  { n:1,   en:"One",           th:"วัน" },
  { n:2,   en:"Two",           th:"ทู" },
  { n:3,   en:"Three",         th:"ธรี" },
  { n:4,   en:"Four",          th:"โฟร์" },
  { n:5,   en:"Five",          th:"ไฟว์" },
  { n:6,   en:"Six",           th:"ซิกซ์" },
  { n:7,   en:"Seven",         th:"เซเว่น" },
  { n:8,   en:"Eight",         th:"เอท" },
  { n:9,   en:"Nine",          th:"ไนน์" },
  { n:10,  en:"Ten",           th:"เทน" },
  { n:11,  en:"Eleven",        th:"อิ-เลฟ-เวน" },
  { n:12,  en:"Twelve",        th:"ทเวลฟ์" },
  { n:13,  en:"Thirteen",      th:"เธอร์-ทีน" },
  { n:14,  en:"Fourteen",      th:"โฟร์-ทีน" },
  { n:15,  en:"Fifteen",       th:"ฟิฟ-ทีน" },
  { n:16,  en:"Sixteen",       th:"ซิกซ์-ทีน" },
  { n:17,  en:"Seventeen",     th:"เซเว่น-ทีน" },
  { n:18,  en:"Eighteen",      th:"เอท-ทีน" },
  { n:19,  en:"Nineteen",      th:"ไนน์-ทีน" },
  { n:20,  en:"Twenty",        th:"ทเวน-ตี้" },
  { n:21,  en:"Twenty-one",    th:"ทเวน-ตี้-วัน" },
  { n:22,  en:"Twenty-two",    th:"ทเวน-ตี้-ทู" },
  { n:23,  en:"Twenty-three",  th:"ทเวน-ตี้-ธรี" },
  { n:24,  en:"Twenty-four",   th:"ทเวน-ตี้-โฟร์" },
  { n:25,  en:"Twenty-five",   th:"ทเวน-ตี้-ไฟว์" },
  { n:26,  en:"Twenty-six",    th:"ทเวน-ตี้-ซิกซ์" },
  { n:27,  en:"Twenty-seven",  th:"ทเวน-ตี้-เซเว่น" },
  { n:28,  en:"Twenty-eight",  th:"ทเวน-ตี้-เอท" },
  { n:29,  en:"Twenty-nine",   th:"ทเวน-ตี้-ไนน์" },
  { n:30,  en:"Thirty",        th:"เธอร์-ตี้" },
  { n:31,  en:"Thirty-one",    th:"เธอร์-ตี้-วัน" },
  { n:32,  en:"Thirty-two",    th:"เธอร์-ตี้-ทู" },
  { n:33,  en:"Thirty-three",  th:"เธอร์-ตี้-ธรี" },
  { n:34,  en:"Thirty-four",   th:"เธอร์-ตี้-โฟร์" },
  { n:35,  en:"Thirty-five",   th:"เธอร์-ตี้-ไฟว์" },
  { n:36,  en:"Thirty-six",    th:"เธอร์-ตี้-ซิกซ์" },
  { n:37,  en:"Thirty-seven",  th:"เธอร์-ตี้-เซเว่น" },
  { n:38,  en:"Thirty-eight",  th:"เธอร์-ตี้-เอท" },
  { n:39,  en:"Thirty-nine",   th:"เธอร์-ตี้-ไนน์" },
  { n:40,  en:"Forty",         th:"ฟอร์-ตี้" },
  { n:41,  en:"Forty-one",     th:"ฟอร์-ตี้-วัน" },
  { n:42,  en:"Forty-two",     th:"ฟอร์-ตี้-ทู" },
  { n:43,  en:"Forty-three",   th:"ฟอร์-ตี้-ธรี" },
  { n:44,  en:"Forty-four",    th:"ฟอร์-ตี้-โฟร์" },
  { n:45,  en:"Forty-five",    th:"ฟอร์-ตี้-ไฟว์" },
  { n:46,  en:"Forty-six",     th:"ฟอร์-ตี้-ซิกซ์" },
  { n:47,  en:"Forty-seven",   th:"ฟอร์-ตี้-เซเว่น" },
  { n:48,  en:"Forty-eight",   th:"ฟอร์-ตี้-เอท" },
  { n:49,  en:"Forty-nine",    th:"ฟอร์-ตี้-ไนน์" },
  { n:50,  en:"Fifty",         th:"ฟิฟ-ตี้" },
  { n:51,  en:"Fifty-one",     th:"ฟิฟ-ตี้-วัน" },
  { n:52,  en:"Fifty-two",     th:"ฟิฟ-ตี้-ทู" },
  { n:53,  en:"Fifty-three",   th:"ฟิฟ-ตี้-ธรี" },
  { n:54,  en:"Fifty-four",    th:"ฟิฟ-ตี้-โฟร์" },
  { n:55,  en:"Fifty-five",    th:"ฟิฟ-ตี้-ไฟว์" },
  { n:56,  en:"Fifty-six",     th:"ฟิฟ-ตี้-ซิกซ์" },
  { n:57,  en:"Fifty-seven",   th:"ฟิฟ-ตี้-เซเว่น" },
  { n:58,  en:"Fifty-eight",   th:"ฟิฟ-ตี้-เอท" },
  { n:59,  en:"Fifty-nine",    th:"ฟิฟ-ตี้-ไนน์" },
  { n:60,  en:"Sixty",         th:"ซิกซ์-ตี้" },
  { n:61,  en:"Sixty-one",     th:"ซิกซ์-ตี้-วัน" },
  { n:62,  en:"Sixty-two",     th:"ซิกซ์-ตี้-ทู" },
  { n:63,  en:"Sixty-three",   th:"ซิกซ์-ตี้-ธรี" },
  { n:64,  en:"Sixty-four",    th:"ซิกซ์-ตี้-โฟร์" },
  { n:65,  en:"Sixty-five",    th:"ซิกซ์-ตี้-ไฟว์" },
  { n:66,  en:"Sixty-six",     th:"ซิกซ์-ตี้-ซิกซ์" },
  { n:67,  en:"Sixty-seven",   th:"ซิกซ์-ตี้-เซเว่น" },
  { n:68,  en:"Sixty-eight",   th:"ซิกซ์-ตี้-เอท" },
  { n:69,  en:"Sixty-nine",    th:"ซิกซ์-ตี้-ไนน์" },
  { n:70,  en:"Seventy",       th:"เซเว่น-ตี้" },
  { n:71,  en:"Seventy-one",   th:"เซเว่น-ตี้-วัน" },
  { n:72,  en:"Seventy-two",   th:"เซเว่น-ตี้-ทู" },
  { n:73,  en:"Seventy-three", th:"เซเว่น-ตี้-ธรี" },
  { n:74,  en:"Seventy-four",  th:"เซเว่น-ตี้-โฟร์" },
  { n:75,  en:"Seventy-five",  th:"เซเว่น-ตี้-ไฟว์" },
  { n:76,  en:"Seventy-six",   th:"เซเว่น-ตี้-ซิกซ์" },
  { n:77,  en:"Seventy-seven", th:"เซเว่น-ตี้-เซเว่น" },
  { n:78,  en:"Seventy-eight", th:"เซเว่น-ตี้-เอท" },
  { n:79,  en:"Seventy-nine",  th:"เซเว่น-ตี้-ไนน์" },
  { n:80,  en:"Eighty",        th:"เอท-ตี้" },
  { n:81,  en:"Eighty-one",    th:"เอท-ตี้-วัน" },
  { n:82,  en:"Eighty-two",    th:"เอท-ตี้-ทู" },
  { n:83,  en:"Eighty-three",  th:"เอท-ตี้-ธรี" },
  { n:84,  en:"Eighty-four",   th:"เอท-ตี้-โฟร์" },
  { n:85,  en:"Eighty-five",   th:"เอท-ตี้-ไฟว์" },
  { n:86,  en:"Eighty-six",    th:"เอท-ตี้-ซิกซ์" },
  { n:87,  en:"Eighty-seven",  th:"เอท-ตี้-เซเว่น" },
  { n:88,  en:"Eighty-eight",  th:"เอท-ตี้-เอท" },
  { n:89,  en:"Eighty-nine",   th:"เอท-ตี้-ไนน์" },
  { n:90,  en:"Ninety",        th:"ไนน์-ตี้" },
  { n:91,  en:"Ninety-one",    th:"ไนน์-ตี้-วัน" },
  { n:92,  en:"Ninety-two",    th:"ไนน์-ตี้-ทู" },
  { n:93,  en:"Ninety-three",  th:"ไนน์-ตี้-ธรี" },
  { n:94,  en:"Ninety-four",   th:"ไนน์-ตี้-โฟร์" },
  { n:95,  en:"Ninety-five",   th:"ไนน์-ตี้-ไฟว์" },
  { n:96,  en:"Ninety-six",    th:"ไนน์-ตี้-ซิกซ์" },
  { n:97,  en:"Ninety-seven",  th:"ไนน์-ตี้-เซเว่น" },
  { n:98,  en:"Ninety-eight",  th:"ไนน์-ตี้-เอท" },
  { n:99,  en:"Ninety-nine",   th:"ไนน์-ตี้-ไนน์" },
  { n:100, en:"One Hundred",   th:"วัน-ฮัน-เดรด" },
];

// ============================================================
// STEP 1: Generate PPTX (visual only)
// ============================================================
const numberFontSize = (n) => n < 100 ? 480 : 350;

const pres = new PptxGenJS();
pres.layout = "LAYOUT_4x3";

for (const { n, en, th } of numbers) {
  const slide = pres.addSlide();
  slide.background = { color: "1565C0" };
  slide.addText(String(n), {
    x: 0, y: 0.1, w: 10, h: 5.3,
    fontSize: numberFontSize(n), fontFace: "TH Sarabun New",
    color: "FFFFFF", bold: true, align: "center", valign: "middle",
  });
  slide.addText(en, {
    x: 0.1, y: 5.5, w: 9.8, h: 0.95,
    fontSize: 100, fontFace: "TH Sarabun New",
    color: "FFE082", bold: true, align: "center", valign: "middle",
  });
  slide.addText(th, {
    x: 0.1, y: 6.55, w: 9.8, h: 0.8,
    fontSize: 40, fontFace: "TH Sarabun New",
    color: "E3F2FD", align: "center", valign: "middle",
  });
}

const tmpFile = "numbers-tmp.pptx";
await pres.writeFile({ fileName: tmpFile });
console.log("Step 1: PPTX generated");

// ============================================================
// STEP 2: Generate WAV files via Windows SAPI (PowerShell)
// ============================================================
const audioDir = path.join(os.tmpdir(), "pptx-audio");
const wordsJson = JSON.stringify(numbers.map(r => r.en));

const psScript = `
$outDir = "${audioDir.replace(/\\/g, "\\\\")}"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft David Desktop")
$synth.Rate = -1
$words = '${wordsJson.replace(/'/g, "''")}' | ConvertFrom-Json
for ($i = 0; $i -lt $words.Count; $i++) {
    $n = $i + 1
    $outFile = "$outDir\\audio_$n.wav"
    $synth.SetOutputToWaveFile($outFile)
    $synth.Speak($words[$i])
}
$synth.SetOutputToNull()
Write-Host "Done: $($words.Count) WAV files in $outDir"
`;

const psPath = path.join(os.tmpdir(), "gen-tts.ps1");
fs.writeFileSync(psPath, psScript, "utf8");
execSync(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, { stdio: "inherit" });
console.log("Step 2: WAV files generated");

// ============================================================
// STEP 3: Post-process PPTX — embed WAV + auto-play on entry
// ============================================================
const raw = fs.readFileSync(tmpFile);
const zip = await JSZip.loadAsync(raw);

// 3a. Add wav content type if not present
let ct = await zip.file("[Content_Types].xml").async("string");
if (!ct.includes('Extension="wav"')) {
  ct = ct.replace("</Types>", '<Default Extension="wav" ContentType="audio/wav"/></Types>');
  zip.file("[Content_Types].xml", ct);
}

// 3b. For each slide: embed WAV, patch rels, patch transition
for (let i = 1; i <= numbers.length; i++) {
  const wavPath = path.join(audioDir, `audio_${i}.wav`);
  const wavData = fs.readFileSync(wavPath);
  const mediaName = `audio${i}.wav`;

  // Add WAV to ppt/media/
  zip.file(`ppt/media/${mediaName}`, wavData);

  // Patch _rels: add rId3 → audio
  const relsPath = `ppt/slides/_rels/slide${i}.xml.rels`;
  let rels = await zip.file(relsPath).async("string");
  const audioRel = `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/audio" Target="../media/${mediaName}"/>`;
  rels = rels.replace("</Relationships>", audioRel + "</Relationships>");
  zip.file(relsPath, rels);

  // Patch slide: inject <p:transition advTm> + <p:sndAc> (audio plays on slide entry)
  // PptxGenJS does NOT generate <p:transition> — inject before </p:sld>
  const slidePath = `ppt/slides/slide${i}.xml`;
  let xml = await zip.file(slidePath).async("string");
  const transition = '<p:transition advTm="2000"><p:sndAc><p:stSnd><p:snd r:embed="rId3" loop="0"/></p:stSnd></p:sndAc></p:transition>';
  if (xml.includes("<p:transition")) {
    xml = xml.replace(/<p:transition[^>]*\/>/, transition);
  } else {
    xml = xml.replace("</p:sld>", transition + "</p:sld>");
  }
  zip.file(slidePath, xml);
}

// 3c. Write final PPTX
const outBuf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
const outFile = "numbers-1-100.pptx";
fs.writeFileSync(outFile, outBuf);
fs.unlinkSync(tmpFile);

const sizeMB = (fs.statSync(outFile).size / 1024 / 1024).toFixed(1);
console.log(`Done! ${outFile} (${sizeMB} MB) — 100 slides, audio + auto-advance 2s`);
