/* data.js — เนื้อหาเกม "Phonics Pop" (เสียงพาสนุก)
   3 โหมด: Letters (a–z), Blends (ch, sh, th…), Words (CVC words)
   ครูเพิ่ม/ลบคำได้ตรงนี้ */
window.GAME_DATA = {

  /* ═══ โหมด 1: ตัวอักษร a-z (phonics sounds) ═══ */
  LETTERS: [
    { id: 'a', display: 'A a', speak: 'a' },
    { id: 'b', display: 'B b', speak: 'b' },
    { id: 'c', display: 'C c', speak: 'c' },
    { id: 'd', display: 'D d', speak: 'd' },
    { id: 'e', display: 'E e', speak: 'e' },
    { id: 'f', display: 'F f', speak: 'f' },
    { id: 'g', display: 'G g', speak: 'g' },
    { id: 'h', display: 'H h', speak: 'h' },
    { id: 'i', display: 'I i', speak: 'i' },
    { id: 'j', display: 'J j', speak: 'j' },
    { id: 'k', display: 'K k', speak: 'k' },
    { id: 'l', display: 'L l', speak: 'l' },
    { id: 'm', display: 'M m', speak: 'm' },
    { id: 'n', display: 'N n', speak: 'n' },
    { id: 'o', display: 'O o', speak: 'o' },
    { id: 'p', display: 'P p', speak: 'p' },
    { id: 'q', display: 'Q q', speak: 'q' },
    { id: 'r', display: 'R r', speak: 'r' },
    { id: 's', display: 'S s', speak: 's' },
    { id: 't', display: 'T t', speak: 't' },
    { id: 'u', display: 'U u', speak: 'u' },
    { id: 'v', display: 'V v', speak: 'v' },
    { id: 'w', display: 'W w', speak: 'w' },
    { id: 'x', display: 'X x', speak: 'x' },
    { id: 'y', display: 'Y y', speak: 'y' },
    { id: 'z', display: 'Z z', speak: 'z' },
  ],

  /* ═══ โหมด 2: Blends & Digraphs ═══ */
  BLENDS: [
    { id: 'ch', display: 'ch', speak: 'ch' },
    { id: 'sh', display: 'sh', speak: 'sh' },
    { id: 'th', display: 'th', speak: 'th' },
    { id: 'ph', display: 'ph', speak: 'ph' },
    { id: 'wh', display: 'wh', speak: 'wh' },
    { id: 'ck', display: 'ck', speak: 'ck' },
    { id: 'ng', display: 'ng', speak: 'ng' },
    { id: 'nk', display: 'nk', speak: 'nk' },
    { id: 'bl', display: 'bl', speak: 'bl' },
    { id: 'cl', display: 'cl', speak: 'cl' },
    { id: 'fl', display: 'fl', speak: 'fl' },
    { id: 'gl', display: 'gl', speak: 'gl' },
    { id: 'pl', display: 'pl', speak: 'pl' },
    { id: 'sl', display: 'sl', speak: 'sl' },
    { id: 'br', display: 'br', speak: 'br' },
    { id: 'cr', display: 'cr', speak: 'cr' },
    { id: 'dr', display: 'dr', speak: 'dr' },
    { id: 'fr', display: 'fr', speak: 'fr' },
    { id: 'gr', display: 'gr', speak: 'gr' },
    { id: 'pr', display: 'pr', speak: 'pr' },
    { id: 'tr', display: 'tr', speak: 'tr' },
  ],

  /* ═══ โหมด 3: CVC Words (คำ 3 ตัว) ═══ */
  CVC_WORDS: [
    { id: 'cat', display: 'cat', speak: 'cat', emoji: '🐱', th: 'แมว' },
    { id: 'dog', display: 'dog', speak: 'dog', emoji: '🐶', th: 'สุนัข' },
    { id: 'sun', display: 'sun', speak: 'sun', emoji: '☀️', th: 'พระอาทิตย์' },
    { id: 'hat', display: 'hat', speak: 'hat', emoji: '🎩', th: 'หมวก' },
    { id: 'pig', display: 'pig', speak: 'pig', emoji: '🐷', th: 'หมู' },
    { id: 'cup', display: 'cup', speak: 'cup', emoji: '☕', th: 'ถ้วย' },
    { id: 'bed', display: 'bed', speak: 'bed', emoji: '🛏️', th: 'เตียง' },
    { id: 'bus', display: 'bus', speak: 'bus', emoji: '🚌', th: 'รถบัส' },
    { id: 'run', display: 'run', speak: 'run', emoji: '🏃', th: 'วิ่ง' },
    { id: 'map', display: 'map', speak: 'map', emoji: '🗺️', th: 'แผนที่' },
    { id: 'fox', display: 'fox', speak: 'fox', emoji: '🦊', th: 'สุนัขจิ้งจอก' },
    { id: 'hen', display: 'hen', speak: 'hen', emoji: '🐔', th: 'แม่ไก่' },
    { id: 'bug', display: 'bug', speak: 'bug', emoji: '🐛', th: 'แมลง' },
    { id: 'pen', display: 'pen', speak: 'pen', emoji: '🖊️', th: 'ปากกา' },
    { id: 'net', display: 'net', speak: 'net', emoji: '🥅', th: 'ตาข่าย' },
    { id: 'pot', display: 'pot', speak: 'pot', emoji: '🍯', th: 'หม้อ' },
    { id: 'van', display: 'van', speak: 'van', emoji: '🚐', th: 'รถตู้' },
    { id: 'jam', display: 'jam', speak: 'jam', emoji: '🍓', th: 'แยม' },
    { id: 'fan', display: 'fan', speak: 'fan', emoji: '🌀', th: 'พัดลม' },
    { id: 'nut', display: 'nut', speak: 'nut', emoji: '🥜', th: 'ถั่ว' },
    { id: 'bat', display: 'bat', speak: 'bat', emoji: '🦇', th: 'ค้างคาว' },
    { id: 'log', display: 'log', speak: 'log', emoji: '🪵', th: 'ท่อนไม้' },
    { id: 'web', display: 'web', speak: 'web', emoji: '🕸️', th: 'ใยแมงมุม' },
    { id: 'mop', display: 'mop', speak: 'mop', emoji: '🧹', th: 'ไม้ถูพื้น' },
    { id: 'gum', display: 'gum', speak: 'gum', emoji: '🫧', th: 'หมากฝรั่ง' },
    { id: 'zip', display: 'zip', speak: 'zip', emoji: '🤐', th: 'รูดซิป' },
    { id: 'top', display: 'top', speak: 'top', emoji: '🔝', th: 'ข้างบน' },
    { id: 'hop', display: 'hop', speak: 'hop', emoji: '🐰', th: 'กระโดด' },
    { id: 'mud', display: 'mud', speak: 'mud', emoji: '💩', th: 'โคลน' },
    { id: 'red', display: 'red', speak: 'red', emoji: '🔴', th: 'สีแดง' },
    { id: 'box', display: 'box', speak: 'box', emoji: '📦', th: 'กล่อง' },
    { id: 'fin', display: 'fin', speak: 'fin', emoji: '🦈', th: 'ครีบ' },
    { id: 'sit', display: 'sit', speak: 'sit', emoji: '🪑', th: 'นั่ง' },
    { id: 'cot', display: 'cot', speak: 'cot', emoji: '🛏️', th: 'เปลเด็ก' },
    { id: 'leg', display: 'leg', speak: 'leg', emoji: '🦵', th: 'ขา' },
  ],

  /* สีลูกโป่ง */
  BALLOON_COLORS: [
    { bg: '#ef4444', shadow: '#b91c1c', shine: '#fca5a5' },  // red
    { bg: '#3b82f6', shadow: '#1d4ed8', shine: '#93c5fd' },  // blue
    { bg: '#22c55e', shadow: '#15803d', shine: '#86efac' },  // green
    { bg: '#eab308', shadow: '#a16207', shine: '#fde68a' },  // yellow
    { bg: '#a855f7', shadow: '#7e22ce', shine: '#d8b4fe' },  // purple
    { bg: '#f97316', shadow: '#c2410c', shine: '#fdba74' },  // orange
    { bg: '#ec4899', shadow: '#be185d', shine: '#f9a8d4' },  // pink
    { bg: '#06b6d4', shadow: '#0e7490', shine: '#67e8f9' },  // cyan
  ],
};
