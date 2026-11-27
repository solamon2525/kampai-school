/* data.js — คลังข้อมูลอาวุธ มอนสเตอร์ และระบบสร้างโจทย์คณิต ป.4-ป.6 แบบกำหนด Seed ได้ */
window.GAME_DATA = {
  TIPS: [
    'บังคับจอมเวทด้วย WASD / ลูกศร หรือลากนิ้ว/เมาส์บนจอ — เวทมนตร์จะยิงอัตโนมัติ!',
    'เก็บเพชร EXP สีฟ้าเพื่ออัปเลเวล เลือกการ์ดอาวุธ 1 ใน 3 ใบสร้างคอมโบ Roguelite',
    'แก้โจทย์ด้านบน แล้ววิ่งชนลูกแก้วคำตอบที่ถูก เพื่อระเบิดเวทล้างฝูง + ฮีล HP + รับโบนัส!',
    'ระวังลูกแก้วคำตอบผิด จะทำให้เสีย HP และมีเฉลยวิธีคิดแสดงให้ทันที'
  ],

  WEAPONS: {
    wand: {
      id: 'wand', name: 'คทาประกายดาว', icon: '✨', maxLv: 5,
      desc: [
        'ยิงลำแสงดาวใส่มอนสเตอร์ที่ใกล้ที่สุดอัตโนมัติ',
        'ยิงเพิ่มเป็น 2 นัดต่อชุด + รวดเร็วขึ้น',
        'ความเสียหาย +35% และยิงเร็วขึ้น 15%',
        'ยิงกระจาย 3 นัด + ทะลุเกราะเล็กน้อย',
        'ปลุกพลัง! ดาวตก 4 นัดต่อเนื่อง (Star Storm)'
      ]
    },
    orbs: {
      id: 'orbs', name: 'วงแหวนพาย (π)', icon: '🛡️', maxLv: 5,
      desc: [
        'อัญเชิญลูกแก้วโล่ 2 ดวงหมุนป้องกันรอบตัว',
        'เพิ่มจำนวนลูกแก้วเป็น 3 ดวง หมุนเร็วขึ้น',
        'ขยายรัศมีวงแหวน + ความเสียหาย +30%',
        'เพิ่มเป็น 4 ดวง กวาดฝูงสไลม์รอบทิศ',
        'ปลุกพลัง! วงแหวนแสงทอง 5 ดวงอมตะ (Pi Halo)'
      ]
    },
    lightning: {
      id: 'lightning', name: 'สายฟ้าสมการ', icon: '⚡', maxLv: 5,
      desc: [
        'ฟาดสายฟ้าสีทองชิ่งศัตรู 2 ตัวใกล้เคียง',
        'ชิ่งได้ 3 ตัว + คูลดาวน์ไวขึ้น',
        'พลังโจมตี +40% ระยะฟาดกว้างขึ้น',
        'ชิ่งได้ 4 ตัว พร้อมสะเก็ดประกาย',
        'ปลุกพลัง! พายุสายฟ้าชิ่ง 6 ตัว (Thunder Theorem)'
      ]
    },
    boomerang: {
      id: 'boomerang', name: 'จักรเศษส่วน', icon: '🌀', maxLv: 5,
      desc: [
        'ขว้างจักรเวทพุ่งทะลุศัตรูแล้วหมุนย้อนกลับ',
        'เพิ่มขนาดใบจักร + ขว้าง 2 ทิศทาง',
        'ความเร็วหมุนและพลังทำลาย +35%',
        'ขว้าง 3 แฉก กวาดแนวหน้าและหลัง',
        'ปลุกพลัง! จักรสุริยะยักษ์ 4 ทิศ (Fraction Nova)'
      ]
    },
    nova: {
      id: 'nova', name: 'คลื่นระเบิดคูณสิบ', icon: '💥', maxLv: 5,
      desc: [
        'ปล่อยคลื่นวงเวทรอบตัวผลักและทำลายศัตรูเป็นระยะ',
        'รัศมีระเบิดกว้างขึ้น + 25%',
        'คูลดาวน์สั้นลง 20% + ผลักแรงขึ้น',
        'ความเสียหาย +45% + รัศมีกว้างมาก',
        'ปลุกพลัง! คลื่นอัลติเมทคูณร้อย (Deca Shock)'
      ]
    }
  },

  PASSIVES: {
    haste: { id: 'haste', name: 'นาฬิกาความเร็ว', icon: '⏱️', maxLv: 4, desc: 'ลดเวลาคูลดาวน์ทุกอาวุธลงอีก 12%' },
    boots: { id: 'boots', name: 'รองเท้าลมกรด', icon: '👟', maxLv: 4, desc: 'วิ่งหลบฝูงมอนสเตอร์เร็วขึ้น +14%' },
    magnet: { id: 'magnet', name: 'แม่เหล็กเพชร EXP', icon: '🧲', maxLv: 4, desc: 'ระยะดูดเพชร EXP กว้างขึ้น +45%' },
    vitality: { id: 'vitality', name: 'หัวใจศิลา', icon: '❤️', maxLv: 4, desc: 'เพิ่ม Max HP +25 และฟื้นฟูทันที +30 HP' }
  },

  ENEMY_TYPES: {
    slime: { name: 'สไลม์ตัวเลข', hp: 22, speed: 62, radius: 13, dmg: 8, xp: 10, score: 12, color: '#38bdf8', sym: '+' },
    bat: { name: 'ค้างคาวลบเลข', hp: 16, speed: 98, radius: 12, dmg: 9, xp: 14, score: 16, color: '#c084fc', sym: '−' },
    golem: { name: 'โกเลมสูตรคูณ', hp: 58, speed: 46, radius: 18, dmg: 14, xp: 28, score: 30, color: '#f59e0b', sym: '×' },
    knight: { name: 'อัศวินตัวหาร', hp: 82, speed: 74, radius: 17, dmg: 15, xp: 36, score: 40, color: '#f43f5e', sym: '÷' },
    boss: { name: 'บอสสมการ', hp: 460, speed: 66, radius: 30, dmg: 22, xp: 160, score: 350, color: '#fbbf24', sym: '∑' }
  },

  ACHIEVEMENTS: [
    { id: 'first_math', title: 'นักคำนวณฝึกหัด', desc: 'ตอบโจทย์ลูกแก้วถูกอย่างน้อย 3 ข้อใน 1 รอบ' },
    { id: 'streak_5', title: 'คอมโบคณิต 5 สมัย', desc: 'ตอบโจทย์ถูกติดกัน 5 ข้อรวด' },
    { id: 'boss_slayer', title: 'ผู้พิชิตบอสสมการ', desc: 'โค่นบอสประจำองก์ลงได้สำเร็จ' },
    { id: 'survivor_win', title: 'จอมเวทอารีนา ป.4–ป.6', desc: 'อยู่รอดครบ 3 องก์ (180 วินาที)' }
  ]
};

