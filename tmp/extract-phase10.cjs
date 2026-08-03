const fs = require('fs');
const p = 'C:/Users/Administrator/.cursor/projects/d-kampai-school-main/agent-transcripts/a0f063a8-f4dd-4db9-aea8-6f30ac890828/a0f063a8-f4dd-4db9-aea8-6f30ac890828.jsonl';
const lines = fs.readFileSync(p, 'utf8').split(/\n/);
for (const line of lines) {
  if (!line.includes('แผนยกระดับสื่อ + ใบงานทั้งหมด')) continue;
  const obj = JSON.parse(line);
  for (const part of obj.message?.content || []) {
    if (part.type === 'text' && part.text.includes('แผนยกระดับ')) {
      process.stdout.write(part.text.slice(0, 18000));
    }
  }
}
