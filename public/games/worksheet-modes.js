(function enhanceWorksheetModes() {
  const baseRender = window.render;
  const controls = document.querySelector('.toolbar-ctrls');
  const pageCountSelect = document.getElementById('selPageCount');
  const styleSelect = document.getElementById('selStyle');
  const countSelect = document.getElementById('selCount');

  if (typeof baseRender !== 'function' || !controls || !pageCountSelect || !styleSelect) return;

  const modeSelect = document.createElement('select');
  modeSelect.className = 't-select';
  modeSelect.id = 'selUseMode';
  modeSelect.setAttribute('aria-label', 'วัตถุประสงค์การใช้ใบงาน');
  modeSelect.innerHTML = [
    '<option value="standard">ใช้สอน: ใบงานปกติ</option>',
    '<option value="differentiated">ใช้สอน: แยกระดับ A–B–C</option>',
    '<option value="exit">ใช้สอน: ตรวจเร็วท้ายคาบ</option>',
    '<option value="diagnostic">ใช้สอน: วินิจฉัยก่อนเรียน</option>',
    '<option value="remedial">ใช้สอน: ซ่อมเสริมเฉพาะจุด</option>'
  ].join('');
  styleSelect.insertAdjacentElement('afterend', modeSelect);

  let savedPageCount = pageCountSelect.value;
  let savedStyle = styleSelect.value;
  let savedCount = countSelect?.value || '';
  let previousMode = 'standard';

  const subjectGuides = [
    {
      match: 'data-chart-worksheet',
      skills: ['อ่านตารางข้อมูล', 'กำหนดสเกล', 'สร้างแผนภูมิ', 'เปรียบเทียบค่า', 'สรุปจากข้อมูล'],
      steps: ['อ่านชื่อชุดข้อมูลและหน่วย', 'หาค่ามากสุดเพื่อกำหนดสเกล', 'วางแท่งหรือสัญลักษณ์ให้ตรงค่า', 'คำนวณผลต่างหรือผลรวม', 'เขียนข้อสรุปพร้อมหน่วย']
    },
    {
      match: 'fact-opinion-worksheet',
      skills: ['อ่านใจความ', 'หาคำบอกเหตุ', 'จำแนกข้อความ', 'ยกหลักฐาน', 'อธิบายเหตุผล'],
      steps: ['อ่านข้อความให้จบ', 'ขีดคำที่แสดงข้อมูลหรือความรู้สึก', 'ถามว่าตรวจสอบได้หรือไม่', 'เลือกประเภทข้อความ', 'เขียนหลักฐานสนับสนุน']
    },
    {
      match: 'phonics-worksheet',
      skills: ['รู้รูปตัวอักษร', 'เชื่อมเสียง', 'หาเสียงต้น/ท้าย', 'แยกเสียงประสม', 'เขียนคำตัวอย่าง'],
      steps: ['ดูตัวอักษรหรือกลุ่มเสียง', 'ฟังเสียงจากสื่อ', 'ออกเสียงช้า ๆ', 'วงคำที่มีเสียงเป้าหมาย', 'เขียนคำเพิ่มอีกหนึ่งคำ']
    },
    {
      match: 'water-cycle-worksheet',
      skills: ['เรียงลำดับ', 'ใช้คำวิทยาศาสตร์', 'เชื่อมเหตุและผล', 'อ่านแผนภาพ', 'อธิบายความเป็นวัฏจักร'],
      steps: ['หาพลังงานเริ่มต้น', 'เรียงระเหยและควบแน่น', 'เชื่อมหยาดน้ำฟ้ากับการรวมตัว', 'เขียนเหตุผลของแต่ละลูกศร', 'ตรวจว่าลำดับวนกลับจุดเริ่มได้']
    },
    {
      match: 'food-label-worksheet',
      skills: ['อ่านหน่วยบริโภค', 'หาค่าสารอาหาร', 'คูณตามจำนวนที่กิน', 'เปรียบเทียบค่า', 'ตัดสินใจพร้อมเหตุผล'],
      steps: ['อ่านหนึ่งหน่วยบริโภค', 'วงค่าที่โจทย์ถาม', 'คูณเมื่อกินมากกว่าหนึ่งหน่วย', 'เปรียบเทียบกับเป้าหมายสุขภาพ', 'เขียนคำเลือกโดยอ้างค่าจากฉลาก']
    },
    {
      match: 'rect-area-worksheet',
      skills: ['เลือกสูตร', 'อ่านค่าจากรูป', 'แทนค่า', 'คำนวณ', 'เขียนหน่วย²'],
      steps: ['ระบุชนิดรูป', 'วงค่าที่โจทย์ให้', 'เลือกสูตรพื้นที่', 'แทนค่าและคำนวณ', 'เติมตารางหน่วย']
    },
    {
      match: 'multiplication-worksheet',
      skills: ['ค่าประจำหลัก', 'ตั้งคูณ', 'คูณทีละหลัก', 'ทดเลข', 'ตรวจผลคูณ'],
      steps: ['จัดตัวเลขให้ตรงหลัก', 'คูณจากหลักหน่วย', 'เขียนตัวทด', 'รวมผลคูณย่อย', 'ประมาณค่าเพื่อตรวจ']
    },
    {
      match: 'division-worksheet',
      skills: ['ตั้งหาร', 'เลือกจำนวนคูณ', 'ลบระหว่างขั้น', 'จัดการเศษ', 'ตรวจผลหาร'],
      steps: ['เขียนตัวตั้งและตัวหาร', 'หารทีละหลัก', 'คูณกลับ', 'ลบแล้วดึงหลักถัดไป', 'ตรวจด้วยผลหาร × ตัวหาร']
    },
    {
      match: 'short-division-worksheet',
      skills: ['ตั้งหารสั้น', 'หารทีละหลัก', 'ทดเศษ', 'เขียนผลหาร', 'ตรวจด้วยคูณ'],
      steps: ['เขียนตัวหาร ) ตัวตั้ง', 'หารทีละหลัก', 'ทดเศษตัวเล็กหน้าหลักถัดไป', 'เขียนผลหารใต้เส้น', 'ตรวจด้วยผลหาร × ตัวหาร']
    },
    {
      match: 'divide-by-2-worksheet',
      skills: ['แบ่งครึ่ง', 'คิดครึ่งหนึ่ง', 'แยกหลัก', 'ตรวจด้วย ×2', 'สรุปคำตอบ'],
      steps: ['อ่านตัวตั้งที่เป็นเลขคู่', 'คิด ? + ? = ตัวตั้ง', 'แยกหลักเมื่อเลขใหญ่', 'ตรวจคำตอบ × 2', 'เขียนคำตอบ']
    },
    {
      match: 'math-24-worksheet',
      skills: ['วางแผนหา 24', 'ใช้เลขครบ 4 ตัว', 'คำนวณทีละขั้น', 'ตรวจผล', 'เลือกกลยุทธ์'],
      steps: ['ดูเลข 4 ตัวและเป้า 24', 'หาคู่คูณ/บวกใกล้ 24', 'คำนวณทีละขั้น', 'ตรวจใช้ครบ 4 ตัว', 'ยืนยันผลได้ 24']
    },
    {
      match: 'angle-worksheet',
      skills: ['ดูรูปมุม', 'เทียบกับ 90°', 'จำแนกชนิด', 'อ่านขนาด', 'อธิบายเหตุผล'],
      steps: ['หาจุดมุมและแขนมุม', 'เทียบกับมุมฉาก 90°', 'เลือกแหลม/ฉาก/ป้าน/ตรง', 'อ่านหรือประมาณองศา', 'เขียนเหตุผลสั้น ๆ']
    },
    {
      match: 'decimal-worksheet',
      skills: ['อ่านค่าประจำหลัก', 'จัดจุดทศนิยม', 'เปรียบเทียบ', 'บวกลบ', 'ใช้ในชีวิตจริง'],
      steps: ['เขียนตารางหลัก', 'จัดจุดทศนิยมให้ตรง', 'เทียบหรือคำนวณทีละหลัก', 'ตรวจด้วยประมาณค่า', 'ตอบพร้อมหน่วย']
    },
    {
      match: 'number-line-worksheet',
      skills: ['ระบุตำแหน่ง', 'เปรียบเทียบซ้าย–ขวา', 'เรียงลำดับ', 'กระโดดบวกลบ', 'ทำเครื่องหมาย'],
      steps: ['ดูปลายเส้นและขีด', 'หาตำแหน่งของจำนวน', 'เทียบซ้ายน้อยกว่าขวามากกว่า', 'กระโดดทีละช่องถ้าโจทย์บวกลบ', 'ทำเครื่องหมายและสรุป']
    },
    {
      match: 'plant-parts-worksheet',
      skills: ['ระบุส่วนพืช', 'อธิบายหน้าที่', 'เชื่อมอาหาร', 'เรียงการเติบโต', 'ให้เหตุผล'],
      steps: ['ดูรูป/โจทย์', 'เลือกส่วน ราก ลำต้น ใบ ดอก', 'อธิบายหน้าที่', 'เชื่อมชีวิตประจำวัน', 'สรุปคำตอบ']
    },
    {
      match: 'food-chain-worksheet',
      skills: ['เรียงห่วงโซ่', 'ระบุบทบาท', 'อ่านลูกศรพลังงาน', 'วิเคราะห์ผลกระทบ', 'ยกตัวอย่าง'],
      steps: ['หาผู้ผลิต', 'เรียงผู้บริโภค', 'ระบุผู้ย่อยสลาย', 'ดูทิศทางลูกศร', 'วิเคราะห์ถ้าขาดตัวใด']
    },
    {
      match: 'moon-phases-worksheet',
      skills: ['เรียงข้างขึ้น', 'เรียกชื่อเฟส', 'ดูรูปร่าง', 'อธิบายเหตุ', 'เชื่อมดวงอาทิตย์'],
      steps: ['ดูวงจันทร์', 'เรียงลำดับ', 'เรียกชื่อเฟส', 'เชื่อมแสงอาทิตย์', 'สรุป']
    },
    {
      match: 'digestive-worksheet',
      skills: ['เรียงทางเดินอาหาร', 'หน้าที่อวัยวะ', 'เปรียบเทียบส่วน', 'ดูแลสุขภาพ', 'ให้เหตุผล'],
      steps: ['เรียงปาก→…→ลำไส้', 'จับคู่หน้าที่', 'เปรียบเทียบส่วน', 'เชื่อมพฤติกรรมสุขภาพ', 'สรุป']
    },
    {
      match: 'food-groups-worksheet',
      skills: ['จัดหมู่ 5 หมู่', 'อธิบายประโยชน์', 'จัดจานสมดุล', 'เลือกอาหาร', 'วางแผนมื้อ'],
      steps: ['ดูอาหาร', 'เลือกหมู่', 'อธิบายประโยชน์', 'วางแผนจาน', 'สรุป']
    },
    {
      match: 'handwash-worksheet',
      skills: ['เรียง 7 ขั้น', 'อธิบายวิธีทำ', 'บอกเหตุผล', 'เลือกเวลาล้าง', 'ไม่ข้ามขั้น'],
      steps: ['นึก 7 ขั้น', 'เรียงลำดับ', 'อธิบายวิธี', 'บอกทำไม', 'เชื่อมชีวิตประจำวัน']
    },
    {
      match: 'bone-muscle-worksheet',
      skills: ['ระบุกระดูก/กล้ามเนื้อ/ข้อต่อ', 'อธิบายหน้าที่', 'วิธีดูแล', 'เชื่อมอาหารออกกำลัง', 'ป้องกันบาดเจ็บ'],
      steps: ['ระบุส่วน', 'อธิบายหน้าที่', 'หาปัญหา', 'เลือกวิธีดูแล', 'สรุปผล']
    },
    {
      match: 'waste-sort-worksheet',
      skills: ['จำแนกถัง', 'ใช้เกณฑ์แยก', 'อธิบายเหตุผล', 'แนวปฏิบัติโรงเรียน', 'ลดขยะ'],
      steps: ['สังเกตขยะ', 'ใช้เกณฑ์', 'เลือกถัง', 'อธิบายเหตุผล', 'บอกแนวปฏิบัติ']
    },
    {
      match: 'community-jobs-worksheet',
      skills: ['ระบุอาชีพ', 'จัดกลุ่มบริการ/ผลิต/ค้า', 'อธิบายหน้าที่', 'ประโยชน์ชุมชน', 'สำรวจตัวเอง'],
      steps: ['อ่านหน้าที่', 'ระบุอาชีพ', 'จัดกลุ่ม', 'บอกประโยชน์', 'เชื่อมความสนใจ']
    },
    {
      match: 'good-citizen-worksheet',
      skills: ['อ่านสถานการณ์', 'เลือกการกระทำ', 'เชื่อมคุณธรรม', 'ให้เหตุผล', 'นำไปใช้'],
      steps: ['อ่านสถานการณ์', 'เลือกพฤติกรรม', 'วงคุณธรรม', 'เขียนเหตุผล', 'นำไปใช้']
    },
    {
      match: 'sufficiency-worksheet',
      skills: ['จำ 3 ห่วง', 'จำ 2 เงื่อนไข', 'เลือกห่วงตามสถานการณ์', 'วางแผนพอเพียง', 'ให้เหตุผล'],
      steps: ['ดูแผนภาพ 3 ห่วง', 'ดู 2 เงื่อนไข', 'อ่านสถานการณ์', 'เลือกห่วง/เงื่อนไข', 'เขียนการกระทำ']
    },
    {
      match: 'reading-hub-worksheet',
      skills: ['อ่านใจความ', 'หาหลักฐาน', 'แยกรายละเอียด', 'อนุมาน', 'สรุป'],
      steps: ['อ่านข้อความทั้งหมด', 'ขีดหลักฐาน', 'ติ๊ก ใจความ/รายละเอียด/อนุมาน', 'เขียนสรุปสั้น', 'ตรวจว่าตรงหลักฐาน']
    },
    {
      match: 'writing-hub-worksheet',
      skills: ['วางแผนเรื่อง', 'เขียนเริ่ม–เหตุการณ์–จบ', 'ตรวจภาษา', 'แก้ประโยค', 'เขียนใหม่'],
      steps: ['ใส่ช่อง เริ่ม|เหตุการณ์|จบ', 'ร่างประโยค', 'หาจุดผิด', 'แก้ในช่องถูก', 'อ่านทวน']
    },
    {
      match: 'grammar-hub-worksheet',
      skills: ['จำแนกชนิดคำ', 'หาประธาน', 'หากริยา', 'หากรรม', 'จัด S→V→O'],
      steps: ['อ่านประโยค', 'ติ๊กชนิดคำ', 'ใส่ช่อง S V O', 'ตรวจลำดับ', 'สรุปกฎ']
    },
    {
      match: 'sentence-hub-worksheet',
      skills: ['จำแนกชนิดประโยค', 'รวมประโยค', 'แยกส่วน', 'ใช้คำเชื่อม', 'ตรวจความหมาย'],
      steps: ['อ่านประโยค', 'ติ๊กชนิด', 'ใช้ word-bank รวม', 'จัด SVO', 'อ่านทวนความหมาย']
    },
    {
      match: 'grammar-mini-worksheet',
      skills: ['แยกเอก/พหู', 'เลือก is/are', 'เลือก a/an', 'เลือก this/that', 'เขียนประโยค'],
      steps: ['หา clue เอก/พหูหรือเสียงต้น', 'เลือกกฎ', 'เขียนประโยค', 'ยก evidence', 'ตรวจ']
    },
    {
      match: 'sight-words-worksheet',
      skills: ['จำความหมายคำ', 'ใช้ word-bank', 'เติมในประโยค', 'เปรียบเทียบคำ', 'สร้างประโยค'],
      steps: ['ดูคำใน bank', 'เลือกความหมาย', 'เติมในประโยค', 'เขียนประโยคเอง', 'ตรวจคำสะกด']
    },
    {
      match: 'follow-instructions-worksheet',
      skills: ['อ่านคำกริยาคำสั่ง', 'หาคำเป้า', 'Circle', 'Underline', 'Tick'],
      steps: ['อ่านคำสั่งครบ', 'วงคำกริยา', 'หาคำเป้า', 'ทำตามคำสั่ง', 'ตรวจว่าทำครบ']
    },
    {
      match: 'fraction-hub-worksheet',
      skills: ['อ่านเศษ/ส่วน', 'ดูแถบเศษส่วน', 'เปรียบเทียบ', 'ย่อขยาย', 'บวกลบส่วนเท่า'],
      steps: ['ดูแถบหรือสัญลักษณ์', 'หาเศษกับส่วน', 'เปรียบเทียบหรือทำส่วนเท่า', 'คำนวณ', 'สรุปคำตอบ']
    },
    {
      match: 'word-problem-hub-worksheet',
      skills: ['อ่านโจทย์', 'เลือกเครื่องหมาย', 'เขียนสมการ', 'คำนวณ', 'ตรวจคำตอบ'],
      steps: ['ขีดคำสำคัญ', 'เลือก + − × ÷', 'เขียนสมการ', 'คำนวณ', 'ตรวจด้วยย้อนกลับ']
    },
    {
      match: 'bar-chart-worksheet',
      skills: ['อ่านตาราง', 'อ่านแท่ง', 'เปรียบเทียบ', 'หาผลรวม', 'กำหนดสเกล'],
      steps: ['อ่านค่าจากตาราง', 'ดูความสูงแท่ง', 'เปรียบเทียบหรือรวม', 'ตรวจสเกล', 'สรุป']
    },
    {
      match: 'decimal-hub-worksheet',
      skills: ['อ่านทศนิยม', 'จัดค่าประจำหลัก', 'เปรียบเทียบ', 'บวกลบจัดจุด', 'สรุป'],
      steps: ['เขียนตารางหลัก', 'จัดจุดให้ตรง', 'เทียบหรือคำนวณ', 'ตรวจ', 'ตอบ']
    },
    {
      match: 'geometry-hub-worksheet',
      skills: ['จำแนกรูป', 'จำแนกมุม', 'หาเส้นรอบ', 'หาพื้นที่', 'เลือกสูตร'],
      steps: ['ดูรูป', 'ติ๊กชนิด', 'เลือกสูตร', 'คำนวณ', 'สรุปพร้อมหน่วย']
    },
    {
      match: 'fraction-pieces-worksheet',
      skills: ['อ่านแถบเศษส่วน', 'เปรียบเทียบ', 'ย่อขยาย', 'บวกส่วนเท่า', 'สรุป'],
      steps: ['ดูแถบ', 'หาเศษ/ส่วน', 'เทียบหรือคำนวณ', 'ย่อถ้าได้', 'ตอบ']
    },
    {
      match: 'script-hub-worksheet',
      skills: ['จำแนกพยัญชนะ', 'รู้สระ', 'รู้วรรณยุกต์', 'สะกดคำ', 'แยกพยางค์'],
      steps: ['ดูตัวอักษร', 'นึกกฎ', 'เลือกชนิด', 'เขียน/สะกด', 'ตรวจ']
    },
    {
      match: 'idiom-hub-worksheet',
      skills: ['อ่านสำนวน', 'หาความหมาย', 'ใช้ในบริบท', 'ยกตัวอย่าง', 'สรุป'],
      steps: ['อ่านสำนวน', 'ตีความ', 'เลือกความหมาย', 'ใช้ในประโยค', 'ตรวจ']
    },
    {
      match: 'poetry-hub-worksheet',
      skills: ['อ่านบทร้อยกรอง', 'หาสัมผัส', 'รู้ฉันทลักษณ์', 'ตีความ', 'สรุป'],
      steps: ['อ่านบท', 'หาสัมผัส/จังหวะ', 'ใช้กฎ', 'ตีความ', 'สรุป']
    },
    {
      match: 'punctuation-hub-worksheet',
      skills: ['รู้เครื่องหมาย', 'เลือกใช้', 'ใส่ในประโยค', 'ตรวจความหมาย', 'สรุป'],
      steps: ['ดูประโยค', 'เลือกเครื่องหมาย', 'ใส่ตำแหน่ง', 'อ่านทวน', 'สรุป']
    },
    {
      match: 'literature-hub-worksheet',
      skills: ['อ่านเรื่อง', 'วิเคราะห์ตัวละคร', 'หาข้อคิด', 'เชื่อมชีวิต', 'สรุป'],
      steps: ['อ่านใจความ', 'วิเคราะห์', 'หาข้อคิด', 'เชื่อมตนเอง', 'สรุป']
    },
    {
      match: 'thai-word-types-worksheet',
      skills: ['จำแนกนาม', 'จำแนกกริยา', 'จำแนกคุณศัพท์', 'วิเคราะห์ในประโยค', 'สรุป'],
      steps: ['ดูคำ', 'ดูหน้าที่', 'ติ๊กชนิด', 'ตรวจในประโยค', 'สรุป']
    },
    {
      match: 'thailand-hub-worksheet',
      skills: ['รู้ภูมิภาค', 'วัฒนธรรม', 'ประวัติศาสตร์', 'หน้าที่พลเมือง', 'ให้เหตุผล'],
      steps: ['จำแนกหัวข้อ', 'หาหลักฐาน', 'เลือกคำตอบ', 'เขียนเหตุผล', 'สรุป']
    },
    {
      match: 'color-wheel-worksheet',
      skills: ['รู้แม่สี', 'ผสมสี', 'วรรณะอุ่น/เย็น', 'คู่ตัด', 'เลือกตามอารมณ์'],
      steps: ['ดูวงล้อ', 'ระบุแม่สี/คู่ผสม', 'ได้สีผลลัพธ์', 'จัดวรรณะ', 'สรุป']
    },
    {
      match: 'vocab-grammar-worksheet',
      skills: ['อ่านคำ', 'จำแนกหลักภาษา', 'เลือกคำตอบ', 'เขียนสะกด', 'ตรวจความหมาย'],
      steps: ['อ่านคำให้ครบพยางค์', 'สังเกตตัวสะกดหรือหน้าที่คำ', 'นึกถึงกฎที่เกี่ยวข้อง', 'เขียนคำตอบให้ครบ', 'อ่านทวนความหมาย']
    },
    {
      match: 'grammar-vocab-worksheet',
      skills: ['อ่านคำสั่ง', 'รู้คำศัพท์', 'เลือกกฎไวยากรณ์', 'ผันคำ', 'ตรวจประโยค'],
      steps: ['อ่านประโยคทั้งหมด', 'หาคำสำคัญ', 'เลือกกฎไวยากรณ์', 'เติมหรือผันคำ', 'อ่านประโยคซ้ำอีกครั้ง']
    },
    {
      match: 'science-explorer-worksheet',
      skills: ['สังเกตข้อมูล', 'จำแนก', 'เชื่อมเหตุผล', 'ใช้คำวิทยาศาสตร์', 'สรุปผล'],
      steps: ['อ่านข้อมูลหรือภาพ', 'ระบุสิ่งที่โจทย์ถาม', 'เชื่อมกับหลักวิทยาศาสตร์', 'ตัดตัวเลือกที่ไม่เกี่ยว', 'สรุปด้วยคำของตนเอง']
    },
    {
      match: 'coding-social-worksheet',
      skills: ['อ่านคำสั่ง', 'เรียงขั้นตอน', 'แปลสัญลักษณ์', 'เลือกอย่างปลอดภัย', 'อธิบายเหตุผล'],
      steps: ['หาเป้าหมายของภารกิจ', 'แยกเป็นขั้นตอนสั้น ๆ', 'อ่านสัญลักษณ์ทีละตัว', 'ตรวจความปลอดภัยและมารยาท', 'อธิบายเหตุผลของคำตอบ']
    },
    {
      match: 'states-of-matter-worksheet',
      skills: ['จำแนกสถานะ', 'อธิบายสมบัติ', 'เปลี่ยนสถานะ', 'ยกตัวอย่าง', 'สรุป'],
      steps: ['ดูตัวอย่าง', 'เลือกสถานะ', 'อธิบายสมบัติ', 'เชื่อมการเปลี่ยนสถานะ', 'สรุป']
    },
    {
      match: 'vertebrate-sort-worksheet',
      skills: ['จำแนกสัตว์มีกระดูกสันหลัง', 'ใช้เกณฑ์', 'ยกตัวอย่าง', 'เปรียบเทียบ', 'สรุป'],
      steps: ['ดูลักษณะ', 'ใช้เกณฑ์กลุ่ม', 'จัดกลุ่ม', 'ยกตัวอย่าง', 'สรุป']
    },
    {
      match: 'thailand-map-worksheet',
      skills: ['อ่านแผนที่', 'ระบุภูมิภาค', 'หาจังหวัด', 'เปรียบเทียบ', 'สรุป'],
      steps: ['ดูแผนที่', 'หาภูมิภาค', 'ระบุตำแหน่ง', 'เชื่อมความรู้', 'สรุป']
    },
    {
      match: 'sukhothai-timeline-worksheet',
      skills: ['เรียงเหตุการณ์', 'อ่านเส้นเวลา', 'เชื่อมประวัติ', 'ให้เหตุผล', 'สรุป'],
      steps: ['ดูเส้นเวลา', 'เรียงเหตุการณ์', 'เชื่อมบุคคล/สถานที่', 'อธิบายความสำคัญ', 'สรุป']
    },
    {
      match: 'dictionary-worksheet',
      skills: ['หาคำในพจนานุกรม', 'อ่านคำจำกัดความ', 'ใช้ในประโยค', 'เลือกความหมาย', 'สรุป'],
      steps: ['หาคำ', 'อ่านความหมาย', 'เลือกความหมายที่ตรงบริบท', 'สร้างประโยค', 'ตรวจ']
    },
    {
      match: 'synonym-worksheet',
      skills: ['หาคำพ้อง', 'เปรียบเทียบความหมาย', 'ใช้แทนกัน', 'เลือกคำเหมาะบริบท', 'สรุป'],
      steps: ['อ่านคำ', 'นึกคำพ้อง', 'เทียบความหมาย', 'ใช้ในประโยค', 'ตรวจ']
    },
    {
      match: 'implied-meaning-worksheet',
      skills: ['อ่านนัย', 'หาเจตนา', 'แยกความหมายตรง/อ้อม', 'ให้เหตุผล', 'สรุป'],
      steps: ['อ่านข้อความ', 'หาคำใบ้', 'ตีความนัย', 'เลือกคำตอบ', 'อธิบาย']
    },
    {
      match: 'narration-style-worksheet',
      skills: ['จำแนกการเล่า', 'มุมมองผู้เล่า', 'น้ำเสียง', 'เชื่อมตัวอย่าง', 'สรุป'],
      steps: ['อ่านข้อความ', 'ดูมุมมอง', 'จำแนกสไตล์', 'ยกหลักฐาน', 'สรุป']
    },
    {
      match: 'sentence-structure-worksheet',
      skills: ['วิเคราะห์โครงสร้าง', 'หาประธานกริยา', 'จัดเรียง', 'ตรวจความหมาย', 'สรุป'],
      steps: ['อ่านประโยค', 'หาส่วนประกอบ', 'จัดโครงสร้าง', 'ตรวจ', 'สรุป']
    },
    {
      match: 'color-mix-worksheet',
      skills: ['จำแม่สี', 'ผสมสีทุติยภูมิ', 'แยกวรรณะ', 'เลือกสีตามอารมณ์', 'สรุป'],
      steps: ['ดูแม่สี', 'ผสมคู่สี', 'ตั้งชื่อสีที่ได้', 'จัดวรรณะ', 'สรุป']
    }
  ];

  function getSubjectGuide() {
    return subjectGuides.find((guide) => window.location.pathname.includes(guide.match)) || {
      skills: ['อ่านโจทย์', 'เลือกหลัก', 'ลงมือทำ', 'เขียนคำตอบ', 'ตรวจคำตอบ'],
      steps: ['อ่านโจทย์ช้า ๆ', 'ขีดเส้นใต้คำสำคัญ', 'เลือกหลักหรือวิธีคิด', 'ลงมือทำ', 'ตรวจคำตอบอีกครั้ง']
    };
  }

  function setForcedControls(mode) {
    const forced = mode !== 'standard';
    if (previousMode === 'standard' && forced) {
      savedPageCount = pageCountSelect.value;
      savedStyle = styleSelect.value;
      if (countSelect) savedCount = countSelect.value;
    }
    if (!forced && previousMode !== 'standard') {
      pageCountSelect.value = savedPageCount;
      styleSelect.value = savedStyle;
      if (countSelect && savedCount) countSelect.value = savedCount;
    }
    if (forced) {
      styleSelect.value = 'standard';
      pageCountSelect.value = mode === 'differentiated' ? '3' : '1';
      if (countSelect) countSelect.value = countSelect.dataset.fixedCount || '10';
    }
    pageCountSelect.disabled = forced;
    styleSelect.disabled = forced;
    if (countSelect) countSelect.disabled = forced;
    previousMode = mode;
  }

  function addBadge(sheet, text) {
    const titleRow = sheet.querySelector('.sheet-title');
    if (!titleRow) return;
    const badge = document.createElement('span');
    badge.className = 'worksheet-mode-badge';
    badge.textContent = text;
    titleRow.appendChild(badge);
  }

  function addNote(sheet, html) {
    const directions = sheet.querySelector('.directions');
    if (!directions) return;
    const note = document.createElement('div');
    note.className = 'worksheet-mode-note';
    note.innerHTML = html;
    directions.appendChild(note);
  }

  function trimToFive(sheet) {
    const questions = sheet.querySelector('.questions');
    if (!questions) return [];
    const items = Array.from(questions.querySelectorAll('.q'));
    items.slice(5).forEach((item) => item.remove());
    questions.classList.add('worksheet-mode-five');
    return items.slice(0, 5);
  }

  function addExitReflection(sheet) {
    const box = document.createElement('div');
    box.className = 'worksheet-mode-reflection';
    box.innerHTML = '<strong>สะท้อนการเรียนรู้:</strong> วันนี้ฉันเข้าใจ ________________________________ &nbsp; สิ่งที่ยังสงสัย ________________________________';
    sheet.querySelector('.questions')?.insertAdjacentElement('afterend', box);
  }

  function addDiagnosticSummary(sheet) {
    const guide = getSubjectGuide();
    const box = document.createElement('div');
    box.className = 'worksheet-mode-summary';
    box.innerHTML = '<strong>บันทึกวินิจฉัยสำหรับครู</strong><div class="worksheet-mode-summary-grid">'
      + guide.skills.map((skill, index) => '<div class="worksheet-mode-summary-item">ข้อ ' + (index + 1) + ' · ' + skill + '<br>[ ] ผ่าน &nbsp; [ ] ซ่อม</div>').join('')
      + '</div>';
    sheet.querySelector('.questions')?.insertAdjacentElement('afterend', box);
  }

  function addRemedialGuide(sheet) {
    const guide = getSubjectGuide();
    const markers = ['①', '②', '③', '④', '⑤'];
    const box = document.createElement('div');
    box.className = 'worksheet-mode-guide';
    box.innerHTML = guide.match === 'division-worksheet'
      ? '<strong>จำวิธีตั้งหาร:</strong> ' + guide.steps.join(' → ')
      : '<strong>ตัวช่วยทีละขั้น:</strong> ' + guide.steps.map((step, index) => markers[index] + ' ' + step).join(' ');
    sheet.querySelector('.sheet-head')?.insertAdjacentElement('afterend', box);
  }

  function addRemedialSample(sheet) {
    const box = document.createElement('div');
    box.className = 'worksheet-mode-sample';
    box.innerHTML = '<strong>ตัวอย่างก่อนทำ (1 ข้อ):</strong> ครูสาธิตข้อแรกบนจอ/กระดาน → นักเรียนพูดตามขั้น → แล้วค่อยทำข้อที่เหลือเอง · อย่ารีบข้ามตัวอย่าง';
    const guide = sheet.querySelector('.worksheet-mode-guide');
    if (guide) guide.insertAdjacentElement('afterend', box);
    else sheet.querySelector('.sheet-head')?.insertAdjacentElement('afterend', box);
  }

  function decorateDifferentiated(sheets) {
    const fixedCount = Number(countSelect?.dataset.fixedCount || 0);
    const reviewNote = fixedCount
      ? '<strong>ตัวช่วย:</strong> ทำตามแนวตั้งหารให้ตรงหลัก แล้วตรวจจากตัวอย่างในบทเรียน'
      : '<strong>ตัวช่วย:</strong> ทำทีละขั้น ขีดเส้นใต้คำสำคัญ และตรวจตัวอย่างจากบทเรียน';
    const levels = [
      { badge: 'ชุด A · ทบทวน', note: reviewNote, count: fixedCount || 5 },
      { badge: 'ชุด B · มาตรฐาน', note: '<strong>เป้าหมาย:</strong> ทำด้วยตนเองให้ครบ แล้วตรวจคำตอบอีกครั้ง', count: fixedCount || 10 },
      { badge: 'ชุด C · ท้าทาย', note: '<strong>ท้าทาย:</strong> ตอบให้ถูกต้องและเขียนเหตุผลหรือวิธีคิดประกอบทุกข้อ', count: fixedCount || 5 }
    ];
    sheets.slice(0, 3).forEach((sheet, index) => {
      const level = levels[index];
      sheet.classList.add('worksheet-mode-differentiated', 'worksheet-level-' + (index + 1));
      addBadge(sheet, level.badge);
      addNote(sheet, level.note);
      if (level.count === 5) trimToFive(sheet);
    });
  }

  function applyModeDecorations() {
    const mode = modeSelect.value;
    document.body.classList.remove('worksheet-mode-exit', 'worksheet-mode-diagnostic', 'worksheet-mode-remedial');
    const sheets = Array.from(document.querySelectorAll('#pages > .sheet:not(.cover-sheet)'));

    if (mode === 'differentiated') {
      decorateDifferentiated(sheets);
      return;
    }

    const sheet = sheets[0];
    if (!sheet || mode === 'standard') return;
    document.body.classList.add('worksheet-mode-' + mode);
    trimToFive(sheet);

    if (mode === 'exit') {
      addBadge(sheet, 'ตรวจเร็วท้ายคาบ · 5 ข้อ');
      addNote(sheet, '<strong>เวลาแนะนำ:</strong> 5 นาที · ทำด้วยตนเองโดยไม่เปิดหนังสือ');
      addExitReflection(sheet);
    } else if (mode === 'diagnostic') {
      addBadge(sheet, 'วินิจฉัยก่อนเรียน');
      addNote(sheet, '<strong>สำหรับครู:</strong> ใช้ผลแต่ละข้อระบุทักษะที่ผ่านและจุดที่ควรซ่อมเสริม');
      addDiagnosticSummary(sheet);
    } else if (mode === 'remedial') {
      addBadge(sheet, 'ซ่อมเสริมเฉพาะจุด');
      addNote(sheet, '<strong>เป้าหมาย:</strong> เน้นความเข้าใจทีละขั้น ไม่เน้นความเร็ว');
      addRemedialGuide(sheet);
      addRemedialSample(sheet);
    }
  }

  function triggerRandomize() {
    if (typeof window.randomize === 'function') {
      window.randomize();
      return true;
    }
    if (window.KampaiTopicWorksheet && typeof window.KampaiTopicWorksheet.randomize === 'function') {
      window.KampaiTopicWorksheet.randomize();
      return true;
    }
    return false;
  }

  function enhancedRender() {
    const mode = modeSelect.value;
    setForcedControls(mode);
    baseRender();
    applyModeDecorations();
  }

  function enhancedRandomize() {
    const mode = modeSelect.value;
    setForcedControls(mode);
    if (!triggerRandomize()) baseRender();
    applyModeDecorations();
  }

  modeSelect.onchange = enhancedRender;
  document.getElementById('btnRandom').onclick = enhancedRandomize;
  document.querySelectorAll('#selStyle, #selPageCount, #selGrade, #selCount, #selTopic, #selTeacher').forEach((control) => {
    control.onchange = enhancedRender;
  });
  const schoolInput = document.getElementById('inpSchool');
  if (schoolInput) schoolInput.oninput = enhancedRender;

  // Present / projector mode (?present=1)
  const presentBtn = document.createElement('button');
  presentBtn.type = 'button';
  presentBtn.className = 'btn';
  presentBtn.id = 'btnPresent';
  presentBtn.title = 'โหมดโปรเจคเตอร์ — ตัวอักษรใหญ่ ซ่อนตัวเลือกพิมพ์';
  presentBtn.textContent = '📽 โปรเจคเตอร์';
  const printBtn = document.getElementById('btnPrint');
  if (printBtn) printBtn.insertAdjacentElement('beforebegin', presentBtn);
  else controls.appendChild(presentBtn);

  function setPresentMode(on) {
    document.body.classList.toggle('present-mode', on);
    presentBtn.textContent = on ? '📄 โหมดปกติ' : '📽 โปรเจคเตอร์';
    presentBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    try {
      const url = new URL(window.location.href);
      if (on) url.searchParams.set('present', '1');
      else url.searchParams.delete('present');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch (_) { /* ignore */ }
  }

  presentBtn.onclick = () => setPresentMode(!document.body.classList.contains('present-mode'));
  try {
    if (new URLSearchParams(window.location.search).get('present') === '1') setPresentMode(true);
  } catch (_) { /* ignore */ }

  enhancedRender();
})();
