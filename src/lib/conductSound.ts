/**
 * conductSound.ts
 * ระบบเสียงเอฟเฟกต์สังเคราะห์ (Web Audio API Chime) และจัดรูปประโยคเสียงพูดสังเคราะห์ภาษาไทย
 * สำหรับระบบธนาคารความดี (Conduct Management) ให้การตอบสนองทันทีในระดับเสี้ยววินาที (Zero Latency)
 */

import { getFirstName, thaiNumberToWords } from './thaiSpeech';

export type ConductScoreType = 'add' | 'deduct';

interface ActiveAudioNode {
  osc: OscillatorNode;
  gain: GainNode;
  timerId?: ReturnType<typeof setTimeout>;
}

let activeNodes: ActiveAudioNode[] = [];
let audioContextInstance: AudioContext | null = null;

/**
 * ดึง AudioContext อย่างปลอดภัย รองรับ Webkit prefix และการเรียกซ้ำ
 */
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    if (!audioContextInstance || audioContextInstance.state === 'closed') {
      audioContextInstance = new AudioCtx();
    }
    return audioContextInstance;
  } catch {
    return null;
  }
};

/**
 * หยุดเสียงเอฟเฟกต์ (Chime) ที่กำลังเล่นอยู่ทันที
 */
export const stopConductChime = (): void => {
  activeNodes.forEach(({ osc, gain, timerId }) => {
    if (timerId) clearTimeout(timerId);
    try {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    } catch {
      // ignore
    }
  });
  activeNodes = [];
};

/**
 * เล่นเสียงเอฟเฟกต์สังเคราะห์ Chime ตอบสนองทันที (Zero Latency)
 * - 'add': โทนสดใสกระชับ (Bright upward major triad: C5 -> E5 -> G5)
 * - 'deduct': โทนเตือนนุ่มนวล (Soft gentle descending tone: A4 -> F4 sine wave)
 */
export const playConductChime = (type: ConductScoreType = 'add'): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      void ctx.resume().catch(() => {});
    }

    // หยุดเสียงก่อนหน้าทันทีเพื่อความชัดเจน ไม่ซ้อนทับกัน
    stopConductChime();

    const now = ctx.currentTime;

    if (type === 'add') {
      // โทนสดใสกระชับ: C5 (523.25) -> E5 (659.25) -> G5 (783.99)
      const notes = [
        { freq: 523.25, start: now, duration: 0.08, vol: 0.16 },
        { freq: 659.25, start: now + 0.07, duration: 0.08, vol: 0.18 },
        { freq: 783.99, start: now + 0.14, duration: 0.22, vol: 0.20 },
      ];

      notes.forEach(({ freq, start, duration, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        // ป้องกันเสียงคลิก/ป๊อป (Audio click) ด้วยการตั้งค่าเริ่มต้นที่ 0.0001 ตั้งแต่สร้างโหนด
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);

        const node: ActiveAudioNode = { osc, gain };
        const timerId = setTimeout(() => {
          activeNodes = activeNodes.filter(n => n !== node);
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {
            // ignore
          }
        }, (duration + 0.15) * 1000);
        node.timerId = timerId;
        activeNodes.push(node);
      });
    } else {
      // โทนเตือนนุ่มนวล: A4 (440.00) -> F4 (349.23) นุ่มนวล ไม่สร้างความตระหนก
      const notes = [
        { freq: 440.00, start: now, duration: 0.12, vol: 0.14 },
        { freq: 349.23, start: now + 0.10, duration: 0.24, vol: 0.16 },
      ];

      notes.forEach(({ freq, start, duration, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        // ป้องกันเสียงคลิก/ป๊อป (Audio click)
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);

        const node: ActiveAudioNode = { osc, gain };
        const timerId = setTimeout(() => {
          activeNodes = activeNodes.filter(n => n !== node);
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {
            // ignore
          }
        }, (duration + 0.15) * 1000);
        node.timerId = timerId;
        activeNodes.push(node);
      });
    }
  } catch (err) {
    // ปลอดภัยหากบราวเซอร์ยังไม่อนุญาต AudioContext
    console.warn('Conduct sound effect unsupported or blocked:', err);
  }
};

/**
 * รูปแบบเสียงพูดสรุปภาษาไทยรายคน (RecordTab)
 * "เพิ่ม/หัก คะแนนความดีสำเร็จ ชื่อ [ชื่อนักเรียน] เพิ่ม/หัก [X] คะแนน คะแนนคงเหลือ [Y] คะแนน"
 */
export const formatConductRecordSpeech = (
  type: ConductScoreType,
  studentName: string,
  score: number,
  accumulatedScore: number
): string => {
  const isAdd = type === 'add';
  const actionText = isAdd ? 'เพิ่ม' : 'หัก';
  const firstName = getFirstName(studentName);
  const scoreWords = thaiNumberToWords(score);
  const remainingWords = thaiNumberToWords(Math.max(0, accumulatedScore));
  return `${actionText}คะแนนความดีสำเร็จ ชื่อ ${firstName} ${actionText} ${scoreWords} คะแนน คะแนนคงเหลือ ${remainingWords} คะแนน`;
};

/**
 * รูปแบบเสียงพูดสรุปภาษาไทยหลายคน (BulkRecordTab)
 * "บันทึกคะแนนความดีสำเร็จ [X] คน บวก/หักคนละ [Y] คะแนน"
 */
export const formatConductBulkSpeech = (
  type: ConductScoreType,
  studentCount: number,
  scorePerStudent: number
): string => {
  const isAdd = type === 'add';
  const countWords = thaiNumberToWords(studentCount);
  const scoreWords = thaiNumberToWords(scorePerStudent);
  return `บันทึกคะแนนความดีสำเร็จ ${countWords} คน ${isAdd ? 'บวก' : 'หัก'}คนละ ${scoreWords} คะแนน`;
};
