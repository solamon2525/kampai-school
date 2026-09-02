#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesRoot = path.join(repoRoot, 'public', 'games');
const migrationsRoot = path.join(repoRoot, 'supabase', 'migrations');
const migrationSource = fs.readdirSync(migrationsRoot)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => fs.readFileSync(path.join(migrationsRoot, name), 'utf8'))
    .join('\n');

function findWorksheets(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) return findWorksheets(target);
        return entry.name.endsWith('worksheet.html') ? [target] : [];
    });
}

function resolveTargets(argument) {
    if (!argument) return findWorksheets(gamesRoot).sort();

    const target = path.resolve(repoRoot, argument);
    if (!fs.existsSync(target)) throw new Error(`ไม่พบไฟล์หรือโฟลเดอร์: ${argument}`);
    if (fs.statSync(target).isDirectory()) return findWorksheets(target).sort();
    if (!target.endsWith('worksheet.html')) throw new Error('ไฟล์เป้าหมายต้องลงท้ายด้วย worksheet.html');
    return [target];
}

function extractVersion(source, assetName) {
    const match = source.match(new RegExp(`${assetName.replace('.', '\\.')}(?:\\?v=([^"'&>]+))?`));
    return match ? (match[1] ?? '') : null;
}

function readLinkedLocalAsset(source, assetName) {
    const match = source.match(new RegExp(`["'](/games/[^"']*${assetName.replace('.', '\\.')}(?:\\?[^"']*)?)["']`));
    if (!match) return '';
    const assetPath = match[1].split('?')[0].replace(/^\//, '');
    const file = path.join(repoRoot, 'public', assetPath.replace(/^games[\\/]/, 'games/'));
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function verifyFile(file) {
    const source = fs.readFileSync(file, 'utf8');
    const sharedTopicSource = readLinkedLocalAsset(source, 'worksheet-topic.css') + readLinkedLocalAsset(source, 'worksheet-topic.js');
    const sharedColorFillSource = readLinkedLocalAsset(source, 'color-fill-pack.css') + readLinkedLocalAsset(source, 'color-fill-pack.js');
    const effectiveSource = source + sharedTopicSource + sharedColorFillSource;
    const relative = path.relative(repoRoot, file).replaceAll('\\', '/');
    const failures = [];
    const checks = [];

    function check(name, condition, detail) {
        checks.push(name);
        if (!condition) failures.push(`${name}: ${detail}`);
    }

    check(
        'document',
        /<html[^>]+lang=["']th["']/i.test(source) && /Sarabun/i.test(source) && /<title>[^<]+<\/title>/i.test(source),
        'ต้องกำหนด lang="th", ฟอนต์ Sarabun และ title',
    );
    check(
        'toolbar contract',
        /class=["'][^"']*toolbar-ctrls/.test(source)
            && /id=["']selStyle["']/.test(source)
            && /id=["']selPageCount["']/.test(source)
            && /id=["']pages["']/.test(source),
        'ต้องมี .toolbar-ctrls, #selStyle, #selPageCount และ #pages',
    );
    check(
        'render contract',
        /function\s+render\s*\(/.test(effectiveSource)
            && /class=["'][^"']*sheet/.test(effectiveSource)
            && /class=["'][^"']*questions/.test(effectiveSource)
            && /class=["'][^"']*q(?:\s|["'])/.test(effectiveSource),
        'ต้องมี render() และโครง #pages > .sheet > .questions > .q',
    );
    check(
        'A4 print',
        /@media\s+print/i.test(effectiveSource)
            && /@page/i.test(effectiveSource)
            && /size\s*:\s*A4\s+portrait/i.test(effectiveSource)
            && (/window\.print\s*\(/.test(effectiveSource)
                || /KampaiWorksheet\.printA4\s*\(/.test(effectiveSource)
                || /printA4\s*\(/.test(readLinkedLocalAsset(source, 'worksheet-runtime.js'))),
        'ต้องมี @media print, @page A4 portrait และปุ่มเรียก window.print() หรือ KampaiWorksheet.printA4()',
    );
    check('print runtime', !/window\.print\s*\(/.test(source), 'ต้องใช้ KampaiWorksheet.printA4() แทน window.print() โดยตรง');
    check('work spacing', !/\.q-work-block[^{}]*justify-content\s*:\s*space-evenly/.test(effectiveSource), 'พื้นที่ทำงานต้องใช้ gap คงที่ ไม่ใช้ space-evenly');

    const cssVersion = extractVersion(source, 'worksheet-modes.css');
    const jsVersion = extractVersion(source, 'worksheet-modes.js');
    check(
        'shared modes',
        Boolean(cssVersion) && Boolean(jsVersion) && cssVersion === jsVersion,
        'ต้องโหลด worksheet-modes.css/js พร้อม query version เดียวกัน',
    );

    if (!relative.endsWith('/_template-worksheet.html')) {
        const sourceMedia = source.match(/<meta\s+name=["']worksheet-source-media["']\s+content=["']([^"']+)["']/i)?.[1];
        const sourceMediaFile = sourceMedia ? path.join(repoRoot, 'public', sourceMedia.replace(/^\//, '')) : '';
        const publicUrl = '/' + relative.replace(/^public\//, '');
        check(
            'worksheet catalog registration',
            migrationSource.includes(publicUrl),
            `ต้องลงทะเบียน ${publicUrl} ใน migration ของคลังใบงาน`,
        );
        check(
            'source media contract',
            Boolean(sourceMediaFile)
                && fs.existsSync(sourceMediaFile)
                && /<meta\s+name=["']curriculum-indicators["']\s+content=["'][^"']+["']/i.test(source),
            'ต้องระบุสื่อคู่ที่มีอยู่จริงและตัวชี้วัดใน metadata',
        );
        check(
            'saved sets contract',
            /worksheet-topic\.js/.test(source)
                || /upgradeLegacyWorksheet\s*\(/.test(source)
                || (/loadSetsModule\s*\(/.test(effectiveSource) && /mountToolbar\s*\(/.test(effectiveSource)),
            'ใบงานทุกไฟล์ต้องบันทึก/โหลด/แชร์ชุดเดิมได้ด้วย worksheet key, seed และ config',
        );
        check(
            'step answer reveal contract',
            /worksheet-topic\.js/.test(source)
                || /upgradeLegacyWorksheet\s*\(/.test(source)
                || (/btnAnswerPrev/.test(effectiveSource) && /btnAnswerNext/.test(effectiveSource) && /reveal/.test(effectiveSource)),
            'ใบงานทุกไฟล์ต้องซ่อนคำตอบเริ่มต้นและรองรับเฉลยทีละข้อ ย้อนกลับ และเปิดทั้งหมด',
        );
    }

    const topicCssVersion = extractVersion(source, 'worksheet-topic.css');
    const topicJsVersion = extractVersion(source, 'worksheet-topic.js');
    if (topicCssVersion !== null || topicJsVersion !== null) {
        check(
            'paired media metadata',
            /<meta\s+name=["']worksheet-source-media["']\s+content=["']\/games\//i.test(source)
                && /<meta\s+name=["']curriculum-indicators["']\s+content=["'][^"']+["']/i.test(source),
            'ใบงานแบบ topic ต้องระบุ source media และตัวชี้วัด',
        );
        const sourceMedia = source.match(/<meta\s+name=["']worksheet-source-media["']\s+content=["']([^"']+)["']/i)?.[1];
        const sourceMediaFile = sourceMedia ? path.join(repoRoot, 'public', sourceMedia.replace(/^\//, '')) : '';
        check(
            'paired media exists',
            Boolean(sourceMediaFile) && fs.existsSync(sourceMediaFile) && source.includes(`sourceMediaUrl:'${sourceMedia}'`),
            'ไฟล์สื่อหลักต้องมีอยู่จริงและตรงกับ sourceMediaUrl ใน config',
        );
        check(
            'shared topic engine',
            Boolean(topicCssVersion) && Boolean(topicJsVersion) && topicCssVersion === jsVersion && topicJsVersion === jsVersion,
            'worksheet-topic.css/js และ shared modes ต้องใช้ query version เดียวกัน',
        );
    }

    if (/id=["']selTeacher["']/.test(source)) {
        const runtimeVersion = extractVersion(source, 'worksheet-runtime.js');
        check(
            'teacher runtime',
            Boolean(runtimeVersion)
                && runtimeVersion === jsVersion
                && /KampaiWorksheet\.loadTeachers\s*\(/.test(effectiveSource),
            'ใบงานที่เลือกครูต้องใช้ worksheet-runtime.js version เดียวกับ shared modes',
        );
        check(
            'no duplicated data access',
            !/(?:SUPABASE_URL|SUPABASE_KEY|\/rest\/v1\/|function\s+fetchTeachers\s*\()/i.test(source),
            'ห้ามฝัง URL/key/REST query หรือ fetchTeachers ซ้ำในไฟล์ใบงาน',
        );
    }

    if (relative.endsWith('/division-worksheet.html')) {
        check(
            'long-division scaffold',
            ['long-division', 'ld-quotient', 'ld-divisor', 'ld-dividend', 'ld-work', 'ld-calc-row', 'ld-product', 'ld-partial', 'ld-quotient-answer', 'ld-teacher-value', 'ld-answer-fill', 'data-fixed-count="6"', 'function getWorksheetCount()', 'count-6', 'count-8', '--work-rows', 'grid-template-rows:repeat(var(--work-rows)'].every((token) => source.includes(token))
                && !/class=["'][^"']*div-box/.test(source)
                && !/<span class=["']ta["']>เฉลย/.test(source)
                && !source.includes('ld-step')
                && !source.includes('ld-phase'),
            'โจทย์หารต้องปรับ 6/8 ข้อตามจำนวนหลัก ใช้ตำแหน่งตั้งหารจริง และเฉลยต้องเติมผลหาร/ผลคูณ/ผลลบ/เลขดึงลงในหลักตรงกัน โดยไม่มีป้ายขั้นหรือตอบแยก',
        );
    }
    if (relative.endsWith('/multiplication-worksheet.html')) {
        check(
            'multiplication scaffold',
            source.includes('class="mg"') || source.includes("class='mg'"),
            'โจทย์คูณต้องมีตารางลงกระบวนการคูณ',
        );
    }
    if (relative.endsWith('/rect-area-worksheet.html')) {
        check(
            'area scaffold',
            source.includes('formula') && source.includes('work-line')
              && /line3/.test(source)
              && (source.match(/class="work-line"/g) || []).length >= 3,
            'โจทย์พื้นที่ต้องมีสูตรและบรรทัดวิธีทำ 3 แถว (1 ขั้นต่อแถว)',
        );
        check(
            'saved sets contract',
            /KampaiWorksheet\.loadSetsModule|KampaiWorksheetSets/.test(source)
                && /worksheet-runtime\.js/.test(source)
                && (/kampaiBtnSaveSet|mountToolbar/.test(source) || /WORKSHEET_KEY\s*=\s*['"]rect-area['"]/.test(source))
                && /[?&]set=|getConfigFromUrl|searchParams\.get\(['"]set['"]\)/.test(source),
            'rect-area ต้องโหลด worksheet sets และรองรับ ?set= / บันทึกชุด',
        );
        check(
            'set title suggestion',
            /titlePrefix\s*:|suggestTitle\s*:/.test(source)
              && /พื้นที่เรขาคณิต/.test(source)
              && /TOPIC_SHORT|topicLabels|คางหมู/.test(source)
              && /หน้า/.test(source)
              && /selPageCount/.test(source),
            'rect-area ต้องตั้งชื่อชุดอัตโนมัติจากหัวข้อ + จำนวนหน้า เช่น พื้นที่เรขาคณิต - คางหมู · 2 หน้า · ชุด N',
        );
        check(
            '5/10 question layouts',
            /id=["']selCount["']/.test(source)
              && /count-5/.test(source)
              && /count-10/.test(source)
              && /perPage|selCount/.test(source)
              && /value=["']5["']/.test(source)
              && /value=["']10["']/.test(source),
            'rect-area ต้องเลือกได้ 5 ข้อ/หน้า (พื้นที่วิธีทำ) และ 10 ข้อ/หน้า (ฝึกเร็ว)',
        );
    }

    const linkedSetsSource = readLinkedLocalAsset(source, 'worksheet-sets.js')
        + readLinkedLocalAsset(source, 'worksheet-runtime.js')
        + readLinkedLocalAsset(source, 'worksheet-topic.js');
    const setsEngineFile = path.join(gamesRoot, 'worksheet-sets.js');
    const setsEngineSource = fs.existsSync(setsEngineFile) ? fs.readFileSync(setsEngineFile, 'utf8') : '';
    if (/worksheet-topic\.js/.test(source) || /KampaiWorksheetSets|loadSetsModule/.test(source + linkedSetsSource)) {
        check(
            'worksheet sets engine',
            /KampaiWorksheetSets/.test(linkedSetsSource + source)
                && /mountToolbar/.test(linkedSetsSource + setsEngineSource + source)
                && /mulberry32|createRng/.test(setsEngineSource + linkedSetsSource + source)
                && /loadSetsModule/.test(linkedSetsSource + source),
            'ต้องมี engine ชุดใบงานกลาง (seed RNG + mountToolbar + save/load ผ่าน runtime)',
        );
        check(
            'auto set title default',
            /buildDefaultSetTitle/.test(setsEngineSource)
                && /autoTitle\s*!==\s*false/.test(setsEngineSource)
                && /หน้า · ชุด/.test(setsEngineSource),
            'engine ต้องตั้งชื่อชุดอัตโนมัติทุกใบงาน (หัวข้อ + จำนวนหน้า + ชุด N) โดยไม่ต้องพิมพ์',
        );
    }
    const scaffoldRules = [
        ['data-chart-worksheet.html', ['mini-table', 'chart-grid', 'scale-box'], 'ข้อมูลต้องมีตาราง พื้นที่กราฟ และช่องกำหนดสเกล'],
        ['fact-opinion-worksheet.html', ['classify-grid', 'evidence-line', 'reason-line'], 'ต้องมีช่องจำแนก หลักฐาน และเหตุผล'],
        ['phonics-worksheet.html', ['sound-row', 'sound-box', 'word-bank'], 'ต้องมีธนาคารคำและกล่องแยกเสียง'],
        ['water-cycle-worksheet.html', ['cycle-flow', 'cycle-step', 'reason-line'], 'ต้องมีลำดับวัฏจักรและช่องอธิบายเหตุผล'],
        ['food-label-worksheet.html', ['nutrition-label', 'calc-line', 'decision-box'], 'ต้องมีฉลาก ช่องคำนวณ และการตัดสินใจ'],
    ];
    for (const [suffix, tokens, detail] of scaffoldRules) {
        if (relative.endsWith('/' + suffix)) {
            check('topic scaffold', tokens.every((token) => effectiveSource.includes(token)), detail);
        }
    }

    return { relative, checks, failures };
}

let targets;
try {
    targets = resolveTargets(process.argv[2]);
} catch (error) {
    console.error(`verify:worksheet — ${error.message}`);
    process.exit(1);
}

const results = targets.map(verifyFile);
let failureCount = 0;
let checkCount = 0;

for (const result of results) {
    checkCount += result.checks.length;
    failureCount += result.failures.length;
    console.log(`${result.failures.length ? 'FAIL' : 'PASS'} ${result.relative} (${result.checks.length} checks)`);
    for (const failure of result.failures) console.log(`  - ${failure}`);
}

console.log(`\n${failureCount ? 'FAILED' : 'PASSED'} ${targets.length} worksheet(s), ${checkCount} checks, ${failureCount} failure(s)`);
process.exit(failureCount ? 1 : 0);
