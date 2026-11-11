/* vowel-morph.js — นวัตกรรมสื่อการสอนสระแปลงร่างและสระลดรูป (Thai Vowel Morph Studio)
   สไตล์ PowerPoint Morph Animation 60 FPS แยกสีพยัญชนะต้น สระ ตัวสะกด และเสียงอ่านสะกดแจกลูก */

(function () {
  'use strict';

  // ─── 1. Web Audio API Magic Chime & Sound Synthesis ─────────────
  class MorphAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    }

    // เสียงตัวสะกดวิ่งเข้ามาชน (Whoosh/Swoosh)
    playWhoosh() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
      } catch (_) {}
    }

    // เสียงเวทมนตร์แปลงร่าง (Magic Sparkle Chime)
    playMagicSparkle() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const freqs = [659.25, 783.99, 987.77, 1318.51, 1567.98]; // E5, G5, B5, E6, G6
        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          const startTime = this.ctx.currentTime + idx * 0.06;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.22, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
      } catch (_) {}
    }

    // เสียงสำเร็จ (Fanfare Pop)
    playSuccess() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, this.ctx.currentTime + 0.15); // C6
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
      } catch (_) {}
    }
  }

  const morphSound = new MorphAudio();

  // ─── 2. Speech Synthesis สำหรับอ่านสะกดแจกลูกคำ ─────────────────
  function speakPhonics(text) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 0.85; // จังหวะชัดถ้อยชัดคำสำหรับเด็กประถม
      window.speechSynthesis.speak(utterance);
    }
  }

  // ─── 3. กฎการแปลงร่างและลดรูป (Rules Database) ─────────────────
  const MORPH_PRESETS = [
  {
    "id": "er_to_i",
    "vowelName": "สระเออ (เ-อ)",
    "ruleType": "สระเปลี่ยนรูป",
    "ruleDesc": "เมื่อมีตัวสะกดทั่วไป (ด, น, ก, บ, ม, ง) ตัว \"อ\" จะแปลงร่างลอยขึ้นไปเป็น \"สระอิ\" บนหัวพยัญชนะต้น",
    "vowelNameSpoken": "เออ",
    "baseForm": {
      "prefix": "เ",
      "suffix": "อ",
      "initial": "ก"
    },
    "animationType": "er_to_i",
    "initial": "ก",
    "initialName": "กอ",
    "final": "ด",
    "finalName": "ดอ",
    "finalChar": "ด",
    "finalWord": "เกิด",
    "phonicsSpelling": "กอ - เออ - ดอ = เกิด",
    "examples": [
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เกิด"
      },
      {
        "initial": "ด",
        "initialName": "ดอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เดิน"
      },
      {
        "initial": "ป",
        "initialName": "ปอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เปิด"
      },
      {
        "initial": "ล",
        "initialName": "ลอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "เลิก"
      },
      {
        "initial": "ง",
        "initialName": "งอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เงิน"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เกิน"
      },
      {
        "initial": "พล",
        "initialName": "พอ - ลอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เพลิน"
      },
      {
        "initial": "ช",
        "initialName": "ชอ",
        "final": "ญ",
        "finalName": "ยอ",
        "word": "เชิญ"
      },
      {
        "initial": "จร",
        "initialName": "จอ - รอ",
        "final": "ญ",
        "finalName": "ยอ",
        "word": "เจริญ"
      },
      {
        "initial": "ม",
        "initialName": "มอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เมิน"
      },
      {
        "initial": "ผ",
        "initialName": "ผอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เผิน"
      },
      {
        "initial": "น",
        "initialName": "นอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เนิน"
      },
      {
        "initial": "ต",
        "initialName": "ตอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "เติม"
      },
      {
        "initial": "ล",
        "initialName": "ลอ",
        "final": "ศ",
        "finalName": "สอ",
        "word": "เลิศ"
      },
      {
        "initial": "พล",
        "initialName": "พอ - ลอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "เพลิง"
      },
      {
        "initial": "สร",
        "initialName": "สอ - รอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "เสริม"
      },
      {
        "initial": "ผช",
        "initialName": "ผอ - ชอ",
        "final": "ญ",
        "finalName": "ยอ",
        "word": "เผชิญ"
      },
      {
        "initial": "พล",
        "initialName": "พอ - ลอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เพลิด"
      },
      {
        "initial": "ตล",
        "initialName": "ตอ - ลอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เตลิด"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เกริ่น"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เขิน"
      },
      {
        "initial": "ป",
        "initialName": "ปอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เปิ่น"
      },
      {
        "initial": "ย",
        "initialName": "ยอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เยิ่น"
      },
      {
        "initial": "น",
        "initialName": "นอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เนิ่น"
      },
      {
        "initial": "ฉ",
        "initialName": "ฉอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เฉิด"
      }
    ]
  },
  {
    "id": "er_to_y",
    "vowelName": "สระเออ (เ-อ) + แม่เกย",
    "ruleType": "สระลดรูป",
    "ruleDesc": "เมื่อมีตัวสะกดเป็นตัว \"ย\" ตัว \"อ\" จะลดรูปล่องหนหายไป เหลือเพียง สระเอ และตัว ย",
    "vowelNameSpoken": "เออ",
    "baseForm": {
      "prefix": "เ",
      "suffix": "อ",
      "initial": "ค"
    },
    "animationType": "er_to_y",
    "initial": "ค",
    "initialName": "คอ",
    "final": "ย",
    "finalName": "ยอ",
    "finalChar": "ย",
    "finalWord": "เคย",
    "phonicsSpelling": "คอ - เออ - ยอ = เคย",
    "examples": [
      {
        "initial": "ค",
        "initialName": "คอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เคย"
      },
      {
        "initial": "น",
        "initialName": "นอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เนย"
      },
      {
        "initial": "ล",
        "initialName": "ลอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เลย"
      },
      {
        "initial": "ต",
        "initialName": "ตอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เตย"
      },
      {
        "initial": "ช",
        "initialName": "ชอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เชย"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เกย"
      },
      {
        "initial": "ง",
        "initialName": "งอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เงย"
      },
      {
        "initial": "อ",
        "initialName": "ออ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เอย"
      },
      {
        "initial": "ผ",
        "initialName": "ผอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เผย"
      },
      {
        "initial": "ฉ",
        "initialName": "ฉอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เฉย"
      },
      {
        "initial": "ฉล",
        "initialName": "ฉอ - ลอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เฉลย"
      },
      {
        "initial": "สว",
        "initialName": "สอ - วอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เสวย"
      },
      {
        "initial": "สบ",
        "initialName": "สอ - บอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เสบย"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เขย"
      },
      {
        "initial": "ย้",
        "initialName": "ยอ - ้",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เย้ย"
      },
      {
        "initial": "ะเล",
        "initialName": "ะ - เ - ลอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "ละเลย"
      },
      {
        "initial": "อกเง",
        "initialName": "ออ - กอ - เ - งอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "งอกเงย"
      },
      {
        "initial": "ปิดเผ",
        "initialName": "ปอ - ิ - ดอ - เ - ผอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เปิดเผย"
      },
      {
        "initial": "ุ้นเค",
        "initialName": "ุ - ้ - นอ - เ - คอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "คุ้นเคย"
      },
      {
        "initial": "ฉยเม",
        "initialName": "ฉอ - ยอ - เ - มอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "เฉยเมย"
      }
    ]
  },
  {
    "id": "a_to_han",
    "vowelName": "สระอะ (-ะ)",
    "ruleType": "สระเปลี่ยนรูป",
    "ruleDesc": "เมื่อมีตัวสะกด สระ \"-ะ\" ด้านหลัง จะแปลงร่างลอยขึ้นไปเป็น \"ไม้หันอากาศ\" บนหัวพยัญชนะต้น",
    "vowelNameSpoken": "อะ",
    "baseForm": {
      "prefix": "",
      "suffix": "ะ",
      "initial": "ก"
    },
    "animationType": "a_to_han",
    "initial": "ก",
    "initialName": "กอ",
    "final": "น",
    "finalName": "นอ",
    "finalChar": "น",
    "finalWord": "กัน",
    "phonicsSpelling": "กอ - อะ - นอ = กัน",
    "examples": [
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "น",
        "finalName": "นอ",
        "word": "กัน"
      },
      {
        "initial": "ว",
        "initialName": "วอ",
        "final": "น",
        "finalName": "นอ",
        "word": "วัน"
      },
      {
        "initial": "พ",
        "initialName": "พอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "พัด"
      },
      {
        "initial": "จ",
        "initialName": "จอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "จับ"
      },
      {
        "initial": "ผ",
        "initialName": "ผอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "ผัก"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "ขัง"
      },
      {
        "initial": "จ",
        "initialName": "จอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "จัด"
      },
      {
        "initial": "ท",
        "initialName": "ทอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "ทัก"
      },
      {
        "initial": "น",
        "initialName": "นอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "นับ"
      },
      {
        "initial": "ร",
        "initialName": "รอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "รัก"
      },
      {
        "initial": "ล",
        "initialName": "ลอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "ลัง"
      },
      {
        "initial": "ว",
        "initialName": "วอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "วัด"
      },
      {
        "initial": "ส",
        "initialName": "สอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "สับ"
      },
      {
        "initial": "ฟ",
        "initialName": "ฟอ",
        "final": "น",
        "finalName": "นอ",
        "word": "ฟัน"
      },
      {
        "initial": "ขย",
        "initialName": "ขอ - ยอ",
        "final": "น",
        "finalName": "นอ",
        "word": "ขยัน"
      },
      {
        "initial": "หน",
        "initialName": "หอ - นอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "หนัก"
      },
      {
        "initial": "หล",
        "initialName": "หอ - ลอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "หลัง"
      },
      {
        "initial": "ช",
        "initialName": "ชอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "ชัด"
      },
      {
        "initial": "หล",
        "initialName": "หอ - ลอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "หลับ"
      },
      {
        "initial": "ร",
        "initialName": "รอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "รับ"
      },
      {
        "initial": "ช",
        "initialName": "ชอ",
        "final": "น",
        "finalName": "นอ",
        "word": "ชัน"
      },
      {
        "initial": "ผล",
        "initialName": "ผอ - ลอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "ผลัก"
      },
      {
        "initial": "ด",
        "initialName": "ดอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "ดับ"
      },
      {
        "initial": "บ",
        "initialName": "บอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "บัง"
      },
      {
        "initial": "ฝ",
        "initialName": "ฝอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "ฝัง"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "น",
        "finalName": "นอ",
        "word": "ขัน"
      },
      {
        "initial": "ค",
        "initialName": "คอ",
        "final": "น",
        "finalName": "นอ",
        "word": "คัน"
      },
      {
        "initial": "ท",
        "initialName": "ทอ",
        "final": "น",
        "finalName": "นอ",
        "word": "ทัน"
      },
      {
        "initial": "น",
        "initialName": "นอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "นัด"
      },
      {
        "initial": "พ",
        "initialName": "พอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "พัก"
      },
      {
        "initial": "ม",
        "initialName": "มอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "มัง"
      },
      {
        "initial": "ร",
        "initialName": "รอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "รัง"
      },
      {
        "initial": "ว",
        "initialName": "วอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "วัง"
      },
      {
        "initial": "ค",
        "initialName": "คอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "คัด"
      },
      {
        "initial": "ซ",
        "initialName": "ซอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "ซัก"
      }
    ]
  },
  {
    "id": "e_to_taikhu",
    "vowelName": "สระเอะ (เ-ะ)",
    "ruleType": "สระเปลี่ยนรูป",
    "ruleDesc": "เมื่อมีตัวสะกด สระ \"-ะ\" ด้านหลัง จะแปลงร่างลอยขึ้นไปเป็น \"ไม้ไต่คู้ (็)\" บนหัวพยัญชนะต้น",
    "vowelNameSpoken": "เอะ",
    "baseForm": {
      "prefix": "เ",
      "suffix": "ะ",
      "initial": "ป"
    },
    "animationType": "e_to_taikhu",
    "initial": "ป",
    "initialName": "ปอ",
    "final": "ด",
    "finalName": "ดอ",
    "finalChar": "ด",
    "finalWord": "เป็ด",
    "phonicsSpelling": "ปอ - เอะ - ดอ = เป็ด",
    "examples": [
      {
        "initial": "ป",
        "initialName": "ปอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เป็ด"
      },
      {
        "initial": "ล",
        "initialName": "ลอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "เล็ก"
      },
      {
        "initial": "ห",
        "initialName": "หอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เห็ด"
      },
      {
        "initial": "ย",
        "initialName": "ยอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "เย็บ"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "เข็ม"
      },
      {
        "initial": "ด",
        "initialName": "ดอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "เด็ก"
      },
      {
        "initial": "ค",
        "initialName": "คอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "เค็ม"
      },
      {
        "initial": "ม",
        "initialName": "มอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เม็ด"
      },
      {
        "initial": "ช",
        "initialName": "ชอ",
        "final": "ค",
        "finalName": "คอ",
        "word": "เช็ค"
      },
      {
        "initial": "ช",
        "initialName": "ชอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เช็ด"
      },
      {
        "initial": "ร",
        "initialName": "รอ",
        "final": "ว",
        "finalName": "วอ",
        "word": "เร็ว"
      },
      {
        "initial": "ท",
        "initialName": "ทอ",
        "final": "จ",
        "finalName": "จอ",
        "word": "เท็จ"
      },
      {
        "initial": "ต",
        "initialName": "ตอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "เต็ม"
      },
      {
        "initial": "ย",
        "initialName": "ยอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เย็น"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "เก็บ"
      },
      {
        "initial": "สร",
        "initialName": "สอ - รอ",
        "final": "จ",
        "finalName": "จอ",
        "word": "เสร็จ"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "ญ",
        "finalName": "ยอ",
        "word": "เข็ญ"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เข็น"
      },
      {
        "initial": "ผ",
        "initialName": "ผอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เผ็ด"
      },
      {
        "initial": "ล",
        "initialName": "ลอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "เล็บ"
      },
      {
        "initial": "ต",
        "initialName": "ตอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "เต็ง"
      },
      {
        "initial": "ซ",
        "initialName": "ซอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "เซ็ง"
      },
      {
        "initial": "กร",
        "initialName": "กอ - รอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "เกร็ง"
      },
      {
        "initial": "บ",
        "initialName": "บอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เบ็ด"
      },
      {
        "initial": "ล",
        "initialName": "ลอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "เล็ง"
      },
      {
        "initial": "หม",
        "initialName": "หอ - มอ",
        "final": "น",
        "finalName": "นอ",
        "word": "เหม็น"
      },
      {
        "initial": "ป",
        "initialName": "ปอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "เป๊ก"
      },
      {
        "initial": "อ",
        "initialName": "ออ",
        "final": "ง",
        "finalName": "งอ",
        "word": "เอ็ง"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "เข็ด"
      },
      {
        "initial": "พ",
        "initialName": "พอ",
        "final": "ฌ",
        "finalName": "ชอ",
        "word": "เพชฌ"
      }
    ]
  },
  {
    "id": "ae_to_taikhu",
    "vowelName": "สระแอะ (แ-ะ)",
    "ruleType": "สระเปลี่ยนรูป",
    "ruleDesc": "เมื่อมีตัวสะกด สระ \"-ะ\" ด้านหลัง จะแปลงร่างลอยขึ้นไปเป็น \"ไม้ไต่คู้ (็)\" บนหัวพยัญชนะต้น",
    "vowelNameSpoken": "แอะ",
    "baseForm": {
      "prefix": "แ",
      "suffix": "ะ",
      "initial": "ข"
    },
    "animationType": "ae_to_taikhu",
    "initial": "ข",
    "initialName": "ขอ",
    "final": "ง",
    "finalName": "งอ",
    "finalChar": "ง",
    "finalWord": "แข็ง",
    "phonicsSpelling": "ขอ - แอะ - งอ = แข็ง",
    "examples": [
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "แข็ง"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "แก็ง"
      },
      {
        "initial": "กร",
        "initialName": "กอ - รอ",
        "final": "น",
        "finalName": "นอ",
        "word": "แกร็น"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "แข็งแรง"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "แกร่ง"
      },
      {
        "initial": "ค",
        "initialName": "คอ",
        "final": "น",
        "finalName": "นอ",
        "word": "แค่น"
      },
      {
        "initial": "น",
        "initialName": "นอ",
        "final": "น",
        "finalName": "นอ",
        "word": "แน่น"
      },
      {
        "initial": "ต",
        "initialName": "ตอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "แต้ม"
      },
      {
        "initial": "ย",
        "initialName": "ยอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "แย้ม"
      },
      {
        "initial": "ม",
        "initialName": "มอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "แม็ก"
      },
      {
        "initial": "ป",
        "initialName": "ปอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "แป๊ก"
      },
      {
        "initial": "จ",
        "initialName": "จอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "แจ๊ก"
      },
      {
        "initial": "ป",
        "initialName": "ปอ",
        "final": "ะ",
        "finalName": "ะ",
        "word": "แป๊ะ"
      },
      {
        "initial": "ว",
        "initialName": "วอ",
        "final": "น",
        "finalName": "นอ",
        "word": "แว่น"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "น",
        "finalName": "นอ",
        "word": "แก่น"
      }
    ]
  },
  {
    "id": "o_reduce",
    "vowelName": "สระโอะ (โ-ะ)",
    "ruleType": "สระลดรูป (หมดรูป)",
    "ruleDesc": "เมื่อมีตัวสะกด สระ \"โ-ะ\" จะลดรูปหายไปทั้งหมด เหลือเพียงพยัญชนะต้นกับตัวสะกด",
    "vowelNameSpoken": "โอะ",
    "baseForm": {
      "prefix": "โ",
      "suffix": "ะ",
      "initial": "น"
    },
    "animationType": "o_reduce",
    "initial": "น",
    "initialName": "นอ",
    "final": "ก",
    "finalName": "กอ",
    "finalChar": "ก",
    "finalWord": "นก",
    "phonicsSpelling": "นอ - โอะ - กอ = นก",
    "examples": [
      {
        "initial": "น",
        "initialName": "นอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "นก"
      },
      {
        "initial": "ล",
        "initialName": "ลอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "ลม"
      },
      {
        "initial": "ม",
        "initialName": "มอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "มด"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "กบ"
      },
      {
        "initial": "ฝ",
        "initialName": "ฝอ",
        "final": "น",
        "finalName": "นอ",
        "word": "ฝน"
      },
      {
        "initial": "ค",
        "initialName": "คอ",
        "final": "น",
        "finalName": "นอ",
        "word": "คน"
      },
      {
        "initial": "จ",
        "initialName": "จอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "จด"
      },
      {
        "initial": "ต",
        "initialName": "ตอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "ตก"
      },
      {
        "initial": "ช",
        "initialName": "ชอ",
        "final": "น",
        "finalName": "นอ",
        "word": "ชน"
      },
      {
        "initial": "ผ",
        "initialName": "ผอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "ผม"
      },
      {
        "initial": "ล",
        "initialName": "ลอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "ลด"
      },
      {
        "initial": "ย",
        "initialName": "ยอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "ยก"
      },
      {
        "initial": "ร",
        "initialName": "รอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "รบ"
      },
      {
        "initial": "พ",
        "initialName": "พอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "พบ"
      },
      {
        "initial": "ส",
        "initialName": "สอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "สด"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "กด"
      },
      {
        "initial": "ค",
        "initialName": "คอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "คด"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "ขม"
      },
      {
        "initial": "ช",
        "initialName": "ชอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "ชม"
      },
      {
        "initial": "จ",
        "initialName": "จอ",
        "final": "น",
        "finalName": "นอ",
        "word": "จน"
      },
      {
        "initial": "ล",
        "initialName": "ลอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "ลง"
      },
      {
        "initial": "ว",
        "initialName": "วอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "วง"
      },
      {
        "initial": "บ",
        "initialName": "บอ",
        "final": "น",
        "finalName": "นอ",
        "word": "บน"
      },
      {
        "initial": "ซ",
        "initialName": "ซอ",
        "final": "น",
        "finalName": "นอ",
        "word": "ซน"
      },
      {
        "initial": "ซ",
        "initialName": "ซอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "ซด"
      },
      {
        "initial": "น",
        "initialName": "นอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "นม"
      },
      {
        "initial": "ธ",
        "initialName": "ทอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "ธง"
      },
      {
        "initial": "พ",
        "initialName": "พอ",
        "final": "ล",
        "finalName": "ลอ",
        "word": "พล"
      },
      {
        "initial": "ร",
        "initialName": "รอ",
        "final": "ส",
        "finalName": "สอ",
        "word": "รส"
      },
      {
        "initial": "ศ",
        "initialName": "สอ",
        "final": "พ",
        "finalName": "พอ",
        "word": "ศพ"
      },
      {
        "initial": "กร",
        "initialName": "กอ - รอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "กรง"
      },
      {
        "initial": "ตร",
        "initialName": "ตอ - รอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "ตรง"
      },
      {
        "initial": "ปล",
        "initialName": "ปอ - ลอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "ปลด"
      },
      {
        "initial": "หม",
        "initialName": "หอ - มอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "หมด"
      },
      {
        "initial": "ทร",
        "initialName": "ทอ - รอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "ทรง"
      }
    ]
  },
  {
    "id": "ua_reduce",
    "vowelName": "สระอัว (-ัว)",
    "ruleType": "สระลดรูป",
    "ruleDesc": "เมื่อมีตัวสะกด ไม้หันอากาศ (-ั) บนหัวจะลดรูปหายไป เหลือเพียงตัว \"ว\"",
    "vowelNameSpoken": "อัว",
    "baseForm": {
      "prefix": "",
      "upper": "ั",
      "suffix": "ว",
      "initial": "ข"
    },
    "animationType": "ua_reduce",
    "initial": "ข",
    "initialName": "ขอ",
    "final": "ด",
    "finalName": "ดอ",
    "finalChar": "ด",
    "finalWord": "ขวด",
    "phonicsSpelling": "ขอ - อัว - ดอ = ขวด",
    "examples": [
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "ขวด"
      },
      {
        "initial": "ส",
        "initialName": "สอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "สวย"
      },
      {
        "initial": "ร",
        "initialName": "รอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "รวย"
      },
      {
        "initial": "ป",
        "initialName": "ปอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "ปวด"
      },
      {
        "initial": "ด",
        "initialName": "ดอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "ดวง"
      },
      {
        "initial": "ช",
        "initialName": "ชอ",
        "final": "น",
        "finalName": "นอ",
        "word": "ชวน"
      },
      {
        "initial": "บ",
        "initialName": "บอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "บวม"
      },
      {
        "initial": "ร",
        "initialName": "รอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "รวม"
      },
      {
        "initial": "ส",
        "initialName": "สอ",
        "final": "น",
        "finalName": "นอ",
        "word": "สวน"
      },
      {
        "initial": "ส",
        "initialName": "สอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "สวม"
      },
      {
        "initial": "บ",
        "initialName": "บอ",
        "final": "บ",
        "finalName": "บอ",
        "word": "บวบ"
      },
      {
        "initial": "ม",
        "initialName": "มอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "มวย"
      },
      {
        "initial": "น",
        "initialName": "นอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "นวด"
      },
      {
        "initial": "ปล",
        "initialName": "ปอ - ลอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "ปลวก"
      },
      {
        "initial": "พ",
        "initialName": "พอ",
        "final": "ก",
        "finalName": "กอ",
        "word": "พวก"
      },
      {
        "initial": "ตร",
        "initialName": "ตอ - รอ",
        "final": "จ",
        "finalName": "จอ",
        "word": "ตรวจ"
      },
      {
        "initial": "หล",
        "initialName": "หอ - ลอ",
        "final": "ม",
        "finalName": "มอ",
        "word": "หลวม"
      },
      {
        "initial": "กร",
        "initialName": "กอ - รอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "กรวด"
      },
      {
        "initial": "กร",
        "initialName": "กอ - รอ",
        "final": "ย",
        "finalName": "ยอ",
        "word": "กรวย"
      },
      {
        "initial": "พล",
        "initialName": "พอ - ลอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "พลวง"
      },
      {
        "initial": "ทร",
        "initialName": "ทอ - รอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "ทรวง"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "ด",
        "finalName": "ดอ",
        "word": "กวด"
      },
      {
        "initial": "ข",
        "initialName": "ขอ",
        "final": "น",
        "finalName": "นอ",
        "word": "ขวน"
      },
      {
        "initial": "ค",
        "initialName": "คอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "ควร"
      },
      {
        "initial": "ค",
        "initialName": "คอ",
        "final": "ง",
        "finalName": "งอ",
        "word": "ควง"
      }
    ]
  },
  {
    "id": "or_reduce",
    "vowelName": "สระออ (-อ + ร)",
    "ruleType": "สระลดรูป",
    "ruleDesc": "เมื่อมีตัวสะกดเป็นตัว \"ร\" ตัว \"อ\" จะลดรูปหายไป เหลือเพียงพยัญชนะต้นกับตัว ร",
    "vowelNameSpoken": "ออ",
    "baseForm": {
      "prefix": "",
      "suffix": "อ",
      "initial": "พ"
    },
    "animationType": "or_reduce",
    "initial": "พ",
    "initialName": "พอ",
    "final": "ร",
    "finalName": "รอ",
    "finalChar": "ร",
    "finalWord": "พร",
    "phonicsSpelling": "พอ - ออ - รอ = พร",
    "examples": [
      {
        "initial": "พ",
        "initialName": "พอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "พร"
      },
      {
        "initial": "ศ",
        "initialName": "สอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "ศร"
      },
      {
        "initial": "จ",
        "initialName": "จอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "จร"
      },
      {
        "initial": "ก",
        "initialName": "กอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "กร"
      },
      {
        "initial": "น",
        "initialName": "นอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "นร"
      },
      {
        "initial": "ละค",
        "initialName": "ลอ - ะ - คอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "ละคร"
      },
      {
        "initial": "เกส",
        "initialName": "เ - กอ - สอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "เกสร"
      },
      {
        "initial": "วาน",
        "initialName": "วอ - า - นอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "วานร"
      },
      {
        "initial": "จรล",
        "initialName": "จอ - รอ - ลอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "จรลี"
      },
      {
        "initial": "บว",
        "initialName": "บอ - วอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "บวร"
      },
      {
        "initial": "มรณ",
        "initialName": "มอ - รอ - นอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "มรณา"
      },
      {
        "initial": "อัมพ",
        "initialName": "ออ - ั - มอ - พอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "อัมพร"
      },
      {
        "initial": "ขจ",
        "initialName": "ขอ - จอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "ขจร"
      },
      {
        "initial": "นค",
        "initialName": "นอ - คอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "นคร"
      },
      {
        "initial": "กำจ",
        "initialName": "กอ - ำ - จอ",
        "final": "ร",
        "finalName": "รอ",
        "word": "กำจร"
      }
    ]
  }
];

  // ค้นหากฎจากคำศัพท์
  function findMorphRuleForWord(wordStr) {
    if (!wordStr) return null;
    const clean = wordStr.trim();
    for (const rule of MORPH_PRESETS) {
      const match = rule.examples.find(e => e.word === clean);
      if (match) {
        return { rule, match };
      }
    }
    // Heuristic pattern checks
    if (/^[ก-ฮ]ิ[ก-ฮ]$/.test(clean)) return { rule: MORPH_PRESETS[0], match: null }; // เ-อ -> เ-ิ
    if (/^[ก-ฮ]ั[ก-ฮ]$/.test(clean)) return { rule: MORPH_PRESETS[2], match: null }; // -ะ -> -ั
    if (/^เ[ก-ฮ]็[ก-ฮ]$/.test(clean)) return { rule: MORPH_PRESETS[3], match: null }; // เ-ะ -> เ-็
    if (/^แ[ก-ฮ]็[ก-ฮ]$/.test(clean)) return { rule: MORPH_PRESETS[4], match: null }; // แ-ะ -> แ-็
    if (/^[ก-ฮ][ก-ฮ]$/.test(clean)) return { rule: MORPH_PRESETS[5], match: null }; // โ-ะ ลดรูป
    if (/^[ก-ฮ]ว[ก-ฮ]$/.test(clean)) return { rule: MORPH_PRESETS[6], match: null }; // -ัว ลดรูป
    return null;
  }

  // ─── 4. State Management ของโรงละครสระแปลงร่าง ─────────────────
  let currentPresetIndex = 0;
  let currentExampleIndex = 0;
  let currentStep = 1; // 1: Base, 2: Final Consonant In, 3: Morphing/Morphed
  let autoPlayTimer = null;

  // ─── 5. UI Builder: สร้างหน้าต่างโรงละคร (Morph Theater Modal) ──
  function ensureMorphModal() {
    let modal = document.getElementById('tvh-morph-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tvh-morph-modal';
      modal.className = 'tvh-modal-backdrop morph-theater-backdrop';
      modal.innerHTML = `
        <div class="tvh-modal-card morph-theater-card" role="dialog" aria-modal="true" aria-labelledby="morph-theater-title">
          {/* Header */}
          <div class="morph-theater-header">
            <div class="morph-header-left">
              <span class="morph-pill-badge">นวัตกรรมสื่อการสอน</span>
              <h2 id="morph-theater-title" class="morph-title">✨ สระแปลงร่าง & สระลดรูป</h2>
            </div>
            <div class="morph-header-right">
              <button type="button" class="btn-morph-tool" id="btn-morph-audio-toggle" title="เปิด/ปิดเสียง">🔊 เสียง</button>
              <button type="button" class="tvh-modal-close" onclick="window.ThaiVowelMorph.close()">×</button>
            </div>
          </div>

          {/* Preset Selector Tabs */}
          <div class="morph-preset-bar" role="tablist" aria-label="เลือกสระแปลงร่าง">
            ${MORPH_PRESETS.map((p, idx) => `
              <button type="button" class="morph-preset-tab ${idx === 0 ? 'active' : ''}"
                      data-idx="${idx}" onclick="window.ThaiVowelMorph.selectPreset(${idx})">
                ${p.vowelName}
              </button>
            `).join('')}
          </div>

          {/* Rule Information Banner */}
          <div class="morph-rule-banner">
            <div class="morph-rule-badge" id="morph-rule-type">สระเปลี่ยนรูป</div>
            <div class="morph-rule-desc" id="morph-rule-desc">
              เมื่อมีตัวสะกด ตัว "อ" จะแปลงร่างลอยขึ้นไปเป็น "สระอิ" บนหัวพยัญชนะต้น
            </div>
          </div>

          {/* ═══ THEATER STAGE (จอใหญ่ 120px+) ═══ */}
          <div class="morph-stage-wrapper">
            <div class="morph-stage-screen" id="morph-stage-screen">
              {/* Dynamic Animated Content Injected Here */}
            </div>

            {/* Phonics Equation Subtitle */}
            <div class="morph-equation-box" id="morph-equation-box">
              <span id="eq-spelling" class="eq-spelling">กอ - เออ - ดอ = เกิด</span>
              <button type="button" class="btn-voice-pill" onclick="window.ThaiVowelMorph.speakCurrent()">
                🔊 ฟังเสียงแจกลูก
              </button>
            </div>
          </div>

          {/* Examples Quick Buttons */}
          <div class="morph-examples-row">
            <span class="morph-ex-label">คำตัวอย่าง:</span>
            <div id="morph-examples-chips" class="morph-examples-chips"></div>
          </div>

          {/* Controls Footer */}
          <div class="morph-theater-footer">
            <div class="morph-step-indicator" id="morph-step-indicator">
              <span class="step-dot active">1. พยัญชนะ+สระ</span>
              <span class="step-arrow">➔</span>
              <span class="step-dot">2. ตัวสะกดเข้า</span>
              <span class="step-arrow">➔</span>
              <span class="step-dot">3. แปลงร่าง! ✨</span>
            </div>

            <div class="morph-footer-actions">
              <button type="button" class="cbtn" onclick="window.ThaiVowelMorph.resetStep()">↺ ตั้งต้นใหม่</button>
              <button type="button" class="btn btn-primary btn-morph-next" id="btn-morph-next" onclick="window.ThaiVowelMorph.nextStep()">
                ก้าวต่อไป ▶ (Spacebar)
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Sound toggle
      const audioBtn = document.getElementById('btn-morph-audio-toggle');
      if (audioBtn) {
        audioBtn.addEventListener('click', () => {
          morphSound.enabled = !morphSound.enabled;
          audioBtn.textContent = morphSound.enabled ? '🔊 เสียง' : '🔇 ปิดเสียง';
        });
      }

      // Keyboard navigation
      window.addEventListener('keydown', (e) => {
        if (modal.style.display !== 'flex') return;
        if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          window.ThaiVowelMorph.nextStep();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          window.ThaiVowelMorph.prevStep();
        } else if (e.key === 'Escape') {
          window.ThaiVowelMorph.close();
        }
      });
    }
  }

  // ─── 6. Stage Renderer (เรนเดอร์ตัวอักษรและแอนิเมชันตามขั้นตอน) ────
  function renderStage() {
    const stage = document.getElementById('morph-stage-screen');
    const eqBox = document.getElementById('eq-spelling');
    const stepInd = document.getElementById('morph-step-indicator');
    const ruleType = document.getElementById('morph-rule-type');
    const ruleDesc = document.getElementById('morph-rule-desc');
    const nextBtn = document.getElementById('btn-morph-next');
    if (!stage) return;

    const preset = MORPH_PRESETS[currentPresetIndex];
    const example = preset.examples[currentExampleIndex] || preset.examples[0];
    const initial = example.initial;
    const finalC = example.final;
    const targetWord = example.word;

    // Update rule info
    if (ruleType) ruleType.textContent = preset.ruleType;
    if (ruleDesc) ruleDesc.textContent = preset.ruleDesc;

    // Update Step Indicators
    if (stepInd) {
      const dots = stepInd.querySelectorAll('.step-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentStep - 1);
      });
    }

    if (nextBtn) {
      if (currentStep === 1) nextBtn.innerHTML = 'ตัวสะกดเข้ามา ➔ (Spacebar)';
      else if (currentStep === 2) nextBtn.innerHTML = 'แปลงร่าง! ✨ (Spacebar)';
      else nextBtn.innerHTML = 'คำถัดไป 🔄 (Spacebar)';
    }

    // Phonics readout text
    const spellingText = `${example.initialName} - ${preset.vowelNameSpoken} - ${example.finalName} = ${targetWord}`;
    if (eqBox) eqBox.textContent = spellingText;

    // ═══ RENDER STEP 1: BASE (Initial Consonant + Vowel) ═══
    if (currentStep === 1) {
      stage.innerHTML = `
        <div class="morph-char-group step-1">
          ${preset.baseForm.prefix ? `<span class="char-vowel char-prefix">${preset.baseForm.prefix}</span>` : ''}
          <div class="char-initial-slot">
            ${preset.baseForm.upper ? `<span class="char-vowel char-upper-base">${preset.baseForm.upper}</span>` : ''}
            <span class="char-initial">${initial}</span>
          </div>
          ${preset.baseForm.suffix ? `<span class="char-vowel char-suffix-base" id="morph-suffix">${preset.baseForm.suffix}</span>` : ''}
        </div>
      `;
    }

    // ═══ RENDER STEP 2: APPROACH (Final Consonant Enters in Blue) ═══
    else if (currentStep === 2) {
      morphSound.playWhoosh();
      stage.innerHTML = `
        <div class="morph-char-group step-2">
          ${preset.baseForm.prefix ? `<span class="char-vowel char-prefix">${preset.baseForm.prefix}</span>` : ''}
          <div class="char-initial-slot">
            ${preset.baseForm.upper ? `<span class="char-vowel char-upper-base">${preset.baseForm.upper}</span>` : ''}
            <span class="char-initial">${initial}</span>
          </div>
          ${preset.baseForm.suffix ? `<span class="char-vowel char-suffix-base" id="morph-suffix">${preset.baseForm.suffix}</span>` : ''}
          <span class="char-final char-incoming animate-slide-in">${finalC}</span>
        </div>
      `;
    }

    // ═══ RENDER STEP 3: MORPH ANIMATION & RESOLUTION ═══
    else if (currentStep === 3) {
      morphSound.playMagicSparkle();

      // Render based on animation rule
      if (preset.animationType === 'er_to_i') {
        // เ-อ + ตัวสะกด -> เ-ิ (อ ลอยขึ้นเป็น สระอิ)
        stage.innerHTML = `
          <div class="morph-char-group step-3 morphing">
            <span class="char-vowel char-prefix animate-pulse-soft">เ</span>
            <div class="char-initial-slot">
              <span class="char-vowel char-morphed-top animate-fly-up-i">ิ</span>
              <span class="char-initial">${initial}</span>
            </div>
            <span class="char-final">${finalC}</span>
          </div>
        `;
      } else if (preset.animationType === 'er_to_y') {
        // เ-อ + ย -> เ-ย (อ หดหายไป)
        stage.innerHTML = `
          <div class="morph-char-group step-3 morphing">
            <span class="char-vowel char-prefix">เ</span>
            <div class="char-initial-slot">
              <span class="char-initial">${initial}</span>
            </div>
            <span class="char-final animate-pop-in">${finalC}</span>
          </div>
        `;
      } else if (preset.animationType === 'a_to_han') {
        // -ะ -> -ั (ลอยขึ้นเป็น ไม้หันอากาศ)
        stage.innerHTML = `
          <div class="morph-char-group step-3 morphing">
            <div class="char-initial-slot">
              <span class="char-vowel char-morphed-top animate-fly-up-han">ั</span>
              <span class="char-initial">${initial}</span>
            </div>
            <span class="char-final">${finalC}</span>
          </div>
        `;
      } else if (preset.animationType === 'e_to_taikhu') {
        // เ-ะ -> เ-็ (ะ ลอยขึ้นเป็น ไม้ไต่คู้)
        stage.innerHTML = `
          <div class="morph-char-group step-3 morphing">
            <span class="char-vowel char-prefix">เ</span>
            <div class="char-initial-slot">
              <span class="char-vowel char-morphed-top animate-fly-up-taikhu">็</span>
              <span class="char-initial">${initial}</span>
            </div>
            <span class="char-final">${finalC}</span>
          </div>
        `;
      } else if (preset.animationType === 'ae_to_taikhu') {
        // แ-ะ -> แ-็
        stage.innerHTML = `
          <div class="morph-char-group step-3 morphing">
            <span class="char-vowel char-prefix">แ</span>
            <div class="char-initial-slot">
              <span class="char-vowel char-morphed-top animate-fly-up-taikhu">็</span>
              <span class="char-initial">${initial}</span>
            </div>
            <span class="char-final">${finalC}</span>
          </div>
        `;
      } else if (preset.animationType === 'o_reduce') {
        // โ-ะ ลดรูปหมด
        stage.innerHTML = `
          <div class="morph-char-group step-3 morphing">
            <div class="char-initial-slot">
              <span class="char-initial">${initial}</span>
            </div>
            <span class="char-final">${finalC}</span>
          </div>
        `;
      } else if (preset.animationType === 'ua_reduce') {
        // -ัว ลดรูป (ไม้หันอากาศหาย)
        stage.innerHTML = `
          <div class="morph-char-group step-3 morphing">
            <div class="char-initial-slot">
              <span class="char-initial">${initial}</span>
            </div>
            <span class="char-vowel char-suffix-base">ว</span>
            <span class="char-final">${finalC}</span>
          </div>
        `;
      } else if (preset.animationType === 'or_reduce') {
        // -อ + ร -> อ หาย
        stage.innerHTML = `
          <div class="morph-char-group step-3 morphing">
            <div class="char-initial-slot">
              <span class="char-initial">${initial}</span>
            </div>
            <span class="char-final">${finalC}</span>
          </div>
        `;
      }

      // Voice read out on resolution
      speakPhonics(spellingText);
    }
  }

  // ─── 7. Render Example Chips ──────────────────────────────────
  function renderExampleChips() {
    const chipsWrap = document.getElementById('morph-examples-chips');
    if (!chipsWrap) return;
    const preset = MORPH_PRESETS[currentPresetIndex];
    const labelEl = document.querySelector('.morph-ex-label');
    if (labelEl) labelEl.textContent = `คำตัวอย่าง (${preset.examples.length} คำ):`;
    chipsWrap.innerHTML = preset.examples.map((ex, idx) => `
      <button type="button" class="morph-chip ${idx === currentExampleIndex ? 'active' : ''}"
              onclick="window.ThaiVowelMorph.selectExample(${idx})">
        ${ex.word}
      </button>
    `).join('');
    const activeChip = chipsWrap.querySelector('.morph-chip.active');
    if (activeChip && typeof activeChip.scrollIntoView === 'function') {
      try {
        activeChip.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      } catch (e) {}
    }
  }

  // ─── 8. Public API ─────────────────────────────────────────────
  window.ThaiVowelMorph = {
    getPresets() {
      return MORPH_PRESETS;
    },
    getCurrentWord() {
      const p = MORPH_PRESETS[currentPresetIndex];
      const ex = p?.examples[currentExampleIndex];
      return ex ? ex.word : '';
    },
    open(targetWord) {
      ensureMorphModal();
      const modal = document.getElementById('tvh-morph-modal');
      if (modal) modal.style.display = 'flex';

      // If specific word requested, jump to its preset
      if (targetWord) {
        const found = findMorphRuleForWord(targetWord);
        if (found) {
          const pIdx = MORPH_PRESETS.findIndex(p => p.id === found.rule.id);
          if (pIdx >= 0) currentPresetIndex = pIdx;
          if (found.match) {
            const eIdx = found.rule.examples.findIndex(e => e.word === found.match.word);
            if (eIdx >= 0) currentExampleIndex = eIdx;
          }
        }
      }

      this.updateTabs();
      this.resetStep();
    },

    close() {
      const modal = document.getElementById('tvh-morph-modal');
      if (modal) modal.style.display = 'none';
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },

    selectPreset(idx) {
      currentPresetIndex = idx;
      currentExampleIndex = 0;
      this.updateTabs();
      this.resetStep();
    },

    selectExample(idx) {
      currentExampleIndex = idx;
      renderExampleChips();
      this.resetStep();
    },

    updateTabs() {
      const tabs = document.querySelectorAll('.morph-preset-tab');
      tabs.forEach((t, i) => {
        t.classList.toggle('active', i === currentPresetIndex);
      });
      renderExampleChips();
    },

    nextStep() {
      if (currentStep < 3) {
        currentStep++;
        renderStage();
      } else {
        // Move to next example
        const preset = MORPH_PRESETS[currentPresetIndex];
        currentExampleIndex = (currentExampleIndex + 1) % preset.examples.length;
        renderExampleChips();
        this.resetStep();
      }
    },

    prevStep() {
      if (currentStep > 1) {
        currentStep--;
        renderStage();
      }
    },

    resetStep() {
      currentStep = 1;
      renderStage();
    },

    speakCurrent() {
      const preset = MORPH_PRESETS[currentPresetIndex];
      const example = preset.examples[currentExampleIndex] || preset.examples[0];
      const spelling = `${example.initialName} - ${preset.vowelNameSpoken} - ${example.finalName} = ${example.word}`;
      speakPhonics(spelling);
    },

    // Utility: ตรวจสอบว่าคำในระบบเป็นสระแปลงร่างหรือไม่
    isMorphWord(word) {
      return Boolean(findMorphRuleForWord(word));
    },
  };
})();
