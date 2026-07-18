#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesRoot = path.join(repoRoot, 'public', 'games');

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
    const effectiveSource = source + sharedTopicSource;
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
            && /window\.print\s*\(/.test(effectiveSource),
        'ต้องมี @media print, @page A4 portrait และปุ่มเรียก window.print()',
    );

    const cssVersion = extractVersion(source, 'worksheet-modes.css');
    const jsVersion = extractVersion(source, 'worksheet-modes.js');
    check(
        'shared modes',
        Boolean(cssVersion) && Boolean(jsVersion) && cssVersion === jsVersion,
        'ต้องโหลด worksheet-modes.css/js พร้อม query version เดียวกัน',
    );

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
                && /KampaiWorksheet\.loadTeachers\s*\(/.test(source),
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
            ['long-division', 'ld-quotient', 'ld-divisor', 'ld-dividend', 'ld-work', 'ld-quotient-answer', 'ld-teacher-value', 'ld-answer-fill'].every((token) => source.includes(token))
                && !/class=["'][^"']*div-box/.test(source)
                && !/<span class=["']ta["']>เฉลย/.test(source),
            'โจทย์หารต้องเป็นกระดานตั้งหารยาวและเฉลยต้องเติมผลหาร/ตัวคูณ/ผลลบ/เศษลงในช่องจริง ไม่ใช้ป้ายคำตอบแยก',
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
            source.includes('formula') && source.includes('work-line'),
            'โจทย์พื้นที่ต้องมีสูตรและบรรทัดลงวิธีคำนวณ',
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
