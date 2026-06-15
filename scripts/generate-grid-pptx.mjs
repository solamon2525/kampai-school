import PptxGenJS from "pptxgenjs";
import { createRequire } from "module";
import fs from "fs";

const skillDir = "C:/Users/Administrator/AppData/Roaming/Claude/local-agent-mode-sessions/skills-plugin/4c45c0be-6487-49ab-9d76-b5594e7156e2/dcefb09a-0935-4e2e-bf75-031e22325c48/skills/pptx";
const req = createRequire(skillDir + "/dummy.js");
const JSZip = req("jszip");

const numbers = [
  { n:1,   en:"One" },          { n:2,   en:"Two" },
  { n:3,   en:"Three" },        { n:4,   en:"Four" },
  { n:5,   en:"Five" },         { n:6,   en:"Six" },
  { n:7,   en:"Seven" },        { n:8,   en:"Eight" },
  { n:9,   en:"Nine" },         { n:10,  en:"Ten" },
  { n:11,  en:"Eleven" },       { n:12,  en:"Twelve" },
  { n:13,  en:"Thirteen" },     { n:14,  en:"Fourteen" },
  { n:15,  en:"Fifteen" },      { n:16,  en:"Sixteen" },
  { n:17,  en:"Seventeen" },    { n:18,  en:"Eighteen" },
  { n:19,  en:"Nineteen" },     { n:20,  en:"Twenty" },
  { n:21,  en:"Twenty-one" },   { n:22,  en:"Twenty-two" },
  { n:23,  en:"Twenty-three" }, { n:24,  en:"Twenty-four" },
  { n:25,  en:"Twenty-five" },  { n:26,  en:"Twenty-six" },
  { n:27,  en:"Twenty-seven" }, { n:28,  en:"Twenty-eight" },
  { n:29,  en:"Twenty-nine" },  { n:30,  en:"Thirty" },
  { n:31,  en:"Thirty-one" },   { n:32,  en:"Thirty-two" },
  { n:33,  en:"Thirty-three" }, { n:34,  en:"Thirty-four" },
  { n:35,  en:"Thirty-five" },  { n:36,  en:"Thirty-six" },
  { n:37,  en:"Thirty-seven" }, { n:38,  en:"Thirty-eight" },
  { n:39,  en:"Thirty-nine" },  { n:40,  en:"Forty" },
  { n:41,  en:"Forty-one" },    { n:42,  en:"Forty-two" },
  { n:43,  en:"Forty-three" },  { n:44,  en:"Forty-four" },
  { n:45,  en:"Forty-five" },   { n:46,  en:"Forty-six" },
  { n:47,  en:"Forty-seven" },  { n:48,  en:"Forty-eight" },
  { n:49,  en:"Forty-nine" },   { n:50,  en:"Fifty" },
  { n:51,  en:"Fifty-one" },    { n:52,  en:"Fifty-two" },
  { n:53,  en:"Fifty-three" },  { n:54,  en:"Fifty-four" },
  { n:55,  en:"Fifty-five" },   { n:56,  en:"Fifty-six" },
  { n:57,  en:"Fifty-seven" },  { n:58,  en:"Fifty-eight" },
  { n:59,  en:"Fifty-nine" },   { n:60,  en:"Sixty" },
  { n:61,  en:"Sixty-one" },    { n:62,  en:"Sixty-two" },
  { n:63,  en:"Sixty-three" },  { n:64,  en:"Sixty-four" },
  { n:65,  en:"Sixty-five" },   { n:66,  en:"Sixty-six" },
  { n:67,  en:"Sixty-seven" },  { n:68,  en:"Sixty-eight" },
  { n:69,  en:"Sixty-nine" },   { n:70,  en:"Seventy" },
  { n:71,  en:"Seventy-one" },  { n:72,  en:"Seventy-two" },
  { n:73,  en:"Seventy-three"},  { n:74,  en:"Seventy-four" },
  { n:75,  en:"Seventy-five" }, { n:76,  en:"Seventy-six" },
  { n:77,  en:"Seventy-seven"}, { n:78,  en:"Seventy-eight" },
  { n:79,  en:"Seventy-nine" }, { n:80,  en:"Eighty" },
  { n:81,  en:"Eighty-one" },   { n:82,  en:"Eighty-two" },
  { n:83,  en:"Eighty-three" }, { n:84,  en:"Eighty-four" },
  { n:85,  en:"Eighty-five" },  { n:86,  en:"Eighty-six" },
  { n:87,  en:"Eighty-seven" }, { n:88,  en:"Eighty-eight" },
  { n:89,  en:"Eighty-nine" },  { n:90,  en:"Ninety" },
  { n:91,  en:"Ninety-one" },   { n:92,  en:"Ninety-two" },
  { n:93,  en:"Ninety-three" }, { n:94,  en:"Ninety-four" },
  { n:95,  en:"Ninety-five" },  { n:96,  en:"Ninety-six" },
  { n:97,  en:"Ninety-seven" }, { n:98,  en:"Ninety-eight" },
  { n:99,  en:"Ninety-nine" },  { n:100, en:"One Hundred" },
];

