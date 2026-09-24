# เฟืองล็อกแกนมอเตอร์ TT แบบ 2 ทาง

- ไฟล์พร้อมพิมพ์: `tt-dual-shaft-locking-gear.3mf`
- ไฟล์ต้นฉบับแก้ขนาด: `tt-dual-shaft-locking-gear.scad`
- ภาพตรวจสอบ: `tt-dual-shaft-locking-gear-preview.png`

ชิ้นงานตั้งต้นสำหรับมอเตอร์เกียร์ TT สีเหลืองแบบแกนออกสองด้าน ใช้รูแกนทรง D ขนาด 5.55 มม. และน็อต M3 แบบฝังเพื่อขันสกรูกดล็อกแกน

ไฟล์ 3MF ใช้หน่วยมิลลิเมตรและเปิดได้โดยตรงใน Bambu Studio, OrcaSlicer, PrusaSlicer หรือ Cura

## วิธีส่งออก STL เพิ่มเติม

1. เปิดไฟล์ `.scad` ด้วย OpenSCAD
2. กด `F6` เพื่อ Render
3. เลือก **File → Export → Export as STL**

## จุดที่แก้ได้ด้านบนของไฟล์

- `shaft_diameter`: ขนาดแกนมอเตอร์รวมระยะเผื่อ
- `shaft_flat_depth`: ความลึกด้านแบนของแกน D
- `body_diameter`, `body_thickness`: ขนาดเฟือง
- `tooth_count`, `tooth_depth`: จำนวนและความลึกฟัน
- `set_screw_diameter`: รูสกรูล็อก M3
- `nut_across_flats`, `nut_thickness`: ขนาดช่องดักน็อต M3

แนะนำให้พิมพ์ชิ้นทดสอบช่วงแกนก่อน หากแน่นเกินไปให้เพิ่ม `shaft_diameter` ทีละ 0.10 มม. หากต้องการให้เฟืองขบกับเฟืองอีกตัวจริง จำเป็นต้องระบุ module/จำนวนฟัน/มุมกดของเฟืองคู่ จึงไม่ควรใช้ฟันสี่เหลี่ยมรุ่นนี้เป็นเฟืองส่งกำลังความแม่นยำสูง
