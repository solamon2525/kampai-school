/* sound-twins.js — วงล้อคำพ้องเสียงต่างรูปสะกด (Sound Twin Matrix) & ลานประลองปราสาท 4 ตระกูลเสียง
   นวัตกรรมสื่อการสอนและเกมประลอง:
   1. วงล้อคำพ้องเสียงต่างรูปสะกด (Sound Twin Matrix): รวมตระกูลคำเสียงเหมือนแต่เขียนต่างรูป (กาน, พุด, บาด, สัน, พัน, กด, จัน, บด)
   2. ลานประลองปราสาท 4 ตระกูลเสียง (4 Castles Challenge): ส่งคำศัพท์เข้าปราสาทแม่กด (ส้ม), แม่กน (เขียว), แม่กบ (ม่วง), แม่กก (แดง)
*/

(function () {
  'use strict';

  // ─── 1. Web Audio Synthesizer (Chime, Buzz, Pop) ─────────────────
  class SoundTwinsAudio {
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

    // เสียงยินดีเมื่อตอบถูก (Pleasant Sparkle Arpeggio C5-E5-G5-C6)
    playCorrect() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          const startTime = this.ctx.currentTime + idx * 0.07;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.2, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
      } catch (_) {}
    }

    // เสียงตอบผิดแบบนุ่มนวล ไม่ทำให้เด็กตกใจ (Gentle Descending Buzz)
    playWrong() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
      } catch (_) {}
    }

    // เสียงกดปุ่มทั่วไป
    playClick() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
      } catch (_) {}
    }
  }

  const audioFx = new SoundTwinsAudio();

  // ─── 2. Speech Synthesis ─────────────────────────────────────────
  function speakThai(text) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'th-TH';
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  }

  // ─── 3. Curated Sound Twin Families ──────────────────────────────
  const CURATED_TWIN_FAMILIES = {
    'กาน': {
      key: 'กาน',
      sound: 'กาน',
      section: 'kon',
      sectionName: 'แม่กน',
      soundBadge: '[กาน] แม่กน (เสียง น สะกด)',
      explanation: 'ทุกคำออกเสียง "กาน" เหมือนกัน แต่ใช้ตัวสะกดต่างรูปและมีความหมายแตกต่างกันอย่างสิ้นเชิง',
      twins: [
        { word: 'การ', surfaceConsonant: 'ร', soundConsonant: 'น', meaning: 'งาน, กิจการ, การบ้าน เช่น ทำการบ้าน, ทำการงาน', emoji: '💼' },
        { word: 'กาล', surfaceConsonant: 'ล', soundConsonant: 'น', meaning: 'เวลา, วาระ เช่น กาลเวลา, กาลครั้งหนึ่ง, โบราณกาล', emoji: '⏳' },
        { word: 'กาฬ', surfaceConsonant: 'ฬ', soundConsonant: 'น', meaning: 'ดำ, ร้ายแรง เช่น โรคกาฬ, นิลกาฬ, กาฬสินธุ์', emoji: '🖤' },
        { word: 'กานต์', surfaceConsonant: 'น', soundConsonant: 'น', meaning: 'เป็นที่รัก, น่าพึงใจ เช่น ทิพยกานต์, กานดา', emoji: '💖' },
        { word: 'กาน', surfaceConsonant: 'น', soundConsonant: 'น', meaning: 'ตัดแต่งกิ่งไม้ให้โปร่ง เช่น กานกิ่งไม้', emoji: '✂️' }
      ]
    },
    'พุด': {
      key: 'พุด',
      sound: 'พุด',
      section: 'kod',
      sectionName: 'แม่กด',
      soundBadge: '[พุด] แม่กด (เสียง ด สะกด)',
      explanation: 'ทุกคำออกเสียง "พุด" เหมือนกัน แต่สะกดด้วย ธ หรือ ด ตามรากศัพท์และความหมาย',
      twins: [
        { word: 'พุธ', surfaceConsonant: 'ธ', soundConsonant: 'ด', meaning: 'ชื่อดาวเคราะห์ และวันที่ ๔ ของสัปดาห์ เช่น วันพุธ', emoji: '🪐' },
        { word: 'พุทธ', surfaceConsonant: 'ธ', soundConsonant: 'ด', meaning: 'ผู้ตรัสรู้, ศาสนาพุทธ, พระพุทธรูป', emoji: '🙏' },
        { word: 'พุด', surfaceConsonant: 'ด', soundConsonant: 'ด', meaning: 'ชื่อไม้พุ่ม ดอกสีขาว กลิ่นหอม เช่น ดอกพุด', emoji: '🌸' }
      ]
    },
    'บาด': {
      key: 'บาด',
      sound: 'บาด',
      section: 'kod',
      sectionName: 'แม่กด',
      soundBadge: '[บาด] แม่กด (เสียง ด สะกด)',
      explanation: 'ทุกคำออกเสียง "บาด" แต่เขียนต่างรูป ท, ตร, ด ซึ่งสะท้อนความหมายเฉพาะ',
      twins: [
        { word: 'บาท', surfaceConsonant: 'ท', soundConsonant: 'ด', meaning: 'เงินตราสกุลไทย (๑ บาท) หรือ ฝ่าเท้า (รอยพระพุทธบาท)', emoji: '🪙' },
        { word: 'บาตร', surfaceConsonant: 'ตร', soundConsonant: 'ด', meaning: 'ภาชนะรับอาหารของพระภิกษุสงฆ์ เช่น บิณฑบาต, บาตรพระ', emoji: '🥣' },
        { word: 'บาด', surfaceConsonant: 'ด', soundConsonant: 'ด', meaning: 'ทำให้เกิดแผลด้วยของมีคม เช่น มีดบาด, บาดแผล', emoji: '🩹' }
      ]
    },
    'สัน': {
      key: 'สัน',
      sound: 'สัน',
      section: 'kon',
      sectionName: 'แม่กน',
      soundBadge: '[สัน] แม่กน (เสียง น สะกด)',
      explanation: 'ทุกคำออกเสียง "สัน" แต่สะกดด้วย รรค์, รร, ลย์, ณฑ์ ตามบาลี-สันสกฤต',
      twins: [
        { word: 'สรรค์', surfaceConsonant: 'รค์', soundConsonant: 'น', meaning: 'สร้างให้มีขึ้น เช่น สร้างสรรค์, รังสรรค์', emoji: '🎨' },
        { word: 'สรร', surfaceConsonant: 'รร', soundConsonant: 'น', meaning: 'เลือก, คัดเลือก เช่น คัดสรร, จัดสรร', emoji: '✨' },
        { word: 'ศัลย์', surfaceConsonant: 'ลย์', soundConsonant: 'น', meaning: 'การผ่าตัดรักษาโรค เช่น ศัลยกรรม, ศัลยแพทย์', emoji: '🩺' },
        { word: 'สัณฑ์', surfaceConsonant: 'ณฑ์', soundConsonant: 'น', meaning: 'แนวป่า, ดงทึบ เช่น ป่าสัณฑ์', emoji: '🌲' }
      ]
    },
    'พัน': {
      key: 'พัน',
      sound: 'พัน',
      section: 'kon',
      sectionName: 'แม่กน',
      soundBadge: '[พัน] แม่กน (เสียง น สะกด)',
      explanation: 'ทุกคำออกเสียง "พัน" ทั้งจำนวนนับ เชื้อสาย และสีสันรูปกาย',
      twins: [
        { word: 'พัน', surfaceConsonant: 'น', soundConsonant: 'น', meaning: 'ม้วนหรือเกลียวรอบ, จำนวน ๑,๐๐๐ เช่น ผูกพัน, หนึ่งพัน', emoji: '🧵' },
        { word: 'พันธุ์', surfaceConsonant: 'ธุ์', soundConsonant: 'น', meaning: 'เชื้อสาย, พืชพันธุ์, สัตว์สายพันธุ์ต่าง ๆ', emoji: '🌱' },
        { word: 'พรรณ', surfaceConsonant: 'รรณ', soundConsonant: 'น', meaning: 'สี, ชนิด, ผิวพรรณ เช่น สีสันพรรณนา, วรรณะ', emoji: '🌈' }
      ]
    },
    'กด': {
      key: 'กด',
      sound: 'กด',
      section: 'kod',
      sectionName: 'แม่กด',
      soundBadge: '[กด] แม่กด (เสียง ด สะกด)',
      explanation: 'คำว่า "กด" ออกแรงดัน กับ "กฎ" กฎหมายกติกาสังคม',
      twins: [
        { word: 'กด', surfaceConsonant: 'ด', soundConsonant: 'ด', meaning: 'ออกแรงดันลงไป เช่น กดปุ่ม, กดแป้นพิมพ์', emoji: '🔘' },
        { word: 'กฎ', surfaceConsonant: 'ฎ', soundConsonant: 'ด', meaning: 'ข้อกำหนด, กฎหมาย, กฎเกณฑ์ระเบียบวินัย', emoji: '📜' }
      ]
    },
    'จัน': {
      key: 'จัน',
      sound: 'จัน',
      section: 'kon',
      sectionName: 'แม่กน',
      soundBadge: '[จัน] แม่กน (เสียง น สะกด)',
      explanation: 'ดวงจันทร์บนฟ้า, ไม้จันทน์หอม, ผลจันสีเหลือง และจรรยาความประพฤติ',
      twins: [
        { word: 'จันทร์', surfaceConsonant: 'นทร์', soundConsonant: 'น', meaning: 'ดวงจันทร์บนท้องฟ้า หรือ วันจันทร์', emoji: '🌙' },
        { word: 'จันทน์', surfaceConsonant: 'ทน์', soundConsonant: 'น', meaning: 'ไม้เนื้อหอม เช่น ไม้จันทน์, ดอกไม้จันทน์', emoji: '🪵' },
        { word: 'จัน', surfaceConsonant: 'น', soundConsonant: 'น', meaning: 'ต้นผลจัน ผลสุกสีเหลืองนวล กลิ่นหอมหวาน', emoji: '🍊' },
        { word: 'จรร', surfaceConsonant: 'รร', soundConsonant: 'น', meaning: 'ความประพฤติ เช่น จรรยา, จรรยาบรรณ', emoji: '📖' }
      ]
    },
    'บด': {
      key: 'บด',
      sound: 'บด',
      section: 'kod',
      sectionName: 'แม่กด',
      soundBadge: '[บด] แม่กด (เสียง ด สะกด)',
      explanation: 'บดทำให้ละเอียด กับ บทเรียนบทบาทในชีวิต',
      twins: [
        { word: 'บด', surfaceConsonant: 'ด', soundConsonant: 'ด', meaning: 'ทำให้แหลกละเอียด หรือ ปิดกั้น เช่น บดยา, บดบังแสง', emoji: '🥣' },
        { word: 'บท', surfaceConsonant: 'ท', soundConsonant: 'ด', meaning: 'ข้อความหรือเรื่องตอนหนึ่ง เช่น บทเรียน, บทบาท', emoji: '📚' }
      ]
    }
  };

  // ─── 4. Built-in Fallback Irregular Spelling Words for 4 Castles ───
  const FALLBACK_CASTLE_WORDS = [
    // แม่กด (kod)
    { word: 'ตำรวจ', reading: 'ตำ-รวด', targetSection: 'kod', sectionName: 'แม่กด', surfaceConsonant: 'จ', soundConsonant: 'ด', meaning: 'เจ้าหน้าที่ดูแลความสงบเรียบร้อย', emoji: '👮' },
    { word: 'อากาศ', reading: 'อา-กาด', targetSection: 'kod', sectionName: 'แม่กด', surfaceConsonant: 'ศ', soundConsonant: 'ด', meaning: 'แก๊สรอบตัวที่เราใช้หายใจ', emoji: '🌤️' },
    { word: 'ประโยชน์', reading: 'ประ-โหยด', targetSection: 'kod', sectionName: 'แม่กด', surfaceConsonant: 'ชน์', soundConsonant: 'ด', meaning: 'สิ่งที่เป็นผลดี มีคุณค่า', emoji: '💡' },
    { word: 'ปรากฏ', reading: 'ปรา-กด', targetSection: 'kod', sectionName: 'แม่กด', surfaceConsonant: 'ฏ', soundConsonant: 'ด', meaning: 'แสดงออกมาให้เห็นเด่นชัด', emoji: '✨' },
    { word: 'สำเร็จ', reading: 'สำ-เสร็ด', targetSection: 'kod', sectionName: 'แม่กด', surfaceConsonant: 'จ', soundConsonant: 'ด', meaning: 'ทำลุล่วงได้ตามเป้าหมาย', emoji: '🏆' },
    { word: 'พัฒนา', reading: 'พัด-ทะ-นา', targetSection: 'kod', sectionName: 'แม่กด', surfaceConsonant: 'ฒ', soundConsonant: 'ด', meaning: 'ทำให้เจริญก้าวหน้ายิ่งขึ้น', emoji: '🚀' },
    { word: 'พุทธ', reading: 'พุด', targetSection: 'kod', sectionName: 'แม่กด', surfaceConsonant: 'ธ', soundConsonant: 'ด', meaning: 'ผู้ตรัสรู้ พระศาสดา', emoji: '🙏' },
    { word: 'อาวุธ', reading: 'อา-วุด', targetSection: 'kod', sectionName: 'แม่กด', surfaceConsonant: 'ธ', soundConsonant: 'ด', meaning: 'เครื่องมือใช้ป้องกันตัว', emoji: '🛡️' },

    // แม่กน (kon)
    { word: 'กาล', reading: 'กาน', targetSection: 'kon', sectionName: 'แม่กน', surfaceConsonant: 'ล', soundConsonant: 'น', meaning: 'เวลา หรือช่วงสมัย', emoji: '⏳' },
    { word: 'วาฬ', reading: 'วาน', targetSection: 'kon', sectionName: 'แม่กน', surfaceConsonant: 'ฬ', soundConsonant: 'น', meaning: 'สัตว์เลี้ยงลูกด้วยนมในทะเลขนาดใหญ่', emoji: '🐋' },
    { word: 'อาหาร', reading: 'อา-หาน', targetSection: 'kon', sectionName: 'แม่กน', surfaceConsonant: 'ร', soundConsonant: 'น', meaning: 'สิ่งที่กินแล้วให้พลังงานแก่ร่างกาย', emoji: '🍲' },
    { word: 'กรรไกร', reading: 'กัน-ไกร', targetSection: 'kon', sectionName: 'แม่กน', surfaceConsonant: 'รร', soundConsonant: 'น', meaning: 'เครื่องมือใช้ตัดสิ่งของ', emoji: '✂️' },
    { word: 'เหรียญ', reading: 'เหรียน', targetSection: 'kon', sectionName: 'แม่กน', surfaceConsonant: 'ญ', soundConsonant: 'น', meaning: 'เงินตราโลหะหรือรางวัลชนะเลิศ', emoji: '🥇' },
    { word: 'สัญญาณ', reading: 'สัน-ยาน', targetSection: 'kon', sectionName: 'แม่กน', surfaceConsonant: 'ญ, ณ', soundConsonant: 'น', meaning: 'เครื่องหมายหรือแสงเสียงบอกเหตุ', emoji: '📡' },
    { word: 'ทมิฬ', reading: 'ทะ-มิน', targetSection: 'kon', sectionName: 'แม่กน', surfaceConsonant: 'ฬ', soundConsonant: 'น', meaning: 'ดุร้าย เหี้ยมโหด', emoji: '🦁' },

    // แม่กบ (kob)
    { word: 'ทัพพี', reading: 'ทับ-พี', targetSection: 'kob', sectionName: 'แม่กบ', surfaceConsonant: 'พ', soundConsonant: 'บ', meaning: 'ช้อนด้ามยาวสำหรับตักข้าวหรือแกง', emoji: '🥄' },
    { word: 'ยีราฟ', reading: 'ยี-ราบ', targetSection: 'kob', sectionName: 'แม่กบ', surfaceConsonant: 'ฟ', soundConsonant: 'บ', meaning: 'สัตว์กินพืชคอยาวที่สุดในโลก', emoji: '🦒' },
    { word: 'เคารพ', reading: 'เคา-รบ', targetSection: 'kob', sectionName: 'แม่กบ', surfaceConsonant: 'พ', soundConsonant: 'บ', meaning: 'แสดงความนับถือ อ่อนน้อมถ่อมตน', emoji: '🙇' },
    { word: 'รูปภาพ', reading: 'รูบ-พาบ', targetSection: 'kob', sectionName: 'แม่กบ', surfaceConsonant: 'ป, พ', soundConsonant: 'บ', meaning: 'ภาพที่วาดหรือถ่ายทอดเรื่องราว', emoji: '🖼️' },
    { word: 'โลภ', reading: 'โลบ', targetSection: 'kob', sectionName: 'แม่กบ', surfaceConsonant: 'ภ', soundConsonant: 'บ', meaning: 'อยากได้ของผู้อื่นเกินพอดี', emoji: '💎' },
    { word: 'อาภัพ', reading: 'อา-พับ', targetSection: 'kob', sectionName: 'แม่กบ', surfaceConsonant: 'ภ', soundConsonant: 'บ', meaning: 'วาสนาน้อย ขาดโชค', emoji: '🌧️' },

    // แม่กก (kok)
    { word: 'ตัวเลข', reading: 'ตัว-เลก', targetSection: 'kok', sectionName: 'แม่กก', surfaceConsonant: 'ข', soundConsonant: 'ก', meaning: 'สัญลักษณ์แทนจำนวนในการนับและคำนวณ', emoji: '🔢' },
    { word: 'สุนัข', reading: 'สุ-นัก', targetSection: 'kok', sectionName: 'แม่กก', surfaceConsonant: 'ข', soundConsonant: 'ก', meaning: 'สัตว์เลี้ยงสี่ขาที่แสนซื่อสัตย์', emoji: '🐕' },
    { word: 'ความสุข', reading: 'ความ-สุก', targetSection: 'kok', sectionName: 'แม่กก', surfaceConsonant: 'ข', soundConsonant: 'ก', meaning: 'ความสบายใจ ไร้ความทุกข์', emoji: '😊' },
    { word: 'เมฆ', reading: 'เมก', targetSection: 'kok', sectionName: 'แม่กก', surfaceConsonant: 'ฆ', soundConsonant: 'ก', meaning: 'ละอองน้ำรวมตัวลอยบนท้องฟ้า', emoji: '☁️' },
    { word: 'วิหค', reading: 'วิ-หก', targetSection: 'kok', sectionName: 'แม่กก', surfaceConsonant: 'ค', soundConsonant: 'ก', meaning: 'นกที่บินอยู่บนท้องฟ้า', emoji: '🕊️' },
    { word: 'เชื้อโรค', reading: 'เชื้อ-โรก', targetSection: 'kok', sectionName: 'แม่กก', surfaceConsonant: 'ค', soundConsonant: 'ก', meaning: 'สิ่งมีชีวิตขนาดเล็กที่ทำให้เกิดความเจ็บป่วย', emoji: '🦠' }
  ];

  // ─── 5. State Management ─────────────────────────────────────────
  let currentMode = 'matrix'; // 'matrix' | 'castles'
  let currentFamilyKey = 'กาน';
  let activeTwinWord = null;

  // 4 Castles State
  let castleScore = 0;
  let castleStreak = 0;
  let currentPromptWord = null;
  let castlePool = [];
  let isAnsweringLocked = false;
  let advanceTimer = null;

  // ─── 6. Data Loading & Initialization ────────────────────────────
  async function loadCastlePool() {
    if (typeof window !== 'undefined' && window.THAI_SPELLING_DECODER_DATA && Array.isArray(window.THAI_SPELLING_DECODER_DATA.words)) {
      castlePool = window.THAI_SPELLING_DECODER_DATA.words.slice();
      return;
    }

    const candidateUrls = [
      'data/words/spelling-decoder.json',
      '/games/thai/thai-vocab-hub/data/words/spelling-decoder.json',
      'public/games/thai/thai-vocab-hub/data/words/spelling-decoder.json'
    ];

    for (const url of candidateUrls) {
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          const json = await resp.json();
          if (json && Array.isArray(json.words) && json.words.length > 0) {
            castlePool = json.words;
            return;
          }
        }
      } catch (_) {}
    }

    // Fallback to built-in list
    castlePool = FALLBACK_CASTLE_WORDS.slice();
  }

  function pickRandomPrompt() {
    const list = castlePool && castlePool.length > 0 ? castlePool : FALLBACK_CASTLE_WORDS;
    // Try to pick a different word from current
    let next = list[Math.floor(Math.random() * list.length)];
    if (currentPromptWord && list.length > 1 && next.word === currentPromptWord.word) {
      next = list[Math.floor(Math.random() * list.length)];
    }
    currentPromptWord = next;
    return currentPromptWord;
  }

  // ─── 7. DOM Rendering ────────────────────────────────────────────
  function ensureModal() {
    let modal = document.getElementById('modal-sound-twins');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-sound-twins';
      modal.className = 'tvh-modal-backdrop sound-twins-backdrop';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'sound-twins-title');
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="tvh-modal-card sound-twins-card" role="document">
          <!-- Header -->
          <div class="sound-twins-header">
            <div class="sound-twins-header-left">
              <span class="sound-twins-pill-badge">นวัตกรรมภาษาไทย</span>
              <h2 id="sound-twins-title" class="sound-twins-title">🔔 วงล้อคำพ้องเสียงต่างรูปสะกด & ปราสาท 4 ตระกูล</h2>
            </div>
            <div class="sound-twins-header-right">
              <button type="button" class="tvh-modal-close touch-target" aria-label="ปิดหน้าต่าง" onclick="window.ThaiSoundTwins.close()">×</button>
            </div>
          </div>

          <!-- Mode Navigation Tabs -->
          <div class="sound-twins-tabs-bar" role="tablist" aria-label="เลือกโหมดการเรียนรู้">
            <button type="button" class="sound-twins-tab touch-target active" id="tab-mode-matrix" onclick="window.ThaiSoundTwins.switchMode('matrix')">
              🎡 วงล้อเสียงแฝดรูปต่าง (Matrix)
            </button>
            <button type="button" class="sound-twins-tab touch-target" id="tab-mode-castles" onclick="window.ThaiSoundTwins.switchMode('castles')">
              🏰 ลานประลองปราสาท 4 ตระกูล (Challenge)
            </button>
          </div>

          <!-- Mode 1: Sound Twins Matrix View -->
          <div id="sound-twins-matrix-view" class="sound-twins-view-panel">
            <!-- Family Chips Strip -->
            <div class="sound-twins-family-strip" role="group" aria-label="เลือกตระกูลคำพ้องเสียง" id="sound-twins-family-chips">
              <!-- populated dynamically -->
            </div>

            <!-- Family Sound Header & Rule -->
            <div class="sound-twins-family-banner">
              <div class="sound-twins-sound-badge" id="sound-twins-header-badge">[กาน] แม่กน</div>
              <p class="sound-twins-sound-desc" id="sound-twins-header-desc">
                ทุกคำออกเสียง "กาน" เหมือนกัน แต่ใช้ตัวสะกดต่างรูปและมีความหมายแตกต่างกัน
              </p>
            </div>

            <!-- Side-by-Side Twins Grid -->
            <div class="sound-twins-cards-scroll">
              <div class="sound-twins-cards-grid" id="sound-twins-cards-grid">
                <!-- populated dynamically -->
              </div>
            </div>
          </div>

          <!-- Mode 2: 4 Castles Challenge View -->
          <div id="sound-twins-castles-view" class="sound-twins-view-panel" style="display:none">
            <!-- Stats Bar -->
            <div class="castle-stats-bar">
              <div class="castle-stat-item">
                <span class="castle-stat-label">คะแนน:</span>
                <strong class="castle-stat-val score" id="castle-score-val">0</strong>
              </div>
              <div class="castle-stat-item">
                <span class="castle-stat-label">คอมโบต่อเนื่อง:</span>
                <strong class="castle-stat-val streak" id="castle-streak-val">🔥 0</strong>
              </div>
              <button type="button" class="cbtn touch-target castle-reset-btn" onclick="window.ThaiSoundTwins.resetChallenge()" title="เริ่มนับคะแนนใหม่">
                ↺ เริ่มใหม่
              </button>
            </div>

            <!-- Prompt Card Stage -->
            <div class="castle-stage-card">
              <div class="castle-stage-topline">
                <span class="castle-stage-hint">ส่งคำศัพท์นี้เข้าปราสาทตระกูลเสียงที่ถูกต้อง:</span>
                <button type="button" class="touch-target castle-speak-prompt-btn" id="btn-castle-speak-prompt" onclick="window.ThaiSoundTwins.speakCurrentPrompt()" title="ฟังเสียงอ่านคำศัพท์">
                  🔊 ฟังเสียง
                </button>
              </div>

              <div class="castle-stage-prompt-box">
                <div class="castle-prompt-emoji" id="castle-prompt-emoji">👮</div>
                <div class="castle-prompt-word" id="castle-prompt-word">ตำรวจ</div>
                <div class="castle-prompt-meaning" id="castle-prompt-meaning">เจ้าหน้าที่ดูแลความสงบเรียบร้อย</div>
              </div>

              <!-- Feedback Banner -->
              <div class="castle-feedback-banner" id="castle-feedback-banner">
                เลือกปราสาทแม่ตัวสะกดด้านล่างเพื่อสะสมคะแนน!
              </div>
            </div>

            <!-- 4 Castles Selection Grid -->
            <div class="castle-buttons-grid" role="group" aria-label="ปราสาท 4 ตระกูลเสียง">
              <button type="button" class="btn-castle castle-kod touch-target" data-castle="kod" onclick="window.ThaiSoundTwins.answerCastle('kod')">
                <span class="castle-icon" aria-hidden="true">🏰</span>
                <span class="castle-name">แม่กด</span>
                <span class="castle-sound-badge">เสียง ด สะกด</span>
              </button>

              <button type="button" class="btn-castle castle-kon touch-target" data-castle="kon" onclick="window.ThaiSoundTwins.answerCastle('kon')">
                <span class="castle-icon" aria-hidden="true">🏰</span>
                <span class="castle-name">แม่กน</span>
                <span class="castle-sound-badge">เสียง น สะกด</span>
              </button>

              <button type="button" class="btn-castle castle-kob touch-target" data-castle="kob" onclick="window.ThaiSoundTwins.answerCastle('kob')">
                <span class="castle-icon" aria-hidden="true">🏰</span>
                <span class="castle-name">แม่กบ</span>
                <span class="castle-sound-badge">เสียง บ สะกด</span>
              </button>

              <button type="button" class="btn-castle castle-kok touch-target" data-castle="kok" onclick="window.ThaiSoundTwins.answerCastle('kok')">
                <span class="castle-icon" aria-hidden="true">🏰</span>
                <span class="castle-name">แม่กก</span>
                <span class="castle-sound-badge">เสียง ก สะกด</span>
              </button>
            </div>

            <div class="castle-next-row">
              <button type="button" class="btn btn-primary touch-target btn-castle-next" id="btn-castle-next" onclick="window.ThaiSoundTwins.nextCastlePrompt()">
                คำถัดไป ▶
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Render family chips inside modal
      renderFamilyChips();
    } else {
      renderFamilyChips();
    }

    return modal;
  }

  function renderFamilyChips() {
    const container = document.getElementById('sound-twins-family-chips');
    if (!container) return;
    container.innerHTML = '';

    const keys = Object.keys(CURATED_TWIN_FAMILIES);
    keys.forEach(k => {
      const fam = CURATED_TWIN_FAMILIES[k];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sound-twins-family-chip touch-target' + (k === currentFamilyKey ? ' active' : '');
      btn.textContent = `${fam.sound} (${fam.sectionName})`;
      btn.onclick = () => window.ThaiSoundTwins.selectFamily(k);
      container.appendChild(btn);
    });
  }

  function renderMatrixFamily() {
    const fam = CURATED_TWIN_FAMILIES[currentFamilyKey] || CURATED_TWIN_FAMILIES['กาน'];
    const badgeEl = document.getElementById('sound-twins-header-badge');
    const descEl = document.getElementById('sound-twins-header-desc');
    const gridEl = document.getElementById('sound-twins-cards-grid');

    if (badgeEl) badgeEl.textContent = fam.soundBadge;
    if (descEl) descEl.textContent = fam.explanation;

    // Update active state on chips
    const chips = document.querySelectorAll('.sound-twins-family-chip');
    chips.forEach(c => {
      const text = c.textContent || '';
      if (text.startsWith(fam.sound)) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    if (!gridEl) return;
    gridEl.innerHTML = '';

    fam.twins.forEach(t => {
      const card = document.createElement('div');
      card.className = 'twin-card touch-target' + (activeTwinWord === t.word ? ' active' : '');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `คำว่า ${t.word} หมายถึง ${t.meaning}`);

      card.innerHTML = `
        <div class="twin-card-top">
          <span class="twin-emoji">${t.emoji || '📝'}</span>
          <span class="twin-spelling-badge">${t.surfaceConsonant} สะกด ➔ ${fam.sectionName}</span>
        </div>
        <div class="twin-word-bold">${t.word}</div>
        <p class="twin-meaning-text">${t.meaning}</p>
        <button type="button" class="twin-speak-btn touch-target" title="ฟังเสียงอ่าน">
          🔊 ฟังเสียง
        </button>
      `;

      // Click card to select & speak
      card.onclick = (e) => {
        if (e.target.closest('.twin-speak-btn')) {
          e.stopPropagation();
        }
        window.ThaiSoundTwins.selectTwin(t.word);
        window.ThaiSoundTwins.speakWord(t.word);
      };

      const speakBtn = card.querySelector('.twin-speak-btn');
      if (speakBtn) {
        speakBtn.onclick = (e) => {
          e.stopPropagation();
          window.ThaiSoundTwins.selectTwin(t.word);
          window.ThaiSoundTwins.speakWord(t.word);
        };
      }

      gridEl.appendChild(card);
    });
  }

  function renderCastlePrompt() {
    if (!currentPromptWord) pickRandomPrompt();
    const word = currentPromptWord;

    const emojiEl = document.getElementById('castle-prompt-emoji');
    const wordEl = document.getElementById('castle-prompt-word');
    const meaningEl = document.getElementById('castle-prompt-meaning');
    const feedbackEl = document.getElementById('castle-feedback-banner');

    if (emojiEl) emojiEl.textContent = word.emoji || '📝';
    if (wordEl) wordEl.textContent = word.word;
    if (meaningEl) meaningEl.textContent = word.meaning || `อ่านว่า [${word.reading || word.word}]`;

    if (feedbackEl) {
      feedbackEl.className = 'castle-feedback-banner';
      feedbackEl.textContent = 'เลือกปราสาทแม่ตัวสะกดด้านล่างเพื่อสะสมคะแนน!';
    }

    // Reset castle button active/wrong states
    document.querySelectorAll('.btn-castle').forEach(btn => {
      btn.classList.remove('correct', 'wrong', 'disabled');
      btn.removeAttribute('disabled');
    });

    isAnsweringLocked = false;
  }

  function updateCastleStats() {
    const scoreEl = document.getElementById('castle-score-val');
    const streakEl = document.getElementById('castle-streak-val');

    if (scoreEl) scoreEl.textContent = castleScore;
    if (streakEl) streakEl.textContent = `🔥 ${castleStreak}`;
  }

  // ─── 8. Public API ───────────────────────────────────────────────
  const ThaiSoundTwins = {
    open(familyKey) {
      const modal = ensureModal();
      if (familyKey && CURATED_TWIN_FAMILIES[familyKey]) {
        currentFamilyKey = familyKey;
      }
      modal.style.display = 'flex';
      audioFx.playClick();

      if (currentMode === 'matrix') {
        renderMatrixFamily();
      } else {
        renderCastlePrompt();
        updateCastleStats();
      }
    },

    close() {
      const modal = document.getElementById('modal-sound-twins');
      if (modal) modal.style.display = 'none';
      if (advanceTimer) {
        clearTimeout(advanceTimer);
        advanceTimer = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },

    switchMode(mode) {
      currentMode = mode === 'castles' ? 'castles' : 'matrix';
      audioFx.playClick();

      const tabMatrix = document.getElementById('tab-mode-matrix');
      const tabCastles = document.getElementById('tab-mode-castles');
      const viewMatrix = document.getElementById('sound-twins-matrix-view');
      const viewCastles = document.getElementById('sound-twins-castles-view');

      if (currentMode === 'matrix') {
        if (tabMatrix) tabMatrix.classList.add('active');
        if (tabCastles) tabCastles.classList.remove('active');
        if (viewMatrix) viewMatrix.style.display = 'flex';
        if (viewCastles) viewCastles.style.display = 'none';
        renderMatrixFamily();
      } else {
        if (tabMatrix) tabMatrix.classList.remove('active');
        if (tabCastles) tabCastles.classList.add('active');
        if (viewMatrix) viewMatrix.style.display = 'none';
        if (viewCastles) viewCastles.style.display = 'flex';
        renderCastlePrompt();
        updateCastleStats();
      }
    },

    selectFamily(familyKey) {
      if (CURATED_TWIN_FAMILIES[familyKey]) {
        currentFamilyKey = familyKey;
        activeTwinWord = null;
        audioFx.playClick();
        renderMatrixFamily();
      }
    },

    selectTwin(word) {
      activeTwinWord = word;
      const cards = document.querySelectorAll('#sound-twins-cards-grid .twin-card');
      cards.forEach(c => {
        const text = c.querySelector('.twin-word-bold')?.textContent || '';
        if (text === word) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
    },

    speakWord(word) {
      speakThai(word);
    },

    speakCurrentPrompt() {
      if (currentPromptWord && currentPromptWord.word) {
        speakThai(currentPromptWord.word);
      }
    },

    answerCastle(castleKey) {
      if (isAnsweringLocked) return;
      if (!currentPromptWord) return;

      const feedbackEl = document.getElementById('castle-feedback-banner');
      const pressedBtn = document.querySelector(`.btn-castle[data-castle="${castleKey}"]`);
      const isCorrect = currentPromptWord.targetSection === castleKey;

      if (isCorrect) {
        isAnsweringLocked = true;
        castleScore += 10 + (castleStreak >= 2 ? 5 : 0);
        castleStreak += 1;
        updateCastleStats();
        audioFx.playCorrect();

        if (pressedBtn) pressedBtn.classList.add('correct');
        if (feedbackEl) {
          feedbackEl.className = 'castle-feedback-banner success';
          feedbackEl.textContent = `🎉 ถูกต้องยอดเยี่ยม! คำว่า "${currentPromptWord.word}" สะกดด้วย ${currentPromptWord.surfaceConsonant} อยู่ใน ${currentPromptWord.sectionName || 'มาตรานี้'} (ออกเสียง ${currentPromptWord.soundConsonant || ''} สะกด) ✨`;
        }

        // Auto-advance after 1.4s
        advanceTimer = setTimeout(() => {
          ThaiSoundTwins.nextCastlePrompt();
        }, 1400);
      } else {
        castleStreak = 0;
        updateCastleStats();
        audioFx.playWrong();

        if (pressedBtn) pressedBtn.classList.add('wrong');
        if (feedbackEl) {
          feedbackEl.className = 'castle-feedback-banner error';
          feedbackEl.textContent = `ยังไม่ถูกต้องนะจ๊ะ! คำว่า "${currentPromptWord.word}" มีตัวสะกดคือ ${currentPromptWord.surfaceConsonant} อยู่ใน ${currentPromptWord.sectionName || 'มาตราอื่น'} ลองสังเกตเสียงสะกดดูนะ!`;
        }
      }
    },

    nextCastlePrompt() {
      if (advanceTimer) {
        clearTimeout(advanceTimer);
        advanceTimer = null;
      }
      pickRandomPrompt();
      renderCastlePrompt();
      audioFx.playClick();
    },

    resetChallenge() {
      castleScore = 0;
      castleStreak = 0;
      updateCastleStats();
      this.nextCastlePrompt();
    },

    getCurrentMode() {
      return currentMode;
    },

    getCurrentFamily() {
      return CURATED_TWIN_FAMILIES[currentFamilyKey];
    },

    getCurrentPrompt() {
      if (!currentPromptWord) pickRandomPrompt();
      return currentPromptWord;
    },

    getScore() {
      return castleScore;
    },

    getStreak() {
      return castleStreak;
    },

    getCuratedFamilies() {
      return CURATED_TWIN_FAMILIES;
    }
  };

  // Expose to window
  if (typeof window !== 'undefined') {
    window.ThaiSoundTwins = ThaiSoundTwins;

    // Load pool in background
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        void loadCastlePool();
        ensureModal();
      });
    } else {
      void loadCastlePool();
      ensureModal();
    }
  }

  // CommonJS export for Node testing if required
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThaiSoundTwins;
  }
})();