// ----------------------------------------------------------------
// Layout: 2 columns × 5 rows, 4:3 slide (10" × 7.5")
// Left col (cells 0-4) : x=0.10, rows y=0.10,1.52,2.94,4.36,5.78
// Right col (cells 5-9): x=5.10, same rows
// Cell size: 4.8" wide × 1.42" tall
// ----------------------------------------------------------------
const EMU = 914400;
const CELL_W = 4.8;
const CELL_H = 1.42;
const ROW_Y = [0.10, 1.52, 2.94, 4.36, 5.78];

const CELLS = [
  ...ROW_Y.map(y => ({ x: 0.10, y })),
  ...ROW_Y.map(y => ({ x: 5.10, y })),
];

// ----------------------------------------------------------------
// Highlight shape XML (yellow rect, id=101+i)
// All start visible; T=0 animation hides HL102-110 immediately.
// (hidden="1" conflicts with style.visibility animation → causes repair)
// ----------------------------------------------------------------
function hlXml(i) {
  const id = 101 + i;
  const { x, y } = CELLS[i];
  const ox = Math.round(x * EMU);
  const oy = Math.round(y * EMU);
  const cw = Math.round(CELL_W * EMU);
  const ch = Math.round(CELL_H * EMU);
  return (
    `<p:sp>` +
      `<p:nvSpPr>` +
        `<p:cNvPr id="${id}" name="HL${i}"/>` +
        `<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>` +
        `<p:nvPr/>` +
      `</p:nvSpPr>` +
      `<p:spPr>` +
        `<a:xfrm><a:off x="${ox}" y="${oy}"/><a:ext cx="${cw}" cy="${ch}"/></a:xfrm>` +
        `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
        `<a:solidFill><a:srgbClr val="FFD700"/></a:solidFill>` +
        `<a:ln w="25400"><a:solidFill><a:srgbClr val="FF8F00"/></a:solidFill></a:ln>` +
      `</p:spPr>` +
      `<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>` +
    `</p:sp>`
  );
}

// ----------------------------------------------------------------
// Cell border XML (id=201+i) — always-visible thin white outline
// Use solid white (no alpha modifier — causes repair in some PP versions)
// ----------------------------------------------------------------
function cellBorderXml(i) {
  const id = 201 + i;
  const { x, y } = CELLS[i];
  const ox = Math.round(x * EMU);
  const oy = Math.round(y * EMU);
  const cw = Math.round(CELL_W * EMU);
  const ch = Math.round(CELL_H * EMU);
  return (
    `<p:sp>` +
      `<p:nvSpPr>` +
        `<p:cNvPr id="${id}" name="CB${i}"/>` +
        `<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>` +
        `<p:nvPr/>` +
      `</p:nvSpPr>` +
      `<p:spPr>` +
        `<a:xfrm><a:off x="${ox}" y="${oy}"/><a:ext cx="${cw}" cy="${ch}"/></a:xfrm>` +
        `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
        `<a:noFill/>` +
        `<a:ln w="9525"><a:solidFill><a:srgbClr val="5B93D3"/></a:solidFill></a:ln>` +
      `</p:spPr>` +
      `<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>` +
    `</p:sp>`
  );
}

