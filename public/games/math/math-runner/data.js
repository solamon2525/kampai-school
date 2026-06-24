/* data.js — คลังโจทย์และตัวสร้างสมการสำหรับ Math Runner */
window.GAME_DATA = {
  // ฟังก์ชันสุ่มตัวเลือกปลอกหลอก (Distractors) สำหรับ 4 เลน (1 ถูก, 3 ผิด)
  generateChoices: function(target, customRng = null) {
    const random = () => {
      if (customRng && typeof customRng.next === 'function') {
        return customRng.next();
      }
      return Math.random();
    };

    const distractors = new Set();
    const targetStr = target.toString();
    
    // 1. สุ่มบวกหรือลบเล็กน้อย (เช่น ±1 ถึง ±5)
    while (distractors.size < 5) {
      const diff = Math.floor(random() * 5) + 1;
      const sign = random() < 0.5 ? 1 : -1;
      const fake = target + (diff * sign);
      if (fake > 0 && fake !== target) {
        distractors.add(fake);
      }
    }
    
    // 2. สุ่มแบบบวกสิบ (±10)
    const fakeTen = target + (random() < 0.5 ? 10 : -10);
    if (fakeTen > 0 && fakeTen !== target) {
      distractors.add(fakeTen);
    }
    
    // 3. สุ่มแบบสลับหลักสิบหลักหน่วย (เช่น 34 -> 43)
    if (targetStr.length >= 2) {
      const reversed = parseInt(targetStr.split('').reverse().join(''));
      if (reversed > 0 && reversed !== target) {
        distractors.add(reversed);
      }
    }
    
    // ปลดลอคตัวเลขอื่นๆ เพื่อกันกรณีไม่มีตัวเลือกพอ
    let fallback = 1;
    while (distractors.size < 5) {
      const fake = target + fallback;
      if (fake > 0 && fake !== target) {
        distractors.add(fake);
      }
      fallback++;
    }

    // เอาเฉพาะตัวเลือกที่มีค่ามากกว่า 0
    const list = Array.from(distractors).filter(x => x > 0 && x !== target);
    
    // สุ่มหยิบมา 3 ตัวผสมกับ target เพื่อให้ได้ 4 ตัวเลือกสำหรับ 4 เลน
    const finalChoices = [target, list[0], list[1], list[2]];
    
    // สับการ์ดสลับตำแหน่ง (Shuffle)
    return finalChoices.sort(() => random() - 0.5);
  },

  // ฟังก์ชันสร้างโจทย์คณิตศาสตร์
  generateProblem: function(mathMode, tier, isEquationMode, customRng = null) {
    let A, B, Ans, Op, Target;
    
    // ฟังก์ชันสุ่มสำหรับกรณีเล่นโหมดออนไลน์ (ใช้ seed RNG ร่วมกัน)
    const random = () => {
      if (customRng && typeof customRng.next === 'function') {
        return customRng.next(); // Mulberry32 หรือ Seeded RNG ที่ส่งมา
      }
      return Math.random();
    };

    const randomRange = (min, max) => {
      return Math.floor(random() * (max - min + 1)) + min;
    };

    let mode = mathMode;
    if (mode === 'mix') {
      const modes = ['add', 'sub', 'mul', 'div'];
      mode = modes[Math.floor(random() * modes.length)];
    }

    if (mode === 'mul') {
      Op = '×';
      if (tier === 1) { 
        const set = [2, 5, 10];
        A = set[Math.floor(random() * set.length)];
        B = randomRange(1, 9);
      } else if (tier === 2) { 
        const set = [3, 4, 6];
        A = set[Math.floor(random() * set.length)];
        B = randomRange(1, 12);
      } else if (tier === 3) { 
        const set = [7, 8, 9];
        A = set[Math.floor(random() * set.length)];
        B = randomRange(1, 12);
      } else { 
        A = randomRange(2, 12);
        B = randomRange(1, 12);
      }
      Ans = A * B;
    } 
    else if (mode === 'add') {
      Op = '+';
      if (tier === 1) { 
        A = randomRange(1, 9);
        B = randomRange(1, 9);
      } else if (tier === 2) { 
        A = randomRange(10, 29);
        B = randomRange(1, 9);
      } else if (tier === 3) {
        A = randomRange(10, 49);
        B = randomRange(10, 49);
      } else { 
        A = randomRange(50, 99);
        B = randomRange(10, 99);
      }
      Ans = A + B;
    }
    else if (mode === 'sub') {
      Op = '-';
      if (tier === 1) {
        A = randomRange(5, 15); 
        B = randomRange(1, A - 1); 
      } else if (tier === 2) {
        A = randomRange(20, 59);
        B = randomRange(1, 19);
      } else if (tier === 3) {
        A = randomRange(20, 89);
        B = randomRange(10, 49);
      } else {
        A = randomRange(100, 199);
        B = randomRange(10, 99);
      }
      if (B >= A) B = A - 1;
      Ans = A - B;
    }
    else if (mode === 'div') {
      Op = '÷';
      let divisor, answer;
      if (tier === 1) {
        divisor = randomRange(2, 5); 
        answer = randomRange(1, 9);   
      } else if (tier === 2) {
        divisor = randomRange(2, 9);
        answer = randomRange(2, 9);
      } else {
        divisor = randomRange(3, 12);
        answer = randomRange(2, 12);
      }
      B = divisor;
      A = divisor * answer; 
      Ans = answer;
    }

    Target = Ans;
    let displayStr = `${A} ${Op} ${B} = ?`;

    if (isEquationMode) {
      if (random() < 0.5) {
        displayStr = `? ${Op} ${B} = ${Ans}`;
        Target = A;
      } else {
        displayStr = `${A} ${Op} ? = ${Ans}`;
        Target = B;
      }
    }

    // สร้างตัวเลือก 4 ตัว
    const choices = this.generateChoices(Target, customRng);

    return {
      A: A,
      B: B,
      Ans: Ans,
      Op: Op,
      Target: Target,
      displayStr: displayStr,
      choices: choices
    };
  },

  // ฟังก์ชันสุ่มประเภทมอนสเตอร์ (รองรับ seed RNG โหมดออนไลน์)
  generateMonsterType: function(customRng = null) {
    const random = () => {
      if (customRng && typeof customRng.next === 'function') {
        return customRng.next();
      }
      return Math.random();
    };
    const types = ['goomba', 'koopa', 'spiny'];
    return types[Math.floor(random() * types.length)];
  },

  // ฟังก์ชันสุ่มประเภทไอเทม (รองรับ seed RNG โหมดออนไลน์)
  generateItemType: function(customRng = null) {
    const random = () => {
      if (customRng && typeof customRng.next === 'function') {
        return customRng.next();
      }
      return Math.random();
    };
    const r = random();
    if (r < 0.12) return 'mushroom'; // เห็ดขยายตัว/เกราะ
    if (r < 0.21) return 'star';     // ดาวอมตะ
    if (r < 0.30) return 'shield';   // โล่ป้องกัน
    if (r < 0.40) return 'double';   // ✖️2 คะแนนคูณสอง (ใหม่)
    if (r < 0.49) return 'magnet';   // 🧲 แม่เหล็กดูดเหรียญ/ไอเทม (ใหม่)
    if (r < 0.55) return 'bomb';     // 💣 ระเบิด/แช่แข็งมอนสเตอร์ทั้งจอ (ใหม่)
    if (r < 0.65) return 'poison';   // เห็ดพิษสับสน
    if (r < 0.75) return 'lightning';// สายฟ้าสโลว์
    if (r < 0.84) return 'egg';      // ไข่โบนัสแต้ม
    if (r < 0.94) return 'heart';    // หัวใจฟื้นชีวิต
    return 'oneup';                  // 🍀 1-UP เพิ่มหัวใจ (หายาก, ใหม่)
  }
};
