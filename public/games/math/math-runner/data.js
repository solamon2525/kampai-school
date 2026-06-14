/* data.js — คลังโจทย์และตัวสร้างสมการสำหรับ Math Runner */
window.GAME_DATA = {
  // ฟังก์ชันสุ่มตัวเลือกปลอกหลอก (Distractors) สำหรับ 3 เลน (1 ถูก, 2 ผิด)
  generateChoices: function(target) {
    const distractors = new Set();
    const targetStr = target.toString();
    
    // 1. สุ่มบวกหรือลบเล็กน้อย (เช่น ±1 ถึง ±5)
    while (distractors.size < 4) {
      const diff = Math.floor(Math.random() * 5) + 1;
      const sign = Math.random() < 0.5 ? 1 : -1;
      const fake = target + (diff * sign);
      if (fake > 0 && fake !== target) {
        distractors.add(fake);
      }
    }
    
    // 2. สุ่มแบบบวกสิบ (±10)
    const fakeTen = target + (Math.random() < 0.5 ? 10 : -10);
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
    while (distractors.size < 4) {
      const fake = target + fallback;
      if (fake > 0 && fake !== target) {
        distractors.add(fake);
      }
      fallback++;
    }

    // เอาเฉพาะตัวเลือกที่มีค่ามากกว่า 0
    const list = Array.from(distractors).filter(x => x > 0 && x !== target);
    
    // สุ่มหยิบมา 2 ตัวผสมกับ target เพื่อให้ได้ 3 ตัวเลือกสำหรับ 3 เลน
    const finalChoices = [target, list[0], list[1]];
    
    // สับการ์ดสลับตำแหน่ง (Shuffle)
    return finalChoices.sort(() => Math.random() - 0.5);
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

    // สร้างตัวเลือก 3 ตัว
    const choices = this.generateChoices(Target);

    return {
      A: A,
      B: B,
      Ans: Ans,
      Op: Op,
      Target: Target,
      displayStr: displayStr,
      choices: choices
    };
  }
};
