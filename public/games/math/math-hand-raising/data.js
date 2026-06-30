/* data.js — ข้อมูลหมวดหมู่ ระดับชั้น และคำพูดสำหรับเกมยกมือทายถูกผิด */
window.GAME_DATA = {
  // ─── หมวดหมู่คณิตศาสตร์ ───
  categories: {
    addition:       { icon: '➕', label: 'บวก',  opSymbol: '+', opName: 'บวก',   color: 'green',  tailwind: 'bg-green-600/30 border-green-500 hover:bg-green-600/50' },
    subtraction:    { icon: '➖', label: 'ลบ',   opSymbol: '−', opName: 'ลบ',    color: 'blue',   tailwind: 'bg-blue-600/30 border-blue-500 hover:bg-blue-600/50' },
    multiplication: { icon: '✖️', label: 'คูณ',  opSymbol: '×', opName: 'คูณ',   color: 'purple', tailwind: 'bg-purple-600/30 border-purple-500 hover:bg-purple-600/50' },
    division:       { icon: '➗', label: 'หาร',  opSymbol: '÷', opName: 'หาร',   color: 'orange', tailwind: 'bg-orange-600/30 border-orange-500 hover:bg-orange-600/50' },
    mixed:          { icon: '🔀', label: 'ผสม',  opSymbol: '',  opName: 'ผสม',   color: 'pink',   tailwind: 'bg-pink-600/30 border-pink-500 hover:bg-pink-600/50' },
  },

  // ─── ระดับชั้น ───
  grades: {
    4: {
      label: 'ป.4',
      desc: 'ตัวเลข 1–100 · สูตรคูณ 2–12',
      cardBg: 'bg-emerald-600/20 border-emerald-500 hover:bg-emerald-600/40',
      badgeGradient: 'from-green-400 to-emerald-600',
    },
    5: {
      label: 'ป.5',
      desc: 'ตัวเลข 10–1,000 · สูตรคูณ 2–25',
      cardBg: 'bg-blue-600/20 border-blue-500 hover:bg-blue-600/40',
      badgeGradient: 'from-blue-400 to-indigo-600',
    },
    6: {
      label: 'ป.6',
      desc: 'ตัวเลข 100–10,000 · สูตรคูณ 5–50',
      cardBg: 'bg-purple-600/20 border-purple-500 hover:bg-purple-600/40',
      badgeGradient: 'from-purple-400 to-pink-600',
    },
  },

  // ─── คำชม / คำปลอบ / หมดเวลา ───
  correctPhrases: ['ถูกต้องจ้า', 'เก่งมาก', 'สุดยอด', 'ยอดเยี่ยม', 'เจ๋งมาก'],
  wrongPhrases:   ['ตอบผิดจ้า', 'พยายามเข้านะ', 'ลองใหม่นะ', 'ไม่เป็นไร ข้อหน้าเอาใหม่'],
  timeUpPhrases:  ['หมดเวลาจ้า ⏰', 'ช้าไปนิด', 'ต้องเร็วกว่านี้นะ'],
};