// ----------------------------------------------------------------
// Animation timing XML:
// T=0ms       : hide HL 102-110, show HL 101
// T=1500ms    : hide HL 101, show HL 102
// T=3000ms    : hide HL 102, show HL 103
// ...
// T=13500ms   : hide HL 109, show HL 110
// Slide advances at T=15000ms (transition advTm)
// ----------------------------------------------------------------
function timingXml() {
  let id = 3; // IDs 1-2 used by root cTn and main container

  const setVis = (spid, val) =>
    `<p:set>` +
      `<p:cBhvr>` +
        `<p:cTn id="${id++}" dur="1" fill="hold"/>` +
        `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
        `<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>` +
      `</p:cBhvr>` +
      `<p:to><p:strVal val="${val}"/></p:to>` +
    `</p:set>`;

  const step = (delay, sets) =>
    `<p:par>` +
      `<p:cTn id="${id++}" fill="hold">` +
        `<p:stCondLst><p:cond delay="${delay}"/></p:stCondLst>` +
        `<p:childTnLst>${sets}</p:childTnLst>` +
      `</p:cTn>` +
    `</p:par>`;

  let steps = '';

  // T=0: hide 102-110, show 101
  let init = '';
  for (let i = 1; i <= 9; i++) init += setVis(101 + i, 'hidden');
  init += setVis(101, 'visible');
  steps += step(0, init);

  // T=1500..13500: swap highlights
  for (let s = 1; s <= 9; s++) {
    steps += step(s * 1500, setVis(100 + s, 'hidden') + setVis(101 + s, 'visible'));
  }

  return (
    `<p:timing>` +
      `<p:tnLst>` +
        `<p:par>` +
          `<p:cTn id="1" dur="indefinite" restart="whenNotActive" nodeType="tmRoot">` +
            `<p:childTnLst>` +
              `<p:par>` +
                `<p:cTn id="2" dur="indefinite" fill="hold">` +
                  `<p:stCondLst><p:cond delay="0"/></p:stCondLst>` +
                  `<p:childTnLst>${steps}</p:childTnLst>` +
                `</p:cTn>` +
              `</p:par>` +
            `</p:childTnLst>` +
          `</p:cTn>` +
        `</p:par>` +
      `</p:tnLst>` +
      `<p:bldLst/>` +
    `</p:timing>`
  );
}

// ================================================================
// STEP 1: Build 10 slides with PptxGenJS
// ================================================================
const pres = new PptxGenJS();
pres.layout = "LAYOUT_4x3"; // 10" × 7.5"

for (let g = 0; g < 10; g++) {
  const group = numbers.slice(g * 10, (g + 1) * 10);
  const slide = pres.addSlide();
  slide.background = { color: "1565C0" };

  for (let i = 0; i < 10; i++) {
    const { n, en } = group[i];
    const cell = CELLS[i];

    // Number — upper part of cell, large, white
    slide.addText(String(n), {
      x: cell.x + 0.05, y: cell.y + 0.03,
      w: CELL_W - 0.10, h: 0.90,
      fontSize: 78, fontFace: "TH Sarabun New",
      color: "FFFFFF", bold: true, align: "center", valign: "middle",
    });

    // English word — lower part of cell, gold
    slide.addText(en, {
      x: cell.x + 0.05, y: cell.y + 0.96,
      w: CELL_W - 0.10, h: 0.44,
      fontSize: 26, fontFace: "TH Sarabun New",
      color: "FFE082", bold: true, align: "center", valign: "middle",
    });
  }
}

const tmpFile = "numbers-grid-tmp.pptx";
await pres.writeFile({ fileName: tmpFile });
console.log("Step 1: base PPTX done");

// ================================================================
// STEP 2: Post-process — inject HL shapes + animation + transition
// ================================================================
const raw = fs.readFileSync(tmpFile);
const zip = await JSZip.loadAsync(raw);

// Pre-build shape XML (same for every slide — same cell positions)
// z-order: HL (bottom) → cell borders → text shapes (top, from PptxGenJS)
const allHl = Array.from({ length: 10 }, (_, i) => hlXml(i)).join('');
const allBorders = Array.from({ length: 10 }, (_, i) => cellBorderXml(i)).join('');
// Animation XML is the same for every slide (HL ids 101-110 are reused)
const anim = timingXml();
const transition = '<p:transition advTm="15000"/>';

for (let s = 1; s <= 10; s++) {
  const slidePath = `ppt/slides/slide${s}.xml`;
  let xml = await zip.file(slidePath).async("string");

  // Inject: HL first (bottommost z), then borders above HL, then PptxGenJS text on top
  xml = xml.replace('</p:grpSpPr>', '</p:grpSpPr>' + allHl + allBorders);

  // Inject <p:transition> then <p:timing> before </p:sld>
  xml = xml.replace('</p:sld>', transition + anim + '</p:sld>');

  zip.file(slidePath, xml);
}

const outBuf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
const outFile = "numbers-grid-1-100.pptx";
fs.writeFileSync(outFile, outBuf);
fs.unlinkSync(tmpFile);

const kb = Math.round(fs.statSync(outFile).size / 1024);
console.log(`Done! ${outFile} (${kb} KB) — 10 slides, HL animates 1→10 every 1.5s, advances after 15s`);
