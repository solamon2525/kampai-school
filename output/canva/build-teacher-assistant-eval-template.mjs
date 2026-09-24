import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = "D:/kampai-school-main";
const imageDir = `${root}/output/infographics`;
const outDir = `${root}/output/canva/teacher-assistant-eval`;
const htmlPath = `${outDir}/teacher-assistant-eval-3-template.html`;
const imageOutDir = `${outDir}/assets-small`;

await fs.mkdir(imageOutDir, { recursive: true });

const sourceImages = (await fs.readdir(imageDir))
  .filter((name) => name.endsWith(".png"))
  .sort();

const embeddedImages = [];
for (const file of sourceImages) {
  const inPath = path.join(imageDir, file);
  const outPath = path.join(imageOutDir, file.replace(/\.png$/i, ".jpg"));
  await sharp(inPath)
    .resize(1280, 720, { fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);
  const b64 = (await fs.readFile(outPath)).toString("base64");
  embeddedImages.push(`data:image/jpeg;base64,${b64}`);
}

const webSlides = [
  {
    title: "ระบบเว็บโรงเรียนครบวงจร",
    subtitle: "โรงเรียนบ้านคำไผ่",
    note: "แพลตฟอร์มดิจิทัลที่รวมเว็บไซต์ ระบบหลังบ้าน พอร์ทัลครู ผู้ปกครอง สื่อ เกม และข้อมูลโรงเรียนไว้ในระบบเดียว",
  },
  {
    title: "เว็บไซต์ประชาสัมพันธ์โรงเรียน",
    subtitle: "สื่อสารข่าวสาร กิจกรรม และข้อมูลสำคัญ",
    note: "ใช้เป็นหน้าบ้านของโรงเรียนสำหรับผู้ปกครอง ชุมชน และผู้สนใจ พร้อมรองรับการใช้งานบนมือถือ",
  },
  {
    title: "Admin Dashboard",
    subtitle: "ศูนย์ควบคุมระบบโรงเรียน",
    note: "จัดการข้อมูล ข่าวสาร นักเรียน บุคลากร สิทธิ์ผู้ใช้ ธีม เมนู เอกสาร และภาพรวมระบบ",
  },
  {
    title: "Teacher & Parent Portal",
    subtitle: "เชื่อมครู ผู้ปกครอง และนักเรียน",
    note: "ช่วยติดตามการมาเรียน คะแนน พฤติกรรม งานมอบหมาย การสื่อสาร และข้อมูลนักเรียนรายบุคคล",
  },
  {
    title: "คลังสื่อและเกมการศึกษา",
    subtitle: "เรียนรู้สนุก วัดผลได้",
    note: "รวบรวมสื่อและเกมตามกลุ่มสาระ พร้อมระบบคะแนน สถิติ และการนำไปใช้ประกอบการเรียนรู้",
  },
  {
    title: "ข้อมูล เอกสาร และความปลอดภัย",
    subtitle: "จัดการโรงเรียนอย่างเป็นระบบ",
    note: "รองรับงานเอกสาร ข้อมูลนักเรียน บุคลากร งบประมาณ สารบรรณ และสิทธิ์การเข้าถึงตามบทบาท",
  },
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function page(label, inner, extraClass = "") {
  return `<section class="slide ${extraClass}" data-document-role="page" data-label="${esc(label)}">${inner}</section>`;
}

function photoGrid(count = 3, label = "วางรูปหลักฐาน") {
  return `<div class="photo-grid photo-grid-${count}">
${Array.from({ length: count }, (_, i) => `<div class="photo-box"><span>${label} ${i + 1}</span></div>`).join("\n")}
</div>`;
}

function evidenceSlide(title, bullets, count = 3) {
  return page(
    title,
    `<div class="topbar"><span>ประเมินครูผู้ช่วย ครั้งที่ 3</span><strong>หลักฐานประกอบ</strong></div>
    <h2>${esc(title)}</h2>
    <div class="two-col">
      <div class="card soft">
        <h3>ประเด็นนำเสนอ</h3>
        <ul>${bullets.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
      <div>
        ${photoGrid(count)}
      </div>
    </div>`
  );
}

function divider(title, subtitle, chips = []) {
  return page(
    title,
    `<div class="divider-wrap">
      <p class="eyebrow">Portfolio Presentation</p>
      <h1>${esc(title)}</h1>
      <p class="subtitle">${esc(subtitle)}</p>
      <div class="chips">${chips.map((chip) => `<span>${esc(chip)}</span>`).join("")}</div>
    </div>`,
    "divider"
  );
}

const pages = [];

pages.push(
  page(
    "ปก",
    `<div class="cover-bg"></div>
    <div class="cover">
      <p class="eyebrow">การเตรียมความพร้อมและพัฒนาอย่างเข้ม</p>
      <h1>ประเมินครูผู้ช่วย<br>ครั้งที่ 3</h1>
      <p class="subtitle">ตำแหน่ง ครูผู้ช่วย · โรงเรียนบ้านคำไผ่</p>
      <div class="profile-row">
        <div class="avatar-placeholder">รูปผู้รับ<br>การประเมิน</div>
        <div>
          <h3>ชื่อ-สกุล: ........................................</h3>
          <p>กลุ่มสาระ/งานที่รับผิดชอบ: ........................................</p>
          <p>วันที่นำเสนอ: ........................................</p>
        </div>
      </div>
    </div>`,
    "cover-slide"
  )
);

pages.push(
  page(
    "สารบัญ",
    `<div class="topbar"><span>ประเมินครูผู้ช่วย ครั้งที่ 3</span><strong>Overview</strong></div>
    <h2>สารบัญการนำเสนอ</h2>
    <div class="agenda-grid">
      ${[
        ["01", "ข้อมูลผู้รับการประเมิน", "ประวัติ ภาระงาน และบริบทการปฏิบัติงาน"],
        ["02", "ด้านการปฏิบัติตน", "วินัย คุณธรรม จรรยาบรรณ และจิตวิญญาณครู"],
        ["03", "ด้านการปฏิบัติงาน", "การจัดการเรียนรู้ ชั้นเรียน ทีมงาน และเทคโนโลยี"],
        ["04", "ผลงานเด่น", "ระบบเว็บโรงเรียนครบวงจรและนวัตกรรมดิจิทัล"],
        ["05", "หลักฐานภาพถ่าย", "กิจกรรม ผลงาน เอกสาร และร่องรอยเชิงประจักษ์"],
        ["06", "สรุปผลการพัฒนา", "สิ่งที่เกิดกับผู้เรียน โรงเรียน และแผนต่อยอด"],
      ]
        .map(
          ([no, title, desc]) => `<div class="agenda-card"><b>${no}</b><h3>${title}</h3><p>${desc}</p></div>`
        )
        .join("")}
    </div>`
  )
);

pages.push(
  page(
    "ข้อมูลผู้รับการประเมิน",
    `<div class="topbar"><span>ประเมินครูผู้ช่วย ครั้งที่ 3</span><strong>Profile</strong></div>
    <h2>ข้อมูลผู้รับการประเมิน</h2>
    <div class="profile-layout">
      <div class="portrait-box">วางรูปครู</div>
      <div class="info-list">
        <div><span>ชื่อ-สกุล</span><strong>................................................</strong></div>
        <div><span>ตำแหน่ง</span><strong>ครูผู้ช่วย</strong></div>
        <div><span>โรงเรียน</span><strong>โรงเรียนบ้านคำไผ่</strong></div>
        <div><span>กลุ่มสาระ/ระดับชั้น</span><strong>................................................</strong></div>
        <div><span>งานพิเศษที่รับผิดชอบ</span><strong>................................................</strong></div>
      </div>
    </div>`
  )
);

pages.push(
  page(
    "ภาพรวมผลงาน",
    `<div class="topbar"><span>ประเมินครูผู้ช่วย ครั้งที่ 3</span><strong>Highlights</strong></div>
    <h2>ภาพรวมผลงานในรอบการประเมิน</h2>
    <div class="metrics">
      <div><strong>__</strong><span>กิจกรรมการเรียนรู้</span></div>
      <div><strong>__</strong><span>สื่อ/นวัตกรรม</span></div>
      <div><strong>__</strong><span>งานโรงเรียนที่ร่วมขับเคลื่อน</span></div>
      <div><strong>__</strong><span>หลักฐานเชิงประจักษ์</span></div>
    </div>
    <div class="summary-card">
      <h3>ข้อความสรุปสั้น</h3>
      <p>ในรอบการประเมินนี้ ผู้รับการประเมินได้พัฒนาการจัดการเรียนรู้ การใช้เทคโนโลยี การทำงานร่วมกับชุมชนวิชาชีพ และสนับสนุนงานของสถานศึกษาอย่างต่อเนื่อง</p>
    </div>`
  )
);

pages.push(divider("ด้านที่ 1 การปฏิบัติตน", "สะท้อนความเป็นครูผ่านวินัย คุณธรรม จรรยาบรรณ และความรับผิดชอบ", ["วินัย", "คุณธรรม", "จิตวิญญาณครู", "ความรับผิดชอบ"]));

pages.push(evidenceSlide("1. วินัยและการรักษาวินัย", ["การปฏิบัติตามระเบียบของสถานศึกษา", "การตรงต่อเวลาและรับผิดชอบต่อหน้าที่", "การเป็นแบบอย่างที่ดีแก่ผู้เรียน"], 3));
pages.push(evidenceSlide("2. คุณธรรม จริยธรรม", ["การประพฤติปฏิบัติตนด้วยความซื่อสัตย์", "การมีเมตตาและเอื้อเฟื้อต่อผู้เรียน", "การร่วมกิจกรรมส่งเสริมคุณธรรมของโรงเรียน"], 3));
pages.push(evidenceSlide("3. จรรยาบรรณวิชาชีพครู", ["การรักษาภาพลักษณ์และศักดิ์ศรีของวิชาชีพ", "การปฏิบัติต่อผู้เรียนอย่างเสมอภาค", "การพัฒนาตนเองตามมาตรฐานวิชาชีพ"], 3));
pages.push(evidenceSlide("4. จิตวิญญาณความเป็นครู", ["การดูแลช่วยเหลือนักเรียน", "การสร้างแรงบันดาลใจในการเรียนรู้", "การเสียสละและทำงานเพื่อผู้เรียน"], 3));
pages.push(evidenceSlide("5. ความรับผิดชอบในวิชาชีพ", ["การรับผิดชอบงานสอนและงานที่ได้รับมอบหมาย", "การสื่อสารกับผู้ปกครองและเพื่อนครู", "การรักษาคุณภาพงานอย่างต่อเนื่อง"], 3));

pages.push(divider("ด้านที่ 2 การปฏิบัติงาน", "นำเสนอผลการจัดการเรียนรู้ การบริหารชั้นเรียน การทำงานเป็นทีม และการใช้เทคโนโลยี", ["การเรียนรู้", "ชั้นเรียน", "PLC", "เทคโนโลยี"]));

pages.push(evidenceSlide("6. การจัดการเรียนรู้", ["แผนการจัดการเรียนรู้และกิจกรรม Active Learning", "การวัดและประเมินผลตามสภาพจริง", "การปรับกิจกรรมให้เหมาะกับผู้เรียน"], 4));
pages.push(evidenceSlide("7. การบริหารจัดการชั้นเรียน", ["บรรยากาศชั้นเรียนเชิงบวก", "ระบบดูแลช่วยเหลือนักเรียน", "การใช้ข้อมูลติดตามพฤติกรรมและผลการเรียน"], 4));
pages.push(evidenceSlide("8. การพัฒนาตนเองและวิชาชีพ", ["การอบรม/ศึกษาดูงาน/PLC", "การนำความรู้มาปรับใช้ในชั้นเรียน", "การสะท้อนผลและพัฒนางานอย่างต่อเนื่อง"], 4));
pages.push(evidenceSlide("9. การทำงานเป็นทีมและงานสถานศึกษา", ["การร่วมงานกับฝ่ายต่าง ๆ ของโรงเรียน", "การสนับสนุนกิจกรรมและโครงการของสถานศึกษา", "การประสานงานกับชุมชนและผู้ปกครอง"], 4));
pages.push(evidenceSlide("10. การใช้สื่อ เทคโนโลยี และนวัตกรรม", ["การใช้เทคโนโลยีสนับสนุนการเรียนรู้", "การสร้างสื่อหรือระบบดิจิทัลเพื่อโรงเรียน", "การใช้ข้อมูลช่วยติดตามผลผู้เรียน"], 4));

pages.push(divider("ผลงานเด่น: ระบบเว็บโรงเรียนครบวงจร", "หนึ่งในผลงานด้านเทคโนโลยีที่ช่วยสนับสนุนการบริหารจัดการ การเรียนรู้ และการสื่อสารของโรงเรียน", ["Website", "Portal", "Game Hub", "Data"]));

pages.push(
  page(
    "ภาพรวมระบบเว็บโรงเรียน",
    `<div class="topbar"><span>ผลงานเด่นด้านเทคโนโลยี</span><strong>Digital Platform</strong></div>
    <h2>6 จุดเด่นของระบบเว็บโรงเรียน</h2>
    <div class="thumb-grid">
      ${embeddedImages
        .map((src, i) => `<div><img src="${src}" alt="${esc(webSlides[i].title)}"><span>${esc(webSlides[i].title)}</span></div>`)
        .join("")}
    </div>`
  )
);

for (let i = 0; i < embeddedImages.length; i++) {
  const item = webSlides[i];
  pages.push(
    page(
      item.title,
      `<div class="topbar"><span>ผลงานเด่นด้านเทคโนโลยี</span><strong>${String(i + 1).padStart(2, "0")}/06</strong></div>
      <div class="image-feature">
        <img src="${embeddedImages[i]}" alt="${esc(item.title)}">
        <div class="feature-note">
          <h2>${esc(item.title)}</h2>
          <p class="subtitle">${esc(item.subtitle)}</p>
          <p>${esc(item.note)}</p>
        </div>
      </div>`
    )
  );
}

pages.push(divider("ภาคผนวกหลักฐานรูปภาพ", "พื้นที่สำหรับเติมรูปกิจกรรม ใบงาน ผลงานนักเรียน เกียรติบัตร และเอกสารประกอบ", ["รูปกิจกรรม", "ผลงานนักเรียน", "เอกสาร", "เกียรติบัตร"]));

pages.push(evidenceSlide("หลักฐาน: กิจกรรมการเรียนรู้", ["รูปกิจกรรมในชั้นเรียน", "ใบงาน/ผลงานนักเรียน", "ผลการวัดและประเมิน"], 6));
pages.push(evidenceSlide("หลักฐาน: งานโรงเรียนและชุมชน", ["การร่วมกิจกรรมโรงเรียน", "การประสานงานกับผู้ปกครอง/ชุมชน", "ภาพถ่ายหรือเอกสารประกอบ"], 6));
pages.push(evidenceSlide("หลักฐาน: การพัฒนาตนเอง", ["เกียรติบัตร/อบรม", "บันทึก PLC", "ผลงานหรือสื่อที่พัฒนาขึ้น"], 6));

pages.push(
  page(
    "สรุปผลและแผนพัฒนาต่อไป",
    `<div class="topbar"><span>ประเมินครูผู้ช่วย ครั้งที่ 3</span><strong>Next Step</strong></div>
    <h2>สรุปผลการพัฒนาและแนวทางต่อยอด</h2>
    <div class="three-cards">
      <div class="card"><h3>ผลที่เกิดกับผู้เรียน</h3><p>เติมข้อมูลผลลัพธ์ด้านความรู้ ทักษะ เจตคติ และพฤติกรรมของผู้เรียน</p></div>
      <div class="card"><h3>ผลที่เกิดกับโรงเรียน</h3><p>เติมข้อมูลการสนับสนุนงานระบบ งานกิจกรรม หรือการพัฒนาสถานศึกษา</p></div>
      <div class="card"><h3>แผนพัฒนาต่อไป</h3><p>เติมเป้าหมายระยะถัดไป เช่น สื่อ นวัตกรรม งานวิจัย หรือระบบติดตามผล</p></div>
    </div>
    <div class="quote">“พัฒนาตน พัฒนางาน เพื่อคุณภาพผู้เรียนและโรงเรียน”</div>`
  )
);

pages.push(
  page(
    "ขอบคุณ",
    `<div class="thanks">
      <p class="eyebrow">ขอขอบพระคุณคณะกรรมการประเมิน</p>
      <h1>ขอบคุณครับ/ค่ะ</h1>
      <p class="subtitle">นำเสนอโดย ........................................</p>
      <div class="footer-line">โรงเรียนบ้านคำไผ่ · การประเมินครูผู้ช่วย ครั้งที่ 3</div>
    </div>`,
    "thanks-slide"
  )
);

const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>เทมเพลตนำเสนอประเมินครูผู้ช่วย ครั้งที่ 3</title>
<style>
:root{--blue:#0f5ea8;--sky:#e8f6ff;--teal:#14b8a6;--mint:#a7f3d0;--coral:#ff7a59;--yellow:#ffe88a;--pink:#f9a8d4;--lav:#c4b5fd;--ink:#123047;--muted:#5d7184;--card:#ffffff}
*{box-sizing:border-box}
body{margin:0;background:#eef7ff;color:var(--ink);font-family:"Sarabun","Noto Sans Thai","Tahoma",sans-serif}
.slide{position:relative;width:1600px;height:900px;overflow:hidden;background:linear-gradient(135deg,#f5fbff 0%,#ffffff 52%,#f0fff8 100%);padding:70px}
.slide:before{content:"";position:absolute;inset:auto -110px -150px auto;width:420px;height:420px;border-radius:50%;background:rgba(20,184,166,.14)}
.slide:after{content:"";position:absolute;left:-120px;top:-150px;width:360px;height:360px;border-radius:50%;background:rgba(249,168,212,.18)}
h1,h2,h3,p{margin:0}
h1{font-size:74px;line-height:1.1;letter-spacing:0;color:var(--ink)}
h2{font-size:48px;line-height:1.18;margin:20px 0 28px}
h3{font-size:27px;line-height:1.25}
p,li{font-size:24px;line-height:1.45;color:var(--muted)}
ul{margin:18px 0 0;padding-left:30px}
li{margin:10px 0}
.eyebrow{font-size:22px;font-weight:700;color:var(--teal);letter-spacing:0}
.subtitle{font-size:30px;color:#31536b;margin-top:16px}
.topbar{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:14px 22px;border-radius:28px;background:rgba(255,255,255,.74);box-shadow:0 16px 40px rgba(30,80,120,.1);font-size:21px;color:var(--muted)}
.topbar strong{color:var(--blue)}
.cover-slide{padding:0;background:#f3fbff}
.cover-bg{position:absolute;inset:0;background:radial-gradient(circle at 78% 20%,rgba(196,181,253,.55),transparent 26%),radial-gradient(circle at 20% 80%,rgba(167,243,208,.72),transparent 30%),linear-gradient(135deg,#e7f6ff,#fff7fb 55%,#f1fff8)}
.cover{position:relative;z-index:2;width:100%;height:100%;padding:98px 96px;display:flex;flex-direction:column;justify-content:center}
.cover h1{font-size:92px;margin:22px 0}
.profile-row{margin-top:54px;display:flex;gap:28px;align-items:center;background:rgba(255,255,255,.72);border-radius:36px;padding:26px 34px;max-width:1050px;box-shadow:0 22px 56px rgba(15,94,168,.12)}
.avatar-placeholder,.portrait-box,.photo-box{display:flex;align-items:center;justify-content:center;text-align:center;border:4px dashed rgba(15,94,168,.28);background:rgba(255,255,255,.68);color:#598099;font-weight:700}
.avatar-placeholder{width:190px;height:190px;border-radius:50%;font-size:26px}
.profile-row h3{font-size:32px;margin-bottom:12px}
.profile-row p{font-size:24px}
.agenda-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:34px}
.agenda-card,.card,.summary-card{position:relative;z-index:2;background:rgba(255,255,255,.86);border-radius:28px;padding:28px;box-shadow:0 18px 42px rgba(30,80,120,.1);border:1px solid rgba(15,94,168,.08)}
.agenda-card b{display:inline-flex;width:56px;height:56px;border-radius:18px;align-items:center;justify-content:center;background:#dff7ff;color:var(--blue);font-size:26px;margin-bottom:18px}
.agenda-card p{font-size:21px;margin-top:10px}
.profile-layout{position:relative;z-index:2;display:grid;grid-template-columns:420px 1fr;gap:40px;align-items:stretch;margin-top:40px}
.portrait-box{height:560px;border-radius:36px;font-size:34px}
.info-list{display:grid;gap:18px}
.info-list div{display:grid;grid-template-columns:280px 1fr;align-items:center;background:rgba(255,255,255,.82);border-radius:24px;padding:24px 28px;box-shadow:0 12px 34px rgba(30,80,120,.08)}
.info-list span{font-size:24px;color:var(--muted)}
.info-list strong{font-size:29px;color:var(--ink)}
.metrics{position:relative;z-index:2;display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin:34px 0}
.metrics div{background:#fff;border-radius:28px;padding:34px;text-align:center;box-shadow:0 18px 42px rgba(30,80,120,.1)}
.metrics strong{display:block;font-size:76px;color:var(--coral);line-height:1}
.metrics span{font-size:22px;color:var(--muted);font-weight:700}
.summary-card h3{margin-bottom:14px}
.divider{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#e7f6ff,#fff,#f2fff8)}
.divider-wrap{text-align:center;position:relative;z-index:2;max-width:1180px}
.divider h1{font-size:78px}
.chips{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:34px}
.chips span{background:#fff;border-radius:999px;padding:14px 22px;font-size:22px;font-weight:700;color:var(--blue);box-shadow:0 12px 28px rgba(30,80,120,.1)}
.two-col{position:relative;z-index:2;display:grid;grid-template-columns:470px 1fr;gap:34px;align-items:start}
.soft{background:rgba(255,255,255,.88)}
.photo-grid{display:grid;gap:18px}
.photo-grid-3{grid-template-columns:repeat(3,1fr)}
.photo-grid-4{grid-template-columns:repeat(2,1fr)}
.photo-grid-6{grid-template-columns:repeat(3,1fr)}
.photo-box{height:210px;border-radius:26px;font-size:25px}
.photo-grid-4 .photo-box{height:230px}
.photo-grid-6 .photo-box{height:170px}
.thumb-grid{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.thumb-grid div{background:#fff;border-radius:24px;padding:12px;box-shadow:0 16px 36px rgba(30,80,120,.12)}
.thumb-grid img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:18px;display:block}
.thumb-grid span{display:block;font-size:22px;font-weight:700;margin-top:10px;color:var(--ink)}
.image-feature{position:relative;z-index:2;display:grid;grid-template-columns:1.25fr .75fr;gap:28px;align-items:center;margin-top:28px}
.image-feature img{width:100%;border-radius:30px;box-shadow:0 20px 54px rgba(30,80,120,.14)}
.feature-note{background:rgba(255,255,255,.9);border-radius:30px;padding:34px;box-shadow:0 18px 42px rgba(30,80,120,.1)}
.feature-note h2{font-size:42px;margin:0 0 10px}
.feature-note .subtitle{font-size:26px;margin:0 0 18px;color:var(--teal);font-weight:700}
.feature-note p{font-size:23px}
.three-cards{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:34px}
.three-cards .card{min-height:260px}
.three-cards p{font-size:23px;margin-top:14px}
.quote{position:relative;z-index:2;margin-top:34px;background:#123047;color:#fff;border-radius:28px;padding:28px 34px;font-size:32px;font-weight:700;text-align:center}
.thanks-slide{display:flex;align-items:center;justify-content:center;text-align:center;background:linear-gradient(135deg,#e7f6ff,#fff7fb 60%,#f1fff8)}
.thanks{position:relative;z-index:2}
.thanks h1{font-size:104px;margin:18px 0}
.footer-line{margin-top:50px;font-size:24px;color:var(--muted);font-weight:700}
</style>
</head>
<body>
${pages.join("\n")}
</body>
</html>`;

await fs.writeFile(htmlPath, html, "utf8");
const stat = await fs.stat(htmlPath);
console.log(JSON.stringify({ htmlPath, bytes: stat.size, slides: pages.length }, null, 2));
