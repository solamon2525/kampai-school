/* data.js — คลังข้อมูลและประเภทโจทย์ของเกม Math Catcher */
window.GAME_DATA = {
  BASKET: '🧺',
  BOMB: '💣',
  FEVER: '💎',
  FREEZE: '❄️',
  SHIELD: '🛡️',
  MAGNET: '🧲',

  // กำหนดสเปกการสร้างโจทย์แยกตามระดับเลเวล
  LEVEL_SPECS: {
    1: {
      name: 'บวกเลขแสนสนุก (<= 20)',
      ops: ['+'],
      maxVal: 20,
      templates: ['A + B = ?', 'A + ? = C', '? + B = C']
    },
    2: {
      name: 'ลบเลขแสนง่าย (<= 20)',
      ops: ['-'],
      maxVal: 20,
      templates: ['A - B = ?', 'A - ? = C', '? - B = C']
    },
    3: {
      name: 'บวกและลบผสมผสาน (<= 50)',
      ops: ['+', '-'],
      maxVal: 50,
      templates: ['A + B = ?', 'A - B = ?', 'A + ? = C', 'A - ? = C']
    },
    4: {
      name: 'ท่องสูตรคูณหรรษา (แม่ 2-9)',
      ops: ['x'],
      maxVal: 10,
      templates: ['A x B = ?', '? x B = C', 'A x ? = C']
    },
    5: {
      name: 'หารลงตัวชวนคิด',
      ops: ['/'],
      maxVal: 81,
      templates: ['A / B = ?', 'A / ? = C']
    },
    6: {
      name: 'อภิมหาคณิตศาสตร์ผสม (Mix Everything!)',
      ops: ['+', '-', 'x', '/'],
      maxVal: 100,
      templates: ['A + B = ?', 'A - B = ?', 'A x B = ?', 'A / B = ?']
    }
  }
};