/* ── Deterministic Seeded PRNG (mulberry32) & Curriculum Generator ── */
window.MathGen = (function () {
  function mulberry32(seed) {
    let t = (seed >>> 0) || 1;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(baseSeed, tag) {
    let h = (baseSeed >>> 0) ^ 0x811c9dc5;
    const s = String(tag);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0) || 1;
  }

  function randInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function shuffle(rng, arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function buildChoices(rng, ans, opKind) {
    const set = new Set([ans]);
    const deltas = opKind === 'mul' || opKind === 'div'
      ? [1, -1, 2, -2, 10, -10, 5, -5, 4, -4, 12, -12]
      : [10, -10, 1, -1, 20, -20, 2, -2, 100, -100, 5, -5];
    let guard = 0;
    while (set.size < 3 && guard < 40) {
      guard++;
      const d = deltas[Math.floor(rng() * deltas.length)];
      const cand = ans + d;
      if (cand > 0 && cand !== ans) set.add(cand);
    }
    while (set.size < 3) set.add(ans + set.size * 3);
    return shuffle(rng, Array.from(set));
  }

  function generateQuestion(act, rng) {
    const pick = rng();
    let prompt = '';
    let answer = 0;
    let op = 'add';
    let explain = '';
    let grade = 'ป.4';

    if (act <= 1) {
      grade = 'ป.4';
      if (pick < 0.28) {
        const a = randInt(rng, 12, 68) * 10 + randInt(rng, 1, 9);
        const b = randInt(rng, 11, 45) * 10 + randInt(rng, 1, 9);
        answer = a + b;
        op = 'add';
        prompt = a + ' + ' + b + ' = ?';
        explain = a + ' + ' + b + ' = ' + answer;
      } else if (pick < 0.56) {
        const b = randInt(rng, 120, 480);
        const ans = randInt(rng, 130, 520);
        const a = b + ans;
        answer = ans;
        op = 'sub';
        prompt = a + ' − ' + b + ' = ?';
        explain = a + ' − ' + b + ' = ' + answer;
      } else if (pick < 0.80) {
        const a = randInt(rng, 12, 36);
        const b = randInt(rng, 4, 9);
        answer = a * b;
        op = 'mul';
        prompt = a + ' × ' + b + ' = ?';
        explain = a + ' × ' + b + ' = ' + answer;
      } else {
        const b = randInt(rng, 4, 12);
        const ans = randInt(rng, 6, 18);
        const a = b * ans;
        answer = ans;
        op = 'div';
        prompt = a + ' ÷ ' + b + ' = ?';
        explain = b + ' × ' + ans + ' = ' + a + ' ดังนั้นตอบ ' + ans;
      }
    } else if (act === 2) {
      grade = 'ป.5';
      if (pick < 0.30) {
        const a = randInt(rng, 14, 38);
        const b = randInt(rng, 11, 19);
        answer = a * b;
        op = 'mul';
        prompt = a + ' × ' + b + ' = ?';
        explain = a + ' × ' + b + ' = ' + answer;
      } else if (pick < 0.58) {
        const b = randInt(rng, 11, 25);
        const ans = randInt(rng, 8, 24);
        const a = b * ans;
        answer = ans;
        op = 'div';
        prompt = a + ' ÷ ' + b + ' = ?';
        explain = a + ' ÷ ' + b + ' = ' + answer;
      } else if (pick < 0.80) {
        const a = randInt(rng, 18, 52);
        const b = randInt(rng, 12, 38);
        const c = randInt(rng, 3, 7);
        answer = (a + b) * c;
        op = 'mix';
        prompt = '(' + a + ' + ' + b + ') × ' + c + ' = ?';
        explain = 'ทำในวงเล็บก่อน: ' + (a + b) + ' × ' + c + ' = ' + answer;
      } else {
        const a = randInt(rng, 8, 16);
        const b = randInt(rng, 5, 9);
        const c = randInt(rng, 25, 95);
        answer = a * b + c;
        op = 'mix';
        prompt = a + ' × ' + b + ' + ' + c + ' = ?';
        explain = 'คูณก่อนบวก: ' + (a * b) + ' + ' + c + ' = ' + answer;
      }
    } else {
      grade = 'ป.6';
      if (pick < 0.28) {
        const x = randInt(rng, 9, 26);
        const k = randInt(rng, 8, 16);
        const rhs = x * k;
        answer = x;
        op = 'eq';
        prompt = '□ × ' + k + ' = ' + rhs + ' (หา □)';
        explain = rhs + ' ÷ ' + k + ' = ' + x;
      } else if (pick < 0.56) {
        const a = randInt(rng, 150, 320);
        const b = randInt(rng, 6, 15);
        const c = randInt(rng, 4, 12);
        const prod = b * c;
        if (a > prod) {
          answer = a - prod;
          op = 'mix';
          prompt = a + ' − ' + b + ' × ' + c + ' = ?';
          explain = 'คูณก่อนลบ: ' + a + ' − ' + prod + ' = ' + answer;
        } else {
          answer = prod + a;
          op = 'mix';
          prompt = b + ' × ' + c + ' + ' + a + ' = ?';
          explain = prod + ' + ' + a + ' = ' + answer;
        }
      } else if (pick < 0.80) {
        const p = randInt(rng, 4, 15);
        const q = randInt(rng, 3, 12);
        const ans = randInt(rng, 5, 18);
        const sum = p + q;
        const total = sum * ans;
        answer = ans;
        op = 'div';
        prompt = total + ' ÷ (' + p + ' + ' + q + ') = ?';
        explain = total + ' ÷ ' + sum + ' = ' + ans;
      } else {
        const pct = [10, 20, 25, 50][Math.floor(rng() * 4)];
        const base = randInt(rng, 2, 16) * 20;
        answer = Math.round((pct * base) / 100);
        op = 'pct';
        prompt = pct + '% ของ ' + base + ' = ?';
        explain = '(' + pct + ' × ' + base + ') ÷ 100 = ' + answer;
      }
    }

    return {
      grade: grade,
      op: op,
      prompt: prompt,
      answer: answer,
      choices: buildChoices(rng, answer, op),
      explain: explain
    };
  }

  return {
    mulberry32: mulberry32,
    hashSeed: hashSeed,
    randInt: randInt,
    shuffle: shuffle,
    generateQuestion: generateQuestion
  };
})();
