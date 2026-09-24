/**
 * c2-glossary-data.js — ฐานข้อมูลคำศัพท์ Construct 2 ครอบคลุมคำแปล เสียงอ่านไทยสละสลวย และเหตุการณ์การใช้งาน
 */
(function(window) {
  'use strict';

  var GLOSSARY_DATA = [
    // ==========================================
    // ⚙️ หมวดหมู่ 1: หน้าจอและโครงสร้าง (IDE & Layout)
    // ==========================================
    {
      id: 'layout',
      term: 'Layout',
      category: 'ide',
      categoryName: '⚙️ หน้าจอ & โครงสร้าง',
      type: 'Workspace',
      translation: 'ฉากหรือหน้าจอของเกม',
      speechTh: 'เลย์เอาต์ คือ หน้าจอหรือฉากในเกม เช่น หน้าเมนูหลัก หรือฉากเล่นเกมด่านที่ 1 เป็นพื้นที่สำหรับวางตัวละครและวัตถุต่างๆ',
      speechEn: 'Layout',
      usage: 'ใช้เมื่อสร้างฉากใหม่ในโปรเจกต์ เช่น Layout "title" สำหรับหน้าแรก หรือ Layout "game" สำหรับฉากเล่นเกม',
      eventExample: {
        type: 'concept',
        title: 'โครงสร้าง Layout ในเกม Red Hood',
        detail: ' Layout "title" ➔ หน้าเมนูหลัก\n Layout "game" ➔ ฉากเล่นด่านที่ 1 (ขนาด 4500 × 960)'
      }
    },
    {
      id: 'event-sheet',
      term: 'Event Sheet',
      category: 'ide',
      categoryName: '⚙️ หน้าจอ & โครงสร้าง',
      type: 'Workspace',
      translation: 'กระดาษเขียนโค้ดและคำสั่งควบคุมเกม',
      speechTh: 'อีเวนต์ชีต คือ แผ่นเขียนคำสั่งของเกม เปรียบเหมือนสมองคอยสั่งงานว่า เมื่อเกิดเหตุการณ์อะไรขึ้น จะให้เกมทำอะไรต่อไป',
      speechEn: 'Event Sheet',
      usage: 'ใช้เขียนกฎเกณฑ์และกติกาของเกม เช่น เมื่อผู้เล่นกดปุ่ม ให้ตัวละครกระโดด หรือเมื่อโดนศัตรูให้ลดหัวใจ',
      eventExample: {
        type: 'es',
        cond: 'System ➔ On start of layout',
        act: 'System ➔ Set score to 0'
      }
    },
    {
      id: 'properties',
      term: 'Properties',
      category: 'ide',
      categoryName: '⚙️ หน้าจอ & โครงสร้าง',
      type: 'Panel',
      translation: 'แถบตั้งค่าคุณสมบัติวัตถุ',
      speechTh: 'พร็อปเพอร์ตี้ คือ แถบปรับแต่งค่าของวัตถุ เช่น ปรับขนาด ตำแหน่ง ความเร็ว หรือใส่พฤติกรรมให้ตัวละคร',
      speechEn: 'Properties panel',
      usage: 'ใช้ปรับค่าความเร็วเดิน ความสูงในการกระโดด หรือปรับขนาดกว้างยาวของวัตถุในฉาก',
      eventExample: {
        type: 'props',
        title: 'Properties: player (Sprite)',
        detail: 'Max speed: 200\nJump strength: 650\nGravity: 1500'
      }
    },
    {
      id: 'project-bar',
      term: 'Project Bar',
      category: 'ide',
      categoryName: '⚙️ หน้าจอ & โครงสร้าง',
      type: 'Panel',
      translation: 'แถบรวบรวมไฟล์และวัตถุในโปรเจกต์',
      speechTh: 'โปรเจกต์บาร์ คือ แถบรายการทางขวามือ ที่จัดเก็บฉาก อีเวนต์ชีต ภาพ และเสียงทั้งหมดของเกม',
      speechEn: 'Project Bar',
      usage: 'ใช้สำหรับเปิดดูรายชื่อฉาก เลือกแผ่น Event Sheet หรือดูวัตถุทั้งหมดที่มีในโปรเจกต์',
      eventExample: {
        type: 'concept',
        title: 'สิ่งที่อยู่ใน Project Bar',
        detail: '▼ Layouts\n  ▶ title, game, game2\n▼ Event sheets\n  ▶ game sheet'
      }
    },
    {
      id: 'layer',
      term: 'Layer',
      category: 'ide',
      categoryName: '⚙️ หน้าจอ & โครงสร้าง',
      type: 'Visual',
      translation: 'ชั้นวางวัตถุซ้อนกัน',
      speechTh: 'เลเยอร์ คือ ชั้นของการวางวัตถุซ้อนกัน เช่น ชั้นฉากหลัง ชั้นตัวละคร และชั้นแสดงผลหัวใจกับคะแนน',
      speechEn: 'Layer',
      usage: 'ใช้แบ่งวัตถุไม่ให้บังกัน เช่น วางพื้นหลังไว้ชั้นล่างสุด วางตัวละครชั้นกลาง และวางหัวใจไว้ชั้นบนสุด',
      eventExample: {
        type: 'concept',
        title: 'การจัด Layer ในเกม',
        detail: 'Layer 3: HUD (หัวใจ, คะแนน - อยู่กับที่)\nLayer 2: game (ตัวละคร, มอนสเตอร์)\nLayer 1: bg (ฉากหลัง)'
      }
    },
    {
      id: 'parallax',
      term: 'Parallax',
      category: 'ide',
      categoryName: '⚙️ หน้าจอ & โครงสร้าง',
      type: 'Property',
      translation: 'อัตราการเลื่อนของฉากตามกล้อง',
      speechTh: 'พารัลแลกซ์ คือ อัตราการเลื่อนของเลเยอร์ตามกล้อง ถ้าตั้งค่าเป็น 0, 0 วัตถุจะลอยติดหน้าจอ ไม่เลื่อนตามตัวละคร',
      speechEn: 'Parallax',
      usage: 'ใช้กับ Layer HUD เพื่อให้หัวใจและคะแนนลอยติดหน้าจอเสมอ (ตั้งค่า Parallax = 0, 0)',
      eventExample: {
        type: 'props',
        title: 'Properties: Layer HUD',
        detail: 'Parallax: 0, 0 (ติดหน้าจอเลื่อนตามกล้องตลอดเวลา)'
      }
    },
    {
      id: 'collision-polygon',
      term: 'Collision Polygon',
      category: 'ide',
      categoryName: '⚙️ หน้าจอ & โครงสร้าง',
      type: 'Tool',
      translation: 'เส้นกรอบตรวจจับการชน',
      speechTh: 'คอลลิชันพอลีกอน คือ เส้นกรอบล้อมรอบตัวละครที่ใช้ตรวจจับการชน ต้องปรับให้พอดีตัวเพื่อไม่ให้ติดขอบกำแพงล่องหน',
      speechEn: 'Collision Polygon',
      usage: 'ใช้ปรับแต่งใน Image Editor เมื่อตัวละครยืนลอยบนพื้น หรือชนเกาะแล้วติดขอบล่องหน',
      eventExample: {
        type: 'concept',
        title: 'การตั้งค่า Collision Polygon',
        detail: 'ดับเบิลคลิก Sprite ➔ คลิกไอคอน Collision polygon ➔ ดึงจุดมุมให้กระชับพอดีตัวละคร'
      }
    },
    {
      id: 'image-point',
      term: 'Image Point',
      category: 'ide',
      categoryName: '⚙️ หน้าจอ & โครงสร้าง',
      type: 'Tool',
      translation: 'จุดอ้างอิงสร้างวัตถุบนตัวละคร',
      speechTh: 'อิมเมจพอยต์ คือ จุดปักป้ายบนภาพตัวละคร เช่น จุดปลายปืน หรือจุดปากศัตรู เพื่อใช้เป็นจุดปล่อยกระสุนยิงออกมา',
      speechEn: 'Image Point',
      usage: 'ใช้เมื่อต้องการให้มอนสเตอร์ยิงกระสุนออกมาจากปาก หรือตัวละครปล่อยเอฟเฟกต์ที่มือ',
      eventExample: {
        type: 'es',
        cond: 'System ➔ Every 2 seconds',
        act: 'emonster ➔ Spawn emon_bullet on Image point 1'
      }
    },

    // ==========================================
    // ⚡ หมวดหมู่ 2: เงื่อนไขและเหตุการณ์ (Conditions)
    // ==========================================
    {
      id: 'on-start-of-layout',
      term: 'On start of layout',
      category: 'condition',
      categoryName: '⚡ เงื่อนไข (Conditions)',
      type: 'System Condition',
      translation: 'เมื่อเริ่มเปิดฉากนี้ครั้งแรก',
      speechTh: 'ออนสตาร์ตออฟเลย์เอาต์ คือ เงื่อนไขที่ทำงานครั้งเดียว ทันทีที่ฉากถูกเปิดขึ้นมา',
      speechEn: 'On start of layout',
      usage: 'ใช้ในการตั้งค่าเริ่มต้นของฉาก เช่น เซตคะแนนเริ่มต้น รีเซตตำแหน่งตัวละคร หรือเริ่มเล่นเพลงประกอบ',
      eventExample: {
        type: 'es',
        cond: 'System ➔ On start of layout',
        act: 'System ➔ Set score to 0\n➔ Audio ➔ Play "Music1" looping'
      }
    },
    {
      id: 'every-tick',
      term: 'Every tick',
      category: 'condition',
      categoryName: '⚡ เงื่อนไข (Conditions)',
      type: 'System Condition',
      translation: 'ทำงานทุกๆ เฟรม (60 ครั้งต่อวินาที)',
      speechTh: 'เอเวอรีติก คือ เงื่อนไขที่สั่งให้เกมทำงานตลอดเวลาในทุกเฟรม ประมาณ 60 ครั้งต่อวินาที',
      speechEn: 'Every tick',
      usage: 'ใช้สำหรับการอัปเดตข้อความบนหน้าจอ HUD ตลอดเวลา เช่น อัปเดตตัวเลขคะแนนและตัวเลขเวลา',
      eventExample: {
        type: 'es',
        cond: 'System ➔ Every tick',
        act: 'txtScore ➔ Set text to "คะแนน: " & score'
      }
    },
    {
      id: 'trigger-once',
      term: 'Trigger once while true',
      category: 'condition',
      categoryName: '⚡ เงื่อนไข (Conditions)',
      type: 'System Condition',
      translation: 'ทำงานเพียงครั้งเดียวเมื่อเงื่อนไขเป็นจริง',
      speechTh: 'ทริกเกอร์วันส์ไวลทรู คือ เงื่อนไขล็อกให้การกระทำเกิดขึ้นแค่ครั้งเดียว ไม่ทำงานซ้ำรัวๆ ในทุกเฟรม',
      speechEn: 'Trigger once while true',
      usage: 'ใช้ใส่ซ้อนใต้เงื่อนไขลดเลือด หรือเล่นเสียงเจ็บ เพื่อไม่ให้เลือดลดรวดเดียวจนหมดในเฟรมเดียว',
      eventExample: {
        type: 'es',
        cond: 'player ➔ On collision with monster\nSystem ➔ Trigger once while true',
        act: 'System ➔ Subtract 1 from หัวใจ\n➔ player ➔ Flash for 2 seconds'
      }
    },
    {
      id: 'on-collision-with',
      term: 'On collision with',
      category: 'condition',
      categoryName: '⚡ เงื่อนไข (Conditions)',
      type: 'Object Condition',
      translation: 'เมื่อแตะชนวัตถุอื่น (ครั้งแรก)',
      speechTh: 'ออนคอลลิชันวิด คือ เงื่อนไขตรวจสอบจังหวะที่วัตถุเคลื่อนที่ไปชนหรือแตะกับอีกวัตถุหนึ่ง',
      speechEn: 'On collision with',
      usage: 'ใช้เมื่อตัวละครชนเก็บดาว ชนศัตรู ชนเหรียญ หรือเดินไปแตะประตูเคลียร์ด่าน',
      eventExample: {
        type: 'es',
        cond: 'player ➔ On collision with star',
        act: 'System ➔ Add 10 to score\n➔ star ➔ Destroy'
      }
    },
    {
      id: 'is-overlapping',
      term: 'Is overlapping another object',
      category: 'condition',
      categoryName: '⚡ เงื่อนไข (Conditions)',
      type: 'Object Condition',
      translation: 'เมื่อกำลังซ้อนทับอยู่กับวัตถุอื่น',
      speechTh: 'อิสโอเวอร์แลปปิง คือ เงื่อนไขตรวจสอบว่า วัตถุกำลังแตะหรือซ้อนทับกันอยู่หรือไม่ ตลอดเวลาที่ทับกัน',
      speechEn: 'Is overlapping another object',
      usage: 'ใช้ตรวจการเหยียบหัวศัตรู หรือตรวจว่าตัวละครกำลังยืนซ้อนอยู่บนพื้นที่ปลอดภัยหรือไม่',
      eventExample: {
        type: 'es',
        cond: 'player ➔ Is overlapping monster\nplayer ➔ Y < monster.Y',
        act: 'monster ➔ Destroy\n➔ player ➔ Set Platform vector Y to −400 (เด้งขึ้น)'
      }
    },
    {
      id: 'compare-two-values',
      term: 'Compare two values',
      category: 'condition',
      categoryName: '⚡ เงื่อนไข (Conditions)',
      type: 'System Condition',
      translation: 'เปรียบเทียบค่าสองค่า',
      speechTh: 'คอมแพร์ทูแวลูส คือ เงื่อนไขเปรียบเทียบตัวเลขหรือข้อความสองค่าว่า มากกว่า น้อยกว่า หรือเท่ากับหรือไม่',
      speechEn: 'Compare two values',
      usage: 'ใช้ตรวจเช็กว่าตัวละครตกหลุดขอบจอด้านล่างหรือไม่ เช่น player.Y > LayoutHeight + 200',
      eventExample: {
        type: 'es',
        cond: 'System ➔ Compare two values: player.Y > LayoutHeight + 200',
        act: 'player ➔ Set position to (จุดเกิดX, จุดเกิดY)\n➔ System ➔ Subtract 1 from หัวใจ'
      }
    },
    {
      id: 'else',
      term: 'Else',
      category: 'condition',
      categoryName: '⚡ เงื่อนไข (Conditions)',
      type: 'System Condition',
      translation: 'ถ้าไม่ตรงกับเงื่อนไขก่อนหน้า (ถ้าเป็นอื่น)',
      speechTh: 'เอลส์ คือ เงื่อนไขที่จะทำงาน ต่อเมื่อเงื่อนไขก่อนหน้านี้ไม่เป็นจริง',
      speechEn: 'Else',
      usage: 'ใช้ทำทางเลือก เช่น ถ้าตอบคำตอบถูกให้เพิ่มคะแนน แต่ถ้าไม่ถูก หรือ เอลส์ ให้ลดหัวใจ',
      eventExample: {
        type: 'es',
        cond: 'player ➔ On collision with answer_orb\nanswer_orb.val = answer',
        act: 'System ➔ Add 10 to score',
        subCond: 'System ➔ Else',
        subAct: 'System ➔ Subtract 1 from หัวใจ'
      }
    },
    {
      id: 'is-moving',
      term: 'Is moving',
      category: 'condition',
      categoryName: '⚡ เงื่อนไข (Conditions)',
      type: 'Behavior Condition',
      translation: 'เมื่อตัวละครกำลังเคลื่อนที่อยู่',
      speechTh: 'อิสมูฟวิ่ง คือ เงื่อนไขตรวจสอบว่า ตัวละครกำลังเดินหรือเคลื่อนที่อยู่หรือไม่',
      speechEn: 'Is moving',
      usage: 'ใช้สลับแอนิเมชันท่าเดิน ให้ตัวละครเวลาผู้เล่นกดปุ่มเดิน',
      eventExample: {
        type: 'es',
        cond: 'player ➔ Platform ➔ Is moving',
        act: 'player ➔ Set animation to "walk"'
      }
    },

    // ==========================================
    // 🎬 หมวดหมู่ 3: การกระทำสั่งงาน (Actions)
    // ==========================================
    {
      id: 'set-position',
      term: 'Set position',
      category: 'action',
      categoryName: '🎬 การกระทำสั่งงาน (Actions)',
      type: 'Action',
      translation: 'ย้ายตำแหน่งวัตถุไปยังพิกัด X, Y',
      speechTh: 'เซตโพซิชัน คือ คำสั่งย้ายตัวละครหรือวัตถุ ไปยังตำแหน่งพิกัด เอ็กซ์ และ วาย ที่กำหนดทันที',
      speechEn: 'Set position',
      usage: 'ใช้เมื่อตัวละครตกฉากแล้วต้องการให้ย้ายกลับมาเกิดที่จุดเช็กพอยต์เดิม',
      eventExample: {
        type: 'es',
        cond: 'player ➔ Y > LayoutHeight + 200',
        act: 'player ➔ Set position to (จุดเกิดX, จุดเกิดY)'
      }
    },
    {
      id: 'set-animation',
      term: 'Set animation',
      category: 'action',
      categoryName: '🎬 การกระทำสั่งงาน (Actions)',
      type: 'Action',
      translation: 'เปลี่ยนท่าทางแอนิเมชัน',
      speechTh: 'เซตแอนิเมชัน คือ คำสั่งเปลี่ยนท่าทางของตัวละคร เช่น สลับเป็นท่าเดิน ท่ายืน หรือท่ากระโดด',
      speechEn: 'Set animation',
      usage: 'ใช้เปลี่ยนท่าทางของตัวละครให้ตรงกับสถานะขณะนั้น เช่น สลับไปเล่นท่า "walk" เมื่อเดิน',
      eventExample: {
        type: 'es',
        cond: 'player ➔ Platform ➔ On floor',
        act: 'player ➔ Set animation to "Stand"'
      }
    },
    {
      id: 'destroy',
      term: 'Destroy',
      category: 'action',
      categoryName: '🎬 การกระทำสั่งงาน (Actions)',
      type: 'Action',
      translation: 'ทำลายและลบวัตถุออกจากฉาก',
      speechTh: 'ดิสทรอย คือ คำสั่งลบวัตถุนั้นออกจากเกมทันทีเพื่อคืนหน่วยความจำ',
      speechEn: 'Destroy',
      usage: 'ใช้เมื่อเก็บดาว เหยียบศัตรูตาย หรือกระสุนลอยหลุดออกนอกฉาก',
      eventExample: {
        type: 'es',
        cond: 'player ➔ On collision with coin',
        act: 'coin ➔ Destroy'
      }
    },
    {
      id: 'spawn-another-object',
      term: 'Spawn another object',
      category: 'action',
      categoryName: '🎬 การกระทำสั่งงาน (Actions)',
      type: 'Action',
      translation: 'สร้างวัตถุใหม่ขึ้นมาจากวัตถุเดิม',
      speechTh: 'สปอว์นออบเจกต์ คือ คำสั่งสร้างวัตถุชิ้นใหม่ขึ้น ณ ตำแหน่งวัตถุปัจจุบัน',
      speechEn: 'Spawn another object',
      usage: 'ใช้เสกกระสุนออกจากตัวมอนสเตอร์ หรือสร้างเอฟเฟกต์ระเบิดเมื่อศัตรูโดนโจมตี',
      eventExample: {
        type: 'es',
        cond: 'monster ➔ Every 2 seconds',
        act: 'monster ➔ Spawn emon_bullet on Image point 1'
      }
    },
    {
      id: 'set-mirrored',
      term: 'Set mirrored',
      category: 'action',
      categoryName: '🎬 การกระทำสั่งงาน (Actions)',
      type: 'Action',
      translation: 'พลิกภาพกลับด้านซ้ายขวา',
      speechTh: 'เซตมิเรอร์ด คือ คำสั่งกลับด้านภาพตัวละคร ให้หันหน้าไปทางซ้ายหรือทางขวา',
      speechEn: 'Set mirrored',
      usage: 'ใช้กับตัวละครและมอนสเตอร์เมื่อเดินไปทางซ้ายให้ Set mirrored และเมื่อเดินขวาให้ Set not mirrored',
      eventExample: {
        type: 'es',
        cond: 'player ➔ Platform ➔ Is moving left',
        act: 'player ➔ Set mirrored (หันซ้าย)'
      }
    },
    {
      id: 'add-to-subtract-from',
      term: 'Add to / Subtract from',
      category: 'action',
      categoryName: '🎬 การกระทำสั่งงาน (Actions)',
      type: 'Action',
      translation: 'เพิ่มค่า หรือ ลดค่าตัวแปร',
      speechTh: 'แอดทู และ ซับแทรกต์ฟรอม คือ คำสั่งบวกเพิ่ม หรือลบหักค่าตัวเลขในตัวแปร เช่น เพิ่มคะแนน หรือลดหัวใจ',
      speechEn: 'Add to or Subtract from variable',
      usage: 'ใช้เมื่อเก็บดาวได้ให้ Add 10 to score หรือโดนศัตรูให้ Subtract 1 from หัวใจ',
      eventExample: {
        type: 'es',
        cond: 'player ➔ On collision with star',
        act: 'System ➔ Add 10 to score'
      }
    },
    {
      id: 'set-text',
      term: 'Set text',
      category: 'action',
      categoryName: '🎬 การกระทำสั่งงาน (Actions)',
      type: 'Action',
      translation: 'เปลี่ยนตัวหนังสือบนข้อความ Text',
      speechTh: 'เซตเท็กซ์ คือ คำสั่งเปลี่ยนข้อความตัวหนังสือที่จะแสดงบนหน้าจอ',
      speechEn: 'Set text',
      usage: 'ใช้ในการอัปเดตข้อความคะแนน เวลา หรือคำถามคณิตศาสตร์บนหน้าจอ HUD',
      eventExample: {
        type: 'es',
        cond: 'System ➔ Every tick',
        act: 'txtScore ➔ Set text to "คะแนน: " & score'
      }
    },
    {
      id: 'go-to-layout',
      term: 'Go to layout',
      category: 'action',
      categoryName: '🎬 การกระทำสั่งงาน (Actions)',
      type: 'Action',
      translation: 'เปลี่ยนไปยังฉากอื่นที่ต้องการ',
      speechTh: 'โกทูเลย์เอาต์ คือ คำสั่งย้ายการเล่นไปยังฉากใหม่ เช่น เปลี่ยนจากหน้าเมนูเข้าสู่ฉากเกม',
      speechEn: 'Go to layout',
      usage: 'ใช้เมื่อกดปุ่มเริ่มเกม เคลียร์ด่านผ่านแล้วเปลี่ยนไปด่าน 2 หรือหัวใจหมดแล้วกลับหน้า title',
      eventExample: {
        type: 'es',
        cond: 'player ➔ On collision with gate\nSystem ➔ score >= 100',
        act: 'System ➔ Go to layout "game2"'
      }
    },

    // ==========================================
    // 🧩 หมวดหมู่ 4: พฤติกรรมตัวละคร (Behaviors)
    // ==========================================
    {
      id: 'solid',
      term: 'Solid',
      category: 'behavior',
      categoryName: '🧩 พฤติกรรม (Behaviors)',
      type: 'Behavior',
      translation: 'วัตถุเนื้อแข็ง ชนทะลุไม่ได้',
      speechTh: 'โซลิด คือ พฤติกรรมวัตถุแข็ง ชนทะลุไม่ได้ ใช้ใส่กับพื้นดิน กำแพง หรือสิ่งกีดขวาง',
      speechEn: 'Solid behavior',
      usage: 'ใส่ที่วัตถุพื้นดิน (ground / TiledBackground) เพื่อให้ตัวละครยืนบนพื้นได้โดยไม่จมตกฉาก',
      eventExample: {
        type: 'props',
        title: 'Properties: ground (TiledBackground)',
        detail: 'Behaviors ➔ Add ➔ Solid (ตัวละครเดินชนและยืนบนพื้นได้)'
      }
    },
    {
      id: 'platform',
      term: 'Platform',
      category: 'behavior',
      categoryName: '🧩 พฤติกรรม (Behaviors)',
      type: 'Behavior',
      translation: 'การเดินและกระโดดสไตล์เกมแพลตฟอร์ม',
      speechTh: 'แพลตฟอร์ม คือ พฤติกรรมควบคุมตัวละครให้เดิน ซ้าย ขวา มีแรงโน้มถ่วง และกระโดดได้ด้วยปุ่มคีย์บอร์ด',
      speechEn: 'Platform behavior',
      usage: 'ใส่ที่ตัวละครหลัก (player) หรือมอนสเตอร์ เพื่อให้มีแรงโน้มถ่วงและเคลื่อนที่บนพื้นได้',
      eventExample: {
        type: 'props',
        title: 'Properties: player (Sprite)',
        detail: 'Behaviors ➔ Add ➔ Platform\nMax speed: 200 | Jump strength: 650 | Max jumps: 2'
      }
    },
    {
      id: 'jump-thru',
      term: 'Jump-thru',
      category: 'behavior',
      categoryName: '🧩 พฤติกรรม (Behaviors)',
      type: 'Behavior',
      translation: 'เกาะกระโดดทะลุจากล่างขึ้นบนได้',
      speechTh: 'จัมป์ทรู คือ พฤติกรรมเกาะลอยฟ้า กระโดดทะลุผ่านขึ้นมาจากด้านล่างได้ แต่ยืนเหยียบข้างบนได้',
      speechEn: 'Jump-thru behavior',
      usage: 'ใส่ที่เกาะลอยฟ้า (sky1, sky2) เพื่อให้ผู้เล่นกระโดดทะลุเกาะขึ้นไปยืนข้างบนได้ง่าย',
      eventExample: {
        type: 'props',
        title: 'Properties: sky1 (Sprite)',
        detail: 'Behaviors ➔ Add ➔ Jump-thru (กระโดดทะลุจากล่าง ยืนบนเกาะได้)'
      }
    },
    {
      id: 'scroll-to',
      term: 'Scroll To',
      category: 'behavior',
      categoryName: '🧩 พฤติกรรม (Behaviors)',
      type: 'Behavior',
      translation: 'กล้องติดตามตัวละคร',
      speechTh: 'สกรอลล์ทู คือ พฤติกรรมสั่งให้มุมมองกล้องเลื่อนติดตามตัวละครไปตลอดทางในฉาก',
      speechEn: 'Scroll To behavior',
      usage: 'ใส่ที่ตัวละครหลัก (player) เพื่อให้หน้าจอกล้องเดินตามผู้เล่นไปตลอดด่านที่กว้างยาว',
      eventExample: {
        type: 'props',
        title: 'Properties: player (Sprite)',
        detail: 'Behaviors ➔ Add ➔ Scroll To (กล้องติดตามผู้เล่นไปทั่วฉาก)'
      }
    },
    {
      id: 'bullet',
      term: 'Bullet',
      category: 'behavior',
      categoryName: '🧩 พฤติกรรม (Behaviors)',
      type: 'Behavior',
      translation: 'พุ่งไปข้างหน้าตามทิศทางตรงๆ',
      speechTh: 'บูลเล็ต คือ พฤติกรรมสั่งให้วัตถุเคลื่อนที่พุ่งไปข้างหน้าตรงๆ ด้วยความเร็วที่กำหนดเหมือนกระสุนปืน',
      speechEn: 'Bullet behavior',
      usage: 'ใส่ที่กระสุนศัตรู (emon_bullet) หรือกระสุนผู้เล่น เพื่อให้พุ่งไปโจมตีเป้าหมาย',
      eventExample: {
        type: 'props',
        title: 'Properties: emon_bullet (Sprite)',
        detail: 'Behaviors ➔ Add ➔ Bullet\nSpeed: 250 (พุ่งไปข้างหน้าด้วยความเร็ว 250)'
      }
    },
    {
      id: 'sine',
      term: 'Sine',
      category: 'behavior',
      categoryName: '🧩 พฤติกรรม (Behaviors)',
      type: 'Behavior',
      translation: 'เคลื่อนที่สลับไปมาแบบคลื่นลูกคลื่น',
      speechTh: 'ไซน์ คือ พฤติกรรมทำให้วัตถุเคลื่อนที่โยกสลับไปมา เช่น ขยับขึ้นลง หรือลอยซ้ายขวา',
      speechEn: 'Sine behavior',
      usage: 'ใส่ที่มอนสเตอร์ลาดตระเวน (eminy) หรือเกาะลอยฟ้าที่ต้องการให้ขยับขึ้นลงตลอดเวลา',
      eventExample: {
        type: 'props',
        title: 'Properties: eminy (Sprite)',
        detail: 'Behaviors ➔ Add ➔ Sine\nMovement: Horizontal | Period: 4 | Magnitude: 100'
      }
    },
    {
      id: 'flash-behavior',
      term: 'Flash',
      category: 'behavior',
      categoryName: '🧩 พฤติกรรม (Behaviors)',
      type: 'Behavior',
      translation: 'กระพริบชั่วคราว',
      speechTh: 'แฟลช คือ พฤติกรรมสั่งให้ตัวละครกระพริบเข้าออกชั่วคราว แสดงสถานะอมตะหลังโดนโจมตี',
      speechEn: 'Flash behavior',
      usage: 'ใส่ที่ตัวละครหลัก (player) แล้วสั่ง Action `player ➔ Flash for 2 seconds` เมื่อโดนศัตรู',
      eventExample: {
        type: 'es',
        cond: 'player ➔ On collision with monster',
        act: 'player ➔ Flash (ON: 0.1s, OFF: 0.1s, Duration: 2s)'
      }
    },
    {
      id: 'destroy-outside-layout',
      term: 'Destroy outside layout',
      category: 'behavior',
      categoryName: '🧩 พฤติกรรม (Behaviors)',
      type: 'Behavior',
      translation: 'ลบตัวเองทิ้งอัตโนมัติเมื่อลอยออกนอกฉาก',
      speechTh: 'ดิสทรอยเอาต์ไซด์เลย์เอาต์ คือ พฤติกรรมที่ลบวัตถุทิ้ง ทันทีที่ลอยพ้นขอบฉากออกไป',
      speechEn: 'Destroy outside layout behavior',
      usage: 'ใส่คู่กับกระสุนปืน เพื่อลบกระสุนทิ้งเมื่อยิงพลาดไม่โดนเป้าและลอยหลุดขอบจอ',
      eventExample: {
        type: 'props',
        title: 'Properties: emon_bullet (Sprite)',
        detail: 'Behaviors ➔ Add ➔ Destroy outside layout (ลบกระสุนเมื่อหลุดจอ)'
      }
    },

    // ==========================================
    // 📊 หมวดหมู่ 5: ตัวแปรและข้อมูล (Data & Variables)
    // ==========================================
    {
      id: 'global-variable',
      term: 'Global Variable',
      category: 'variable',
      categoryName: '📊 ตัวแปร & ข้อมูล',
      type: 'Variable',
      translation: 'ตัวแปรกลางที่ใช้ร่วมกันได้ทุกฉาก',
      speechTh: 'โกลบอลแวริเอเบิล คือ ตัวแปรกลางที่เก็บข้อมูลสำคัญ สามารถเรียกใช้หรือแก้ไขร่วมกันได้ในทุกๆ ฉากของเกม',
      speechEn: 'Global Variable',
      usage: 'ใช้เก็บค่าสำคัญระดับเกม เช่น ตัวแปร `score` (คะแนน), `หัวใจ` (ชีวิต) หรือ `timer` (เวลา)',
      eventExample: {
        type: 'es',
        cond: 'System ➔ Add Global Variable',
        act: 'Name: score | Type: Number | Initial value: 0'
      }
    },
    {
      id: 'instance-variable',
      term: 'Instance Variable',
      category: 'variable',
      categoryName: '📊 ตัวแปร & ข้อมูล',
      type: 'Variable',
      translation: 'ตัวแปรส่วนตัวที่ติดอยู่กับวัตถุตัวนั้นๆ',
      speechTh: 'อินสแตนซ์แวริเอเบิล คือ ตัวแปรประจำตัวของวัตถุแต่ละชิ้น ซึ่งวัตถุแต่ละตัวจะมีค่าส่วนตัวไม่ซ้ำกัน',
      speechEn: 'Instance Variable',
      usage: 'ใช้เก็บค่าประจำตัว เช่น `heart.index` (0-4), `answer_orb.val` (0-9) หรือ `monster.hp` (เลือดมอนสเตอร์)',
      eventExample: {
        type: 'props',
        title: 'Properties: answer_orb (Sprite)',
        detail: 'Instance Variables ➔ Add ➔ val (Number = 5) (เก็บคำตอบประจำเกาะนั้น)'
      }
    },
    {
      id: 'array',
      term: 'Array',
      category: 'variable',
      categoryName: '📊 ตัวแปร & ข้อมูล',
      type: 'Data Structure',
      translation: 'ตารางเก็บข้อมูลหลายๆ ช่อง',
      speechTh: 'อาร์เรย์ คือ ตารางจัดเก็บข้อมูลเป็นช่องๆ ช่วยให้จัดการข้อมูลจำนวนมากได้ง่ายขึ้น',
      speechEn: 'Array object',
      usage: 'ใช้เก็บรายการชุดโจทย์คณิตศาสตร์ รายการคำตอบ หรือตารางคะแนน Top 5',
      eventExample: {
        type: 'es',
        cond: 'System ➔ On start of layout',
        act: 'qArray ➔ Set size (10, 1, 1)\n➔ qArray ➔ Set at index 0 to 15'
      }
    },
    {
      id: 'dictionary',
      term: 'Dictionary',
      category: 'variable',
      categoryName: '📊 ตัวแปร & ข้อมูล',
      type: 'Data Structure',
      translation: 'พจนานุกรมเก็บข้อมูลแบบจับคู่ Key และ Value',
      speechTh: 'ดิคชันนารี คือ โครงสร้างเก็บข้อมูลแบบจับคู่ชื่อคีย์และค่าข้อมูล เช่น คีย์ ชื่อผู้เล่น เท่ากับ สมชาย',
      speechEn: 'Dictionary object',
      usage: 'ใช้สำหรับเตรียมข้อมูลการเซฟเกม แปลงเป็นข้อความ JSON แล้วบันทึกลงเครื่องผ่าน WebStorage',
      eventExample: {
        type: 'es',
        cond: 'System ➔ On save game',
        act: 'Dictionary ➔ Add key "playerName" with value "สมชาย"\n➔ Dictionary ➔ Add key "unlockedLevel" with value 3'
      }
    },
    {
      id: 'webstorage',
      term: 'WebStorage',
      category: 'variable',
      categoryName: '📊 ตัวแปร & ข้อมูล',
      type: 'Storage',
      translation: 'ระบบบันทึกข้อมูลลงเครื่องผู้เล่น',
      speechTh: 'เว็บสตอเรจ คือ วัตถุใช้บันทึกข้อมูลคะแนนและด่านที่ผ่านลงในเบราว์เซอร์ เพื่อให้เปิดกลับมาเล่นต่อได้แม้ปิดคอมพิวเตอร์ไปแล้ว',
      speechEn: 'WebStorage object',
      usage: 'ใช้บันทึกคะแนนสูงสุด บันทึกด่านที่ปลดล็อกแล้ว หรือเซฟชื่อผู้เล่นลงใน LocalStorage',
      eventExample: {
        type: 'es',
        cond: 'player ➔ On collision with goalFlag',
        act: 'WebStorage ➔ Set local key "savedScore" to score'
      }
    },
    {
      id: 'function',
      term: 'Function',
      category: 'variable',
      categoryName: '📊 ตัวแปร & ข้อมูล',
      type: 'Logic',
      translation: 'ชุดคำสั่งสำเร็จรูปที่เรียกใช้ซ้ำได้',
      speechTh: 'ฟังก์ชัน คือ การรวมกลุ่มคำสั่งที่ใช้บ่อยไว้เป็นก้อนเดียว แล้วตั้งชื่อเรียกใช้ เพื่อลดการเขียนโค้ดซ้ำหลายรอบ',
      speechEn: 'Function object',
      usage: 'ใช้สร้างชุดคำสั่งลดเลือด `ApplyDamage` หรือชุดคำสั่งสร้างโจทย์ `SpawnQuestion` แล้วเรียกใช้จากหลายจุด',
      eventExample: {
        type: 'es',
        cond: 'Function ➔ On function "ApplyDamage"',
        act: 'System ➔ Subtract 1 from หัวใจ\n➔ player ➔ Flash for 2 seconds\n➔ Audio ➔ Play "hurt"'
      }
    }
  ];

  window.GLOSSARY_DATA = GLOSSARY_DATA;

})(window);
