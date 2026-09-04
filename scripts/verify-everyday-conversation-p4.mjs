import fs from 'node:fs';
import vm from 'node:vm';

const target = 'public/games/english/everyday-conversation-p4-media.html';
const html = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
const start = html.indexOf('const SCENES=[');
const end = html.indexOf('\n    ];', start);
if (start < 0 || end < 0) throw new Error('ไม่พบ SCENES ในสื่อสนทนา ป.4');

const context = {};
vm.createContext(context);
vm.runInContext(`${html.slice(start, end + 7)};globalThis.scenes=SCENES;`, context);

const scenes = context.scenes;
const errors = [];
const expectedIndicators = [
  'ต 1.1 ป.4/4',
  'ต 1.2 ป.4/1',
  'ต 1.2 ป.4/2',
  'ต 1.2 ป.4/3',
  'ต 1.2 ป.4/4',
  'ต 1.2 ป.4/5',
  'ต 4.1 ป.4/1',
];

if (scenes.length !== 6) errors.push(`ต้องมี 6 สถานการณ์ แต่พบ ${scenes.length}`);
const dialogues = scenes.flatMap((scene) => scene.dialogues);
if (dialogues.length !== 30) errors.push(`ต้องมี 30 บทสนทนา แต่พบ ${dialogues.length}`);

const titles = new Set();
for (const scene of scenes) {
  if (scene.dialogues.length !== 5) errors.push(`${scene.id}: ต้องมี 5 บท`);
  if (!scene.goal || !scene.indicator) errors.push(`${scene.id}: ขาด goal หรือ indicator`);
  for (const dialogue of scene.dialogues) {
    if (titles.has(dialogue.title)) errors.push(`ชื่อบทซ้ำ: ${dialogue.title}`);
    titles.add(dialogue.title);
    if (dialogue.lines.length !== 4) errors.push(`${dialogue.title}: ต้องมี 4 ช่วงพูด`);
    dialogue.lines.forEach((line, index) => {
      if (line.length !== 4 || line.some((value) => typeof value !== 'string' || !value.trim())) {
        errors.push(`${dialogue.title} บรรทัด ${index + 1}: ข้อมูลไม่ครบ role/en/reading/meaning`);
        return;
      }
      const expectedRole = index % 2 === 0 ? 'A' : 'B';
      if (line[0] !== expectedRole) errors.push(`${dialogue.title} บรรทัด ${index + 1}: ต้องเป็นบท ${expectedRole}`);
      if (/[ก-๙]/.test(line[1])) errors.push(`${dialogue.title} บรรทัด ${index + 1}: ประโยค English มีอักษรไทยปน`);
      if (!/[ก-๙]/.test(line[2]) || !/[ก-๙]/.test(line[3])) errors.push(`${dialogue.title} บรรทัด ${index + 1}: ขาดคำอ่านหรือคำแปลไทย`);
    });
  }
}

for (const code of expectedIndicators) {
  if (!scenes.some((scene) => scene.indicator.includes(code))) errors.push(`ขาดตัวชี้วัด ${code}`);
}
if (!/data-mode="learn"/.test(html) || !/data-mode="practice"/.test(html)) errors.push('ขาดโหมดครูนำหรือจับคู่ A/B');
if (/submitScore\s*\(/.test(html)) errors.push('สื่อการสอนต้องไม่ส่งคะแนน');
if (!/speakBilingual/.test(html) || !/onDone/.test(html)) errors.push('ขาดเสียงทีละบรรทัดหรือคิวเล่นทั้งบท');
if (!/conversation_p4_show_reading/.test(html) || !/conversation_p4_show_meaning/.test(html)) errors.push('ขาดสถานะคำอ่านหรือคำแปล');

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Everyday Conversation P4 verified: ${scenes.length} scenes, ${dialogues.length} dialogues, ${dialogues.reduce((sum, dialogue) => sum + dialogue.lines.length, 0)} speaking turns, ${expectedIndicators.length} indicators`);
