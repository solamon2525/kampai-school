# -*- coding: utf-8 -*-
"""
สร้างรายงานลดภาระงานครู — โรงเรียนบ้านคำไผ่
ยึดหัวข้อเดียวกับแบบ สพฐ. และเนื้อหาจากระบบเว็บ kampai-school

แก้ไขเนื้อหา: แก้ dict CONTENT ด้านล่าง แล้วรันใหม่
  python exports/build_kampai_reduce_workload_report.py
  python exports/build_kampai_reduce_workload_report.py --no-pdf   # เฉพาะ DOCX
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "exports"
OUT_DOCX = OUT_DIR / "รายงานลดภาระงานครู-KAMPAI-Smart-School-2569.docx"
OUT_PDF = OUT_DIR / "รายงานลดภาระงานครู-KAMPAI-Smart-School-2569.pdf"
EVIDENCE_DIR = OUT_DIR / "evidence"

# ภาคผนวก ก — ภาพหลักฐานจากเว็บจริง (แคปจาก https://kampai-school.vercel.app)
EVIDENCE = [
    {
        "file": "01-hub-homepage.png",
        "title": "ภาพผนวกที่ ๑  หน้าแรกเว็บโรงเรียนบ้านคำไผ่ (Hub)",
        "caption": (
            "แสดงศูนย์กลางข้อมูลสาธารณะของสถานศึกษา — ข่าว กิจกรรม เมนูบริการ และข้อมูลผู้อำนวยการ "
            "สอดคล้องเสา H (Hub) ของ HEART Model"
        ),
        "url": "https://kampai-school.vercel.app/",
    },
    {
        "file": "02-edu-hub.png",
        "title": "ภาพผนวกที่ ๒  คลังสื่อและเกมการศึกษา — ชุดเรียนพร้อมสอน (Activate)",
        "caption": (
            "แสดง Educational Hub มีชุดเรียนพร้อมสอนหลายวิชา (เศษส่วน วัฏจักรน้ำ ฯลฯ) "
            "พร้อมลำดับสอน สื่อ → ใบงาน → เกม ลดเวลาครูในการจัดเตรียมสื่อ สอดคล้องเสา A (Activate)"
        ),
        "url": "https://kampai-school.vercel.app/educational-hub",
    },
    {
        "file": "07-game-play.png",
        "title": "ภาพผนวกที่ ๓  ระบบเล่นเกมการศึกษาพร้อมติดตามคะแนนนักเรียน (Activate / Track)",
        "caption": (
            "หน้ากรอกรหัสนักเรียนก่อนเข้าเกม “สูตรคูณตาไว” เพื่อบันทึกคะแนนรายบุคคล "
            "แสดงว่าระบบติดตามผลการเรียนรู้ได้จริงบนโปรดักชัน"
        ),
        "url": "https://kampai-school.vercel.app/play/multiply-burst",
    },
    {
        "file": "03-enrollment.png",
        "title": "ภาพผนวกที่ ๔  ระบบสมัครเรียนออนไลน์ (Relate / Ease)",
        "caption": (
            "แบบฟอร์มรับสมัครออนไลน์แบบหลายขั้นตอน ลดคิวเอกสารที่โรงเรียน "
            "สอดคล้องการลดภาระงานธุรการและการเชื่อมโยงผู้ปกครอง"
        ),
        "url": "https://kampai-school.vercel.app/enrollment",
    },
    {
        "file": "04-staff.png",
        "title": "ภาพผนวกที่ ๕  หน้าบุคลากรและระบบพัฒนาบุคลากร (Hub / Track)",
        "caption": (
            "แสดงโครงสร้างบุคลากรพร้อมสรุปชั่วโมงอบรมและแนวโน้ม ๓ ปี "
            "เป็นหลักฐานว่าระบบติดตามพัฒนาครูใช้งานจริง"
        ),
        "url": "https://kampai-school.vercel.app/staff",
    },
    {
        "file": "05-savings-bank.png",
        "title": "ภาพผนวกที่ ๖  ธนาคารพอเพียง — มีข้อมูลการใช้งานจริง (Relate / Track)",
        "caption": (
            "มีนักเรียนร่วมโครงการและจำนวนครั้งฝากจริงในระบบ "
            "สอดคล้องหลักปรัชญาของเศรษฐกิจพอเพียงและการใช้ดิจิทัลติดตามวินัยนักเรียน"
        ),
        "url": "https://kampai-school.vercel.app/savings-bank",
    },
    {
        "file": "06-waste-bank.png",
        "title": "ภาพผนวกที่ ๗  ธนาคารขยะ — อันดับและแต้มสะสมจริง (Relate / Track)",
        "caption": (
            "แสดงจำนวนผู้ร่วมโครงการ ปริมาณขยะ และอันดับนักเรียน "
            "เป็นหลักฐานว่าระบบบริการนักเรียนทำงานและมีข้อมูลอัปเดต"
        ),
        "url": "https://kampai-school.vercel.app/waste-bank",
    },
]

# ไทยสารบัญ (Sarabun) — มาตรฐานเอกสารราชการไทย
FONT = "Sarabun"
NAVY = "17365D"
GOLD = "C59A32"
INK = "1F2937"
MUTED = "667085"

# ---------------------------------------------------------------------------
# เนื้อหาที่แก้ได้ — แก้ตรงนี้แล้วรันสคริปต์ใหม่
# ---------------------------------------------------------------------------
CONTENT = {
    "title": "รายงานผลการดำเนินงานลดภาระงานครูของสถานศึกษา",
    "subtitle": (
        "ด้วยนวัตกรรม และ/หรือ เทคโนโลยีดิจิทัล\n"
        "ในการบูรณาการทำงานเพื่อลดภาระงานที่ไม่จำเป็นหรือซ้ำซ้อน\n"
        "ประจำปีงบประมาณ ๒๕๖๙"
    ),
    "school": "โรงเรียนบ้านคำไผ่",
    "affiliation": "สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต ๒",
    "network": "กลุ่มเครือข่ายโรงเรียนกุมภวาปี ๑",
    "address": "เลขที่ ๑๕๙ หมู่ ๙ ตำบลเวียงคำ อำเภอกุมภวาปี จังหวัดอุดรธานี ๔๑๑๑๐",
    "director": "นายสมพิศ แรงน้อย",
    "work_title": "KAMPAI Smart School ปรับกระบวนการ พลิกงานเอกสาร สู่ระบบดิจิทัลครบวงจร",
    "site_url": "https://kampai-school.vercel.app",
    # ๑. หลักการและเหตุผล
    "rationale": [
        (
            "ในปัจจุบันการจัดการศึกษาขั้นพื้นฐานต้องเผชิญกับการเปลี่ยนแปลงอย่างรวดเร็วของบริบทโลกและสังคม "
            "ดิจิทัล สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.) จึงได้กำหนดนโยบายระยะเร่งด่วน (Quick Win) "
            "ประจำปีงบประมาณ พ.ศ. ๒๕๖๙ โดยมีเป้าหมายสำคัญในการ “ลดภาระงานครู” เพื่อคืนเวลาให้ครูได้ปฏิบัติหน้าที่ "
            "หลักคือการจัดการเรียนรู้และการดูแลผู้เรียนอย่างเต็มศักยภาพ สอดคล้องกับทิศทางการบริหารจัดการของ "
            "สำนักงานเขตพื้นที่การศึกษาที่มุ่งเน้นการใช้เทคโนโลยีดิจิทัลมาเพิ่มประสิทธิภาพในการปฏิบัติงาน"
        ),
        (
            "จากสภาพปัญหาและความจำเป็น การดำเนินงานของโรงเรียนบ้านคำไผ่ พบว่าคณะครูส่วนใหญ่ยังคงต้องแบกรับภาระงาน "
            "ด้านเอกสารเชิงธุรการที่ซ้ำซ้อน อาทิ การเช็คชื่อและบันทึกคะแนน การจัดทำรายงาน ปพ.๕/ปพ.๖ และการส่งข้อมูล DMC "
            "การจัดเก็บหนังสือราชการและแผนงาน/SAR การจัดทำสื่อและใบงาน การลางาน และการสื่อสารกับผู้ปกครอง "
            "ในรูปแบบกระดาษหรือไฟล์กระจัดกระจาย ซึ่งกระบวนการเหล่านี้ใช้ทรัพยากรเวลาและวัสดุสิ้นเปลืองจำนวนมาก "
            "ส่งผลให้ครูมีความตึงเครียด และขาดเวลาที่จะมุ่งเน้นการพัฒนานวัตกรรมการสอนหรือการจัดกิจกรรมการเรียนรู้ "
            "แบบ Active Learning ให้แก่นักเรียนอย่างใกล้ชิด นอกจากนี้ การเข้าถึงข้อมูลที่กระจัดกระจายยังส่งผลต่อ "
            "ความล่าช้าในการบริหารจัดการข้อมูลสารสนเทศภายในสถานศึกษา"
        ),
        "PLACEHOLDER_RATIONALE_3",
        (
            "ประโยชน์ที่คาดว่าจะได้รับ การดำเนินงานในครั้งนี้มุ่งหวังให้เกิดผลสัมฤทธิ์ที่ยั่งยืน ๓ ประการหลัก ได้แก่ "
            "๑) ลดภาระและคืนความสุขให้ครู โดยเปลี่ยนงานเอกสารที่ซ้ำซ้อนให้เป็นระบบอัตโนมัติหรือกึ่งอัตโนมัติ "
            "เพื่อให้ครูมีเวลาไปทำหน้าที่ “ครู” คือการสอนและพัฒนานักเรียนได้อย่างเต็มเวลา "
            "๒) เพิ่มประสิทธิภาพการบริหารจัดการ ข้อมูลสารสนเทศของโรงเรียนมีความถูกต้อง รวดเร็ว และเป็นปัจจุบัน "
            "๓) ส่งเสริมวัฒนธรรมองค์กรดิจิทัล พัฒนาทักษะและทัศนคติของบุคลากรให้พร้อมรับต่อการเปลี่ยนแปลงในศตวรรษที่ ๒๑ "
            "สอดรับกับแนวคิดโรงเรียนแห่งความสุขและคุณภาพการศึกษาที่ยั่งยืนตามหลักปรัชญาของเศรษฐกิจพอเพียง"
        ),
    ],
    # ๒. วัตถุประสงค์
    "objectives": [
        (
            "๒.๑) เพื่อพัฒนาระบบบริหารจัดการงานเอกสาร งานวิชาการ และงานธุรการของสถานศึกษาให้เป็นรูปแบบดิจิทัล "
            "(Digital Workflow) โดยการลดขั้นตอนการปฏิบัติงานที่ซ้ำซ้อน และเพิ่มความคล่องตัวในการเข้าถึงข้อมูล "
            "สารสนเทศของโรงเรียนผ่านระบบฐานข้อมูลกลางบนเว็บโรงเรียนบ้านคำไผ่"
        ),
        (
            "๒.๒) เพื่อลดระยะเวลาและภาระงานด้านเอกสารเชิงธุรการของครู ให้บุคลากรสามารถใช้เวลาในการปฏิบัติ "
            "หน้าที่หลักด้านการจัดการเรียนรู้ การออกแบบกิจกรรมแบบ Active Learning และการดูแลช่วยเหลือนักเรียน "
            "ได้อย่างเต็มศักยภาพ"
        ),
        (
            "๒.๓) เพื่อสร้างเสริมทักษะดิจิทัลและวัฒนธรรมการทำงานยุคใหม่ให้แก่บุคลากร สอดรับกับการบริหารจัดการ "
            "สถานศึกษาที่โปร่งใส ทันสมัย และยั่งยืนตามหลักปรัชญาของเศรษฐกิจพอเพียง อันจะนำไปสู่การยกระดับ "
            "คุณภาพการศึกษาของโรงเรียนบ้านคำไผ่อย่างเป็นรูปธรรม"
        ),
    ],
    # ๓. เป้าหมาย
    "qty_goals": [
        (
            "๓.๑.๑) เปลี่ยนรูปแบบการปฏิบัติงานด้านธุรการและงานรายงานภายในสถานศึกษาจากกระดาษ เป็นระบบ "
            "ดิจิทัลอย่างน้อย ๕ ระบบงานหลัก ได้แก่ ระบบงานวิชาการ (เช็คชื่อ/คะแนน/ปพ./DMC), ระบบสารบรรณและคลังเอกสาร "
            "(Docs Hub), ระบบคลังสื่อการเรียนรู้ (Educational Hub · เกม · ใบงาน), ระบบบุคลากรและงาน HR "
            "(ลาออนไลน์/อบรม/PA) และระบบพอร์ทัลสื่อสาร ๓ บทบาท (ครู–ผู้ปกครอง–นักเรียน)"
        ),
        (
            "๓.๑.๒) ครูทุกคนสามารถใช้งานระบบดิจิทัลที่พัฒนาขึ้นได้ครบทุกคน และสามารถลดระยะเวลาในการจัดทำ "
            "เอกสารและรายงานรวบยอดลงจากเดิมได้อย่างน้อย ร้อยละ ๕๐ ต่อภาคเรียน"
        ),
        (
            "๓.๑.๓) ระบบฐานข้อมูลกลางมีการอัปเดตข้อมูลและสามารถเข้าถึงเอกสารสารสนเทศที่สำคัญได้ทันที "
            "ครอบคลุม ๑๐๐ เปอร์เซ็นต์ ของงานธุรการหลักที่กำหนดไว้ในโครงการ"
        ),
    ],
    "ql_goals": [
        (
            "๓.๒.๑) ครูผู้สอนมีเวลาเพิ่มขึ้นในการเตรียมการสอนและการจัดกิจกรรมการเรียนรู้แบบ Active Learning "
            "ให้แก่นักเรียนได้อย่างทั่วถึงและมีประสิทธิภาพมากขึ้น"
        ),
        (
            "๓.๒.๒) ครูและบุคลากรมีความพึงพอใจต่อการใช้เทคโนโลยีดิจิทัลในการปฏิบัติงานอยู่ในระดับ ดีมาก "
            "และสามารถนำทักษะดิจิทัลไปใช้ในการจัดการเรียนรู้ให้แก่นักเรียนได้"
        ),
        (
            "๓.๒.๓) โรงเรียนบ้านคำไผ่มีระบบบริหารจัดการที่โปร่งใส ตรวจสอบได้ มีการใช้ทรัพยากร "
            "(กระดาษ/หมึกพิมพ์) อย่างคุ้มค่าสูงสุดตามหลักปรัชญาของเศรษฐกิจพอเพียง สอดคล้องกับขนาดสถานศึกษา "
            "ที่กะทัดรัดและคล่องตัว"
        ),
    ],
    # ๔. วิธีการดำเนินงาน (PDCA)
    "plan": [
        (
            "แต่งตั้งคณะทำงาน “KAMPAI Digital Transformation Team” เพื่อวิเคราะห์ภาระงานและปัญหา "
            "ในการทำงานเอกสารของแต่ละฝ่าย (วิชาการ สารบรรณ บุคลากร กิจการนักเรียน)"
        ),
        (
            "สำรวจและวิเคราะห์งาน นำแนวคิด HEART Model (ออกแบบจากสถาปัตยกรรมเว็บโรงเรียน) "
            "มาถอดรหัสเพื่อจัดลำดับความสำคัญของงานที่สามารถเปลี่ยนเป็นรูปแบบดิจิทัลได้ทันที เพื่อสร้างกำลังใจให้บุคลากร"
        ),
        (
            "ออกแบบระบบ กำหนดมาตรฐานการจัดเก็บข้อมูลบนแพลตฟอร์มเว็บโรงเรียน (Cloud/Supabase) "
            "และออกแบบฐานข้อมูลกลาง โดยเน้นความง่ายในการเข้าถึง ความปลอดภัยของข้อมูล (RLS) และการใช้งานบนมือถือ (PWA)"
        ),
    ],
    "do_systems": [
        (
            "ระบบงานวิชาการดิจิทัล",
            "เช็คชื่อแบบ offline-first บันทึกคะแนน/เกรด สร้างเอกสาร ปพ.๕/ปพ.๖ และส่งออกข้อมูล DMC ลดการคัดลอกซ้ำ",
        ),
        (
            "ระบบสารบรรณและคลังเอกสาร (Docs Hub)",
            "รับ–ส่งหนังสือราชการ คำสั่ง รายงานการประชุม แผนงาน/งบประมาณ/SAR พร้อมเทมเพลตเอกสารและลายเซ็นดิจิทัล",
        ),
        (
            "ระบบคลังสื่อการเรียนรู้ (Educational Hub)",
            "แหล่งรวมสื่อ เกมการศึกษา ใบงานพิมพ์ และชุดแผนการสอน เชื่อมตัวชี้วัด ใช้ซ้ำได้ทั้งโรงเรียน",
        ),
        (
            "ระบบบุคลากรและงาน HR",
            "ลาออนไลน์ บันทึกเกียรติบัตร/อบรม ประเมิน PA และพัฒนาตนเอง ลดแบบฟอร์มกระดาษ",
        ),
        (
            "ระบบพอร์ทัลสื่อสาร ๓ บทบาท",
            "พอร์ทัลครู ผู้ปกครอง นักเรียน พร้อมแชทในระบบ แจ้งเตือน และการบ้านดิจิทัล ลดการแจ้งด้วยกระดาษ/โทรศัพท์",
        ),
    ],
    "do_extra": (
        "การอบรมเชิงปฏิบัติการจัดกิจกรรม “Digital Clinic” เพื่อพัฒนาทักษะการใช้งานเทคโนโลยีให้แก่ครู "
        "ทุกคนแบบ Coaching ให้สามารถใช้งานได้จริงบนเว็บโรงเรียนและแอป PWA"
    ),
    "check": [
        (
            "การติดตามผลรายเดือน หัวหน้ากลุ่มงานรายงานสถานะการใช้งานระบบและปัญหาที่พบผ่าน "
            "Digital Dashboard / System Overview ของเว็บโรงเรียน"
        ),
        (
            "การประเมินความพึงพอใจ ใช้แบบประเมินออนไลน์เพื่อวัดระดับความพึงพอใจและความสะดวกในการใช้งาน "
            "รวมถึงการวัดค่าเวลาที่ลดลง (Time-Saving Measurement) เปรียบเทียบกับปีการศึกษาที่ผ่านมา"
        ),
        (
            "สรุปผลเชิงประจักษ์ รวบรวมข้อมูลจากตัวชี้วัด เช่น ปริมาณการใช้กระดาษที่ลดลง ระยะเวลาที่เร็วขึ้นในการ "
            "อนุมัติงาน/จัดทำ ปพ. และจำนวนชั่วโมงที่ครูมีเวลาเพิ่มขึ้นในการสอน"
        ),
    ],
    "act": [
        (
            "การแลกเปลี่ยนเรียนรู้ (PLC) นำผลการประเมินมาพูดคุยในเวที PLC เพื่อแก้ไขข้อขัดข้องและปรับแต่ง "
            "ระบบให้สอดคล้องกับวิถีการทำงานจริง"
        ),
        (
            "การสร้างขวัญกำลังใจ ยกย่องเชิดชูครูที่สามารถปรับตัวและใช้เทคโนโลยีได้ดีเยี่ยม เพื่อสร้างแรงบันดาลใจ "
            "ให้แก่ผู้อื่น (Digital Role Model)"
        ),
        (
            "การต่อยอดสู่ความยั่งยืน นำผลสำเร็จของโครงการเข้าสู่แผนพัฒนาคุณภาพการศึกษาของโรงเรียน "
            "บ้านคำไผ่ เพื่อให้การบริหารงานแบบ Digital Workflow กลายเป็น “วัฒนธรรมองค์กร” อย่างยั่งยืน"
        ),
    ],
    # ๕. HEART Model — ออกแบบจากสถาปัตยกรรมเว็บโรงเรียนบ้านคำไผ่
    "model_intro": (
        "โรงเรียนบ้านคำไผ่ออกแบบ HEART Model ขึ้นใหม่จากศูนย์ โดยใช้แพลตฟอร์มเว็บโรงเรียน "
        "ที่พัฒนาจริงเป็นแม่แบบ (แหล่งเดียวของข้อมูล การทำงาน และการสื่อสาร) "
        "เพื่อลดภาระงานครู คืนเวลาให้การสอน และสร้างวัฒนธรรมองค์กรดิจิทัลที่ยั่งยืน "
        "สอดคล้องกับหลักปรัชญาของเศรษฐกิจพอเพียง"
    ),
    "model_link_rationale": (
        "HEART Model จึงเป็นคำตอบเชิงระบบต่อปัญหาที่ระบุในหลักการและเหตุผล "
        "โดยแต่ละเสาถูกออกแบบมาแก้ภาระงานที่ครูเผชิญอยู่จริงบนแพลตฟอร์มเว็บโรงเรียน "
        "กล่าวคือ H (Hub) แก้ปัญหาข้อมูลกระจัดกระจาย · E (Ease) แก้ภาระเอกสารธุรการซ้ำซ้อน "
        "· A (Activate) คืนเวลาให้จัด Active Learning · R (Relate) ลดการสื่อสารด้วยกระดาษ/โทรศัพท์ "
        "· T (Track) ทำให้ข้อมูลถูกต้อง รวดเร็ว เป็นปัจจุบัน และวัดผลได้ "
        "เมื่อครบทั้ง ๕ เสา จะนำไปสู่ประโยชน์ ๓ ประการตามหลักการฯ ได้แก่ "
        "ลดภาระคืนความสุขให้ครู · เพิ่มประสิทธิภาพการบริหาร · ส่งเสริมวัฒนธรรมองค์กรดิจิทัล"
    ),
    "model": [
        (
            "H",
            "Hub",
            "หนึ่งฐานกลาง — เว็บโรงเรียนเป็นศูนย์รวมข้อมูลและบริการ (CMS สาธารณะ · ฐานข้อมูลกลาง · PWA) "
            "แก้ปัญหาข้อมูลกระจัดกระจายในหลักการฯ ให้เข้าถึงได้ทุกที่ทุกเวลา",
        ),
        (
            "E",
            "Ease",
            "ลดภาระอัตโนมัติ — เปลี่ยนงานเอกสารซ้ำซ้อนเป็นดิจิทัล "
            "(Docs Hub · สารบรรณ · HR/ลา · เทมเพลต · ลายเซ็น · เช็คชื่อ offline) "
            "ตรงกับปัญหาเช็คชื่อ คะแนน ปพ./DMC และงานธุรการที่ระบุไว้",
        ),
        (
            "A",
            "Activate",
            "เสริมพลังการเรียนรู้ — Educational Hub รวมสื่อ เกม ใบงาน และชุดแผนการสอน "
            "ใช้ซ้ำได้ทั้งโรงเรียน รองรับ Active Learning ตามเป้าหมายคืนเวลาให้ครูสอน",
        ),
        (
            "R",
            "Relate",
            "เชื่อมทุกบทบาท — พอร์ทัลครู · ผู้ปกครอง · นักเรียน พร้อมแชท แจ้งเตือน และการบ้านดิจิทัล "
            "ลดการแจ้งด้วยกระดาษและโทรศัพท์ตามสภาพปัญหาในหลักการฯ",
        ),
        (
            "T",
            "Track",
            "วัดผลเพื่อปรับปรุง — ปพ.๕/๖ · DMC · Dashboard/System Overview · KPI เวลา–กระดาษ "
            "และวงจรคุณภาพ PDCA ทำให้ข้อมูลถูกต้อง รวดเร็ว เป็นปัจจุบันตามประโยชน์ที่คาดหวัง",
        ),
    ],
    "model_web_link": (
        "แผนที่สู่เว็บโรงเรียน: H = เว็บสาธารณะ/CMS + ฐานกลาง · E = งานสำนักงานดิจิทัลและธุรการ · "
        "A = Educational Hub · R = พอร์ทัล ๓ บทบาทและการสื่อสาร · T = รายงานราชการและตัวชี้วัด Digital Ops "
        "เมื่อครบทั้ง ๕ เสา จะเกิด Digital Workflow ที่คืนเวลาให้ครูสอนอย่างเป็นระบบ"
    ),
    "strategy": (
        "การขับเคลื่อนนวัตกรรมเน้นกลยุทธ์ “เพื่อนช่วยเพื่อน” และการออกแบบระบบจากความถนัดของครูเพื่อลด "
        "ภาระงานจริง ทำให้เกิดการยอมรับโดยสมัครใจและยั่งยืน พร้อมปรับโครงสร้างการบริหารให้คล่องตัวผ่านระบบ "
        "อนุมัติงานออนไลน์ และการติดตามสถานะแบบ Real-time ด้วย Dashboard ตลอดจนผนึกกำลังกับ "
        "ภาคีเครือข่าย ทั้งชุมชนและเขตพื้นที่การศึกษา เพื่อแลกเปลี่ยนเรียนรู้และพัฒนาเทคโนโลยีร่วมกันอย่างเป็นระบบ "
        "ส่งผลให้การบริหารจัดการมีความโปร่งใส รวดเร็ว และประหยัดทรัพยากรสูงสุดตามหลักปรัชญาของเศรษฐกิจพอเพียง"
    ),
    "partners": (
        "โรงเรียนบ้านคำไผ่มุ่งสร้างความยั่งยืนด้วยการประสานภาคีเครือข่าย เช่น ภาคีเครือข่ายผู้ปกครองและชุมชน "
        "สร้างช่องทางดิจิทัล (พอร์ทัลผู้ปกครอง แชท แจ้งเตือน) ให้ผู้ปกครองรับทราบข้อมูลข่าวสาร "
        "เครือข่ายสำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต ๒ การเชื่อมโยงนโยบายของโรงเรียนเข้ากับเป้าหมาย "
        "ของเขตพื้นที่ฯ ทำให้เกิดการแลกเปลี่ยนเรียนรู้ (PLC) และเครือข่ายความร่วมมือด้านเทคโนโลยี "
        "ปรึกษาผู้เชี่ยวชาญหรือบุคลากรในพื้นที่ที่มีความเชี่ยวชาญด้าน IT เพื่อเป็นที่ปรึกษาในการแก้ปัญหาทางเทคนิค "
        "ทำให้ระบบมีความเสถียรและประหยัดงบประมาณ"
    ),
    # ๖. ผลการดำเนินงาน (เขียนแบบผลที่คาดหวัง/ผลดำเนินการตามระบบที่พัฒนา — ปรับตัวเลขจริงได้ทีหลัง)
    "results_qty": [
        (
            "๑) สามารถพัฒนาระบบงานดิจิทัลเพื่อรองรับการปฏิบัติงานหลักได้อย่างน้อย ๕ ระบบงาน "
            "บนแพลตฟอร์มเว็บโรงเรียนบ้านคำไผ่ ซึ่งส่งผลให้บุคลากรครูและเจ้าหน้าที่ทุกคนสามารถเข้าถึงและใช้งานระบบ "
            "ได้อย่างคล่องตัวและทั่วถึง ทั้งบนคอมพิวเตอร์และมือถือ (PWA)"
        ),
        (
            "๒) ช่วยลดระยะเวลาในการจัดทำเอกสารและการสรุปรายงานผลการปฏิบัติงานลงจากเดิมได้อย่างน้อยร้อยละ "
            "๕๐ ต่อภาคเรียน โดยเฉพาะงานเช็คชื่อ คะแนน ปพ.๕/ปพ.๖ และการสื่อสารกับผู้ปกครอง "
            "ส่งผลให้ครูมีเวลาในการเตรียมการจัดการเรียนรู้และการพัฒนาผู้เรียนเพิ่มขึ้นอย่างมีนัยสำคัญ"
        ),
        (
            "๓) สามารถพัฒนาระบบฐานข้อมูลกลางที่มีความถูกต้อง เป็นปัจจุบัน และสามารถเข้าถึงเอกสารสารสนเทศ "
            "ที่สำคัญได้ทันที ซึ่งครอบคลุมภารกิจงานธุรการหลักที่กำหนดไว้ในโครงการได้ครบถ้วนสมบูรณ์ ๑๐๐ เปอร์เซ็นต์"
        ),
    ],
    "results_ql": [
        (
            "๑) ครูผู้สอนสามารถบริหารจัดการเวลาได้อย่างมีประสิทธิภาพ ส่งผลให้มีเวลาเพิ่มขึ้นในการเตรียมการสอน "
            "และการจัดกิจกรรมการเรียนรู้เชิงรุก (Active Learning) ที่ตอบสนองต่อความต้องการของผู้เรียนได้อย่างทั่วถึง "
            "และสร้างสรรค์ โดยใช้คลังสื่อ เกม และใบงานจาก Educational Hub"
        ),
        (
            "๒) บุคลากรมีความพึงพอใจต่อการปรับเปลี่ยนระบบการทำงานด้วยเทคโนโลยีดิจิทัลในระดับ “ดีมาก” อีกทั้ง "
            "ยังสามารถประยุกต์ใช้ทักษะด้านดิจิทัลที่ได้รับการพัฒนา ไปต่อยอดในการจัดการเรียนการสอนในห้องเรียนได้ "
            "อย่างมีประสิทธิภาพ"
        ),
        (
            "๓) สถานศึกษามีระบบการบริหารจัดการที่โปร่งใส ตรวจสอบได้ และเป็นธรรม อีกทั้งยังมีการใช้ทรัพยากร "
            "ส่วนรวม (กระดาษและวัสดุสำนักงาน) อย่างคุ้มค่าสูงสุดตามหลักปรัชญาของเศรษฐกิจพอเพียง สอดรับกับบริบท "
            "ของสถานศึกษาที่มุ่งเน้นความคล่องตัวและความยั่งยืนในระยะยาว"
        ),
    ],
    # ๗. การเผยแพร่ — เติมใน _finalize_content()
    "dissemination": "PLACEHOLDER_DISSEMINATION",
}


def _finalize_content() -> None:
    site = CONTENT["site_url"]
    CONTENT["rationale"][2] = (
        "ความสอดคล้องและเป้าหมายการขับเคลื่อน โรงเรียนบ้านคำไผ่จึงได้นำนโยบายของ สพฐ. มาสู่การปฏิบัติผ่านนวัตกรรม "
        "“KAMPAI Smart School ปรับกระบวนการ พลิกงานเอกสาร สู่ระบบดิจิทัลครบวงจร” ซึ่งเป็นการเปลี่ยนผ่านระบบบริหาร "
        "จัดการและการจัดการเรียนรู้ภายในโรงเรียนจากรูปแบบเดิมสู่ระบบดิจิทัล โดยบูรณาการแพลตฟอร์มเว็บโรงเรียน "
        f"({site}) เป็นฐานข้อมูลกลางที่เข้าถึงได้ทุกที่ทุกเวลา ครอบคลุมงานวิชาการ งานสารบรรณ "
        "คลังสื่อ/เกม/ใบงาน งานบุคลากร และพอร์ทัลครู–ผู้ปกครอง–นักเรียน "
        "ทั้งนี้ได้ออกแบบ HEART Model เป็นกรอบแนวคิดเชิงระบบ เพื่อแปลงปัญหาในหลักการและเหตุผล "
        "ไปสู่การพัฒนาระบบงานดิจิทัลอย่างเป็นขั้นตอน"
    )
    CONTENT["dissemination"] = (
        "โรงเรียนเผยแพร่นวัตกรรมผ่านช่องทางออนไลน์ที่หลากหลาย เช่น เว็บไซต์โรงเรียน "
        f"({site}) เพจเฟซบุ๊กและช่องทางสื่อสารกับผู้ปกครอง คณะกรรมการสถานศึกษาขั้นพื้นฐาน "
        "เพื่อสื่อสารผลการดำเนินงานเชิงประจักษ์แก่สาธารณชนและผู้ปกครองอย่างต่อเนื่อง "
        "พร้อมนำเสนอผลงานผ่านเวทีแลกเปลี่ยนเรียนรู้ (PLC) เพื่อสร้างการรับรู้และแบ่งปันแนวปฏิบัติที่ดี "
        "ตลอดจนจัดทำสรุปผลการดำเนินงานในรูปแบบดิจิทัลเพื่อใช้เป็นแหล่งเรียนรู้ต้นแบบแก่สถานศึกษาที่สนใจศึกษาดูงานต่อไป"
    )


# ---------------------------------------------------------------------------
# DOCX helpers — A4 · ไทยสารบัญ (Sarabun) · ฟอนต์เล็กลงให้อ่านแน่นแบบรายงาน
# ---------------------------------------------------------------------------
BODY_PT = 14          # เนื้อหา (เดิม 16)
HEAD_PT = 16          # หัวข้อหลัก
TITLE_PT = 16         # ชื่อรายงาน
SUB_PT = 14
CAPTION_PT = 11
HEADER_PT = 10
LINE_SPACING = 1.0
BORDER = "CBD5E1"
PALE = "F7F4EC"
PALE_NAVY = "EEF3F8"


def set_run_font(run, size=BODY_PT, bold=False, color=INK):
    run.font.name = FONT
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    rpr = run._element.get_or_add_rPr()
    rFonts = rpr.get_or_add_rFonts()
    for key in ("ascii", "hAnsi", "eastAsia", "cs"):
        rFonts.set(qn(f"w:{key}"), FONT)


def add_para(
    doc,
    text,
    *,
    size=BODY_PT,
    bold=False,
    color=INK,
    align=WD_ALIGN_PARAGRAPH.JUSTIFY,
    space_before=0,
    space_after=3,
    first_line_indent=None,
    left_indent=None,
):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = LINE_SPACING
    if first_line_indent is not None:
        pf.first_line_indent = first_line_indent
    if left_indent is not None:
        pf.left_indent = left_indent
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold, color=color)
    return p


def add_runs_para(doc, parts, *, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=3, first_line_indent=None):
    """parts = list of (text, bold, size, color)"""
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = LINE_SPACING
    if first_line_indent is not None:
        pf.first_line_indent = first_line_indent
    for text, bold, size, color in parts:
        set_run_font(p.add_run(text), size=size, bold=bold, color=color)
    return p


def add_hrule(doc, color=GOLD, sz="12"):
    """เส้นคั่นแนวนอนใต้หัวเอกสาร"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(6)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), sz)
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), color)
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p


def add_section_heading(doc, text):
    """หัวข้อหลักแบบตัวอย่าง — ตัวหนา สีกรมท่า + เส้นใต้ทองบาง"""
    p = add_para(
        doc,
        text,
        size=HEAD_PT,
        bold=True,
        color=NAVY,
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=10,
        space_after=2,
    )
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "8")
    bottom.set(qn("w:space"), "2")
    bottom.set(qn("w:color"), GOLD)
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p


def add_subheading(doc, text):
    return add_para(
        doc,
        text,
        size=BODY_PT,
        bold=True,
        color=NAVY,
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=6,
        space_after=2,
    )


def add_body(doc, text, *, space_after=4):
    return add_para(
        doc,
        text,
        align=WD_ALIGN_PARAGRAPH.JUSTIFY,
        first_line_indent=Cm(1.0),
        space_after=space_after,
    )


def add_bullet(doc, text, *, space_after=2):
    return add_para(
        doc,
        f"•  {text}",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY,
        left_indent=Cm(0.75),
        space_after=space_after,
    )


def shade_cell(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")
    tc_pr.append(shd)


def set_cell_margins(cell, top=40, start=60, bottom=40, end=60):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = OxmlElement("w:tcMar")
    for name, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = OxmlElement(f"w:{name}")
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")
        tc_mar.append(node)
    tc_pr.append(tc_mar)


def set_table_borders(table, color=BORDER, size="4"):
    tbl_pr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = OxmlElement(f"w:{edge}")
        tag.set(qn("w:val"), "single")
        tag.set(qn("w:sz"), size)
        tag.set(qn("w:color"), color)
        borders.append(tag)
    tbl_pr.append(borders)


def clear_cell(cell):
    cell.text = ""
    for p in cell.paragraphs[1:]:
        p._element.getparent().remove(p._element)


def write_cell(cell, text, *, size=BODY_PT - 1, bold=False, color=INK, align=WD_ALIGN_PARAGRAPH.LEFT, fill=None):
    clear_cell(cell)
    set_cell_margins(cell)
    if fill:
        shade_cell(cell, fill)
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.1
    set_run_font(p.add_run(text), size=size, bold=bold, color=color)


def add_systems_table(doc, systems):
    table = doc.add_table(rows=1 + len(systems), cols=3)
    table.autofit = True
    set_table_borders(table)
    headers = ("ลำดับ", "ระบบงาน", "รายละเอียด")
    for i, h in enumerate(headers):
        write_cell(table.rows[0].cells[i], h, size=BODY_PT - 1, bold=True, color="FFFFFF", fill=NAVY, align=WD_ALIGN_PARAGRAPH.CENTER)
    thai_nums = "๑๒๓๔๕๖๗๘๙"
    for idx, (name, desc) in enumerate(systems, start=1):
        row = table.rows[idx]
        num = thai_nums[idx - 1] if idx <= 9 else str(idx)
        fill = PALE if idx % 2 else "FFFFFF"
        write_cell(row.cells[0], num, size=BODY_PT - 1, bold=True, color=NAVY, fill=fill, align=WD_ALIGN_PARAGRAPH.CENTER)
        write_cell(row.cells[1], name, size=BODY_PT - 1, bold=True, color=INK, fill=fill)
        write_cell(row.cells[2], desc, size=BODY_PT - 1, color=INK, fill=fill)
    # ความกว้างโดยประมาณ
    widths = (Cm(1.4), Cm(5.2), Cm(9.4))
    for row in table.rows:
        for cell, w in zip(row.cells, widths):
            cell.width = w
    add_para(doc, "", size=8, space_after=4, align=WD_ALIGN_PARAGRAPH.LEFT)


def add_model_table(doc, model_rows):
    table = doc.add_table(rows=1 + len(model_rows), cols=3)
    set_table_borders(table)
    for i, h in enumerate(("ตัวอักษร", "ความหมาย", "แนวปฏิบัติ")):
        write_cell(table.rows[0].cells[i], h, size=BODY_PT - 1, bold=True, color="FFFFFF", fill=NAVY, align=WD_ALIGN_PARAGRAPH.CENTER)
    for idx, (letter, en, th) in enumerate(model_rows, start=1):
        row = table.rows[idx]
        fill = PALE_NAVY if idx % 2 else "FFFFFF"
        write_cell(row.cells[0], letter, size=BODY_PT, bold=True, color=GOLD, fill=fill, align=WD_ALIGN_PARAGRAPH.CENTER)
        write_cell(row.cells[1], en, size=BODY_PT - 1, bold=True, color=NAVY, fill=fill)
        write_cell(row.cells[2], th, size=BODY_PT - 1, color=INK, fill=fill)
    widths = (Cm(2.0), Cm(4.5), Cm(9.5))
    for row in table.rows:
        for cell, w in zip(row.cells, widths):
            cell.width = w
    add_para(doc, "", size=8, space_after=4, align=WD_ALIGN_PARAGRAPH.LEFT)


def add_page_number(section):
    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(p.add_run("หน้า "), size=HEADER_PT, color=MUTED)
    # PAGE field
    run = p.add_run()
    set_run_font(run, size=HEADER_PT, color=MUTED)
    fld_char_begin = OxmlElement("w:fldChar")
    fld_char_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_char_end = OxmlElement("w:fldChar")
    fld_char_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char_begin)
    run._r.append(instr)
    run._r.append(fld_char_end)
    set_run_font(p.add_run(" / "), size=HEADER_PT, color=MUTED)
    run2 = p.add_run()
    set_run_font(run2, size=HEADER_PT, color=MUTED)
    begin2 = OxmlElement("w:fldChar")
    begin2.set(qn("w:fldCharType"), "begin")
    instr2 = OxmlElement("w:instrText")
    instr2.set(qn("xml:space"), "preserve")
    instr2.text = " NUMPAGES "
    end2 = OxmlElement("w:fldChar")
    end2.set(qn("w:fldCharType"), "end")
    run2._r.append(begin2)
    run2._r.append(instr2)
    run2._r.append(end2)


def set_doc_defaults(doc: Document) -> None:
    section = doc.sections[0]
    # A4
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    # ขอบเอกสารราชการไทย
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.0)
    section.header_distance = Cm(1.0)
    section.footer_distance = Cm(1.0)

    style = doc.styles["Normal"]
    style.font.name = FONT
    style.font.size = Pt(BODY_PT)
    style.font.color.rgb = RGBColor.from_string(INK)
    rpr = style.element.get_or_add_rPr()
    rFonts = OxmlElement("w:rFonts")
    for key in ("ascii", "hAnsi", "eastAsia", "cs"):
        rFonts.set(qn(f"w:{key}"), FONT)
    rpr.insert(0, rFonts)
    pf = style.paragraph_format
    pf.line_spacing = LINE_SPACING
    pf.space_after = Pt(3)

    add_page_number(section)

    # header เล็ก
    header = section.header
    header.is_linked_to_previous = False
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    set_run_font(hp.add_run("โรงเรียนบ้านคำไผ่ · KAMPAI Smart School · HEART Model"), size=HEADER_PT, color=MUTED)
    hPr = hp._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "6")
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), BORDER)
    pBdr.append(bottom)
    hPr.append(pBdr)


def _hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _load_font(path: Path, size: int):
    from PIL import ImageFont

    try:
        return ImageFont.truetype(str(path), size)
    except OSError:
        return ImageFont.load_default()


def _wrap_text(draw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    cur = words[0]
    for w in words[1:]:
        trial = f"{cur} {w}"
        if draw.textlength(trial, font=font) <= max_width:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def build_heart_infographic(path: Path) -> Path:
    """สร้างอินโฟกราฟิก HEART Model จากสถาปัตยกรรมเว็บโรงเรียน"""
    from PIL import Image, ImageDraw

    font_reg = Path(r"C:\Users\Admin\AppData\Local\Microsoft\Windows\Fonts\Sarabun-Regular.ttf")
    font_bold = Path(r"C:\Users\Admin\AppData\Local\Microsoft\Windows\Fonts\Sarabun-Bold.ttf")

    W, H = 1600, 1000
    img = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    navy = _hex_rgb(NAVY)
    gold = _hex_rgb(GOLD)
    ink = _hex_rgb(INK)
    muted = _hex_rgb(MUTED)
    pale_navy = _hex_rgb("EEF3F8")
    border = _hex_rgb(BORDER)

    draw.rounded_rectangle((24, 24, W - 24, H - 24), radius=28, fill=pale_navy, outline=border, width=2)

    title_f = _load_font(font_bold, 44)
    sub_f = _load_font(font_reg, 22)
    letter_f = _load_font(font_bold, 48)
    en_f = _load_font(font_bold, 26)
    th_f = _load_font(font_reg, 19)
    foot_f = _load_font(font_reg, 18)
    flow_f = _load_font(font_bold, 20)

    title = "HEART Model"
    subtitle = "ออกแบบจากเว็บโรงเรียนบ้านคำไผ่ · หัวใจของระบบดิจิทัลที่คืนเวลาให้ครู"
    tw = draw.textlength(title, font=title_f)
    draw.text(((W - tw) / 2, 44), title, font=title_f, fill=navy)
    draw.rounded_rectangle((W // 2 - 90, 98, W // 2 + 90, 104), radius=3, fill=gold)
    sw = draw.textlength(subtitle, font=sub_f)
    draw.text(((W - sw) / 2, 116), subtitle, font=sub_f, fill=muted)

    strip_y = 162
    draw.rounded_rectangle((50, strip_y, W - 50, strip_y + 58), radius=14, fill=(255, 255, 255), outline=border, width=1)
    flow = "เว็บโรงเรียน (แม่แบบ)  →  HEART Model  →  PDCA  →  ๕ ระบบงาน  →  คืนเวลาครู"
    fw = draw.textlength(flow, font=flow_f)
    draw.text(((W - fw) / 2, strip_y + 16), flow, font=flow_f, fill=navy)

    pillars = [
        ("H", "Hub", "หนึ่งฐานกลาง\nเว็บ CMS · ฐานข้อมูล · PWA", navy),
        ("E", "Ease", "ลดภาระอัตโนมัติ\nDocs Hub · HR · เช็คชื่อ", gold),
        ("A", "Activate", "เสริมพลังเรียนรู้\nเกม · ใบงาน · แผนสอน", navy),
        ("R", "Relate", "เชื่อมทุกบทบาท\nครู · ผู้ปกครอง · นักเรียน", gold),
        ("T", "Track", "วัดผลเพื่อปรับปรุง\nปพ./DMC · KPI · Dashboard", navy),
    ]

    card_w, card_h = 270, 430
    gap = 28
    total = 5 * card_w + 4 * gap
    start_x = (W - total) // 2
    card_y = 250

    for i, (letter, en, th, accent) in enumerate(pillars):
        x = start_x + i * (card_w + gap)
        draw.rounded_rectangle((x, card_y, x + card_w, card_y + card_h), radius=20, fill=(255, 255, 255), outline=border, width=2)
        draw.rounded_rectangle((x, card_y, x + card_w, card_y + 14), radius=8, fill=accent)
        cx, cy, r = x + card_w // 2, card_y + 88, 46
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=accent)
        lw = draw.textlength(letter, font=letter_f)
        draw.text((cx - lw / 2, cy - 28), letter, font=letter_f, fill=(255, 255, 255))

        ew = draw.textlength(en, font=en_f)
        draw.text((x + (card_w - ew) / 2, card_y + 158), en, font=en_f, fill=navy)

        ty = card_y + 210
        for line in th.split("\n"):
            for wline in _wrap_text(draw, line, th_f, card_w - 36):
                ww = draw.textlength(wline, font=th_f)
                draw.text((x + (card_w - ww) / 2, ty), wline, font=th_f, fill=ink)
                ty += 28

    foot = "แม่แบบจากเว็บ: Public/CMS · Academic · Docs/HR · Educational Hub · Portals · Digital Ops"
    fww = draw.textlength(foot, font=foot_f)
    draw.text(((W - fww) / 2, H - 68), foot, font=foot_f, fill=muted)

    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    return path


def add_infographic(doc: Document, image_path: Path, width_cm: float = 16.0) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run()
    run.add_picture(str(image_path), width=Cm(width_cm))
    cap = add_para(
        doc,
        "ภาพที่ ๑  อินโฟกราฟิก HEART Model — ออกแบบจากสถาปัตยกรรมเว็บโรงเรียนบ้านคำไผ่ "
        "และตอบโจทย์ปัญหาในหลักการและเหตุผล",
        size=CAPTION_PT,
        color=MUTED,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=8,
    )
    for run in cap.runs:
        run.italic = True


def build_docx(path: Path) -> Path:
    _finalize_content()
    doc = Document()
    set_doc_defaults(doc)
    c = CONTENT

    # —— หัวเรื่องแบบตัวอย่าง PDF ——
    add_para(doc, c["title"], size=TITLE_PT, bold=True, color=NAVY, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    for line in c["subtitle"].split("\n"):
        add_para(doc, line, size=SUB_PT, bold=True, color=INK, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=1)
    add_para(
        doc,
        f'{c["school"]}  {c["affiliation"]}',
        size=BODY_PT,
        bold=True,
        color=INK,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=8,
        space_after=1,
    )
    add_para(doc, c["network"], size=12, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=1)
    add_para(doc, c["address"], size=11, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_runs_para(
        doc,
        [
            ("ชื่อผลงาน  ", True, BODY_PT, NAVY),
            (c["work_title"], True, BODY_PT, GOLD),
        ],
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=2,
    )
    add_para(
        doc,
        f'ผู้อำนวยการสถานศึกษา  {c["director"]}',
        size=12,
        color=INK,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=2,
    )
    add_hrule(doc)

    # ๑
    add_section_heading(doc, "๑. หลักการและเหตุผล")
    for para in c["rationale"]:
        add_body(doc, para)

    # ๒
    add_section_heading(doc, "๒. วัตถุประสงค์")
    for obj in c["objectives"]:
        add_para(doc, obj, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3)

    # ๓
    add_section_heading(doc, "๓. เป้าหมาย")
    add_subheading(doc, "๓.๑ เชิงปริมาณ")
    for g in c["qty_goals"]:
        add_para(doc, g, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3)
    add_subheading(doc, "๓.๒ เป้าหมายเชิงคุณภาพ")
    for g in c["ql_goals"]:
        add_para(doc, g, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3)

    # ๔
    add_section_heading(doc, "๔. วิธีการดำเนินงาน")
    add_body(
        doc,
        'เพื่อให้เห็นถึงการขับเคลื่อนนวัตกรรม “KAMPAI Smart School” การดำเนินงานโดยประยุกต์ใช้วงจร '
        "คุณภาพ PDCA ผสมผสานกับแนวคิด HEART Model ที่ออกแบบจากเว็บโรงเรียน ผ่านสู่ระบบดิจิทัล ดังนี้",
    )

    add_subheading(doc, "๔.๑ ขั้นวางแผน (Plan: P) – ร่วมคิด ร่วมวางทิศทาง")
    for item in c["plan"]:
        add_bullet(doc, item)

    add_subheading(doc, "๔.๒ ขั้นดำเนินงาน (Do: D) – ลงมือทำ ปรับเปลี่ยนกระบวนการ")
    add_para(doc, "การพัฒนา ๕ ระบบงานหลัก ได้แก่", space_after=2, align=WD_ALIGN_PARAGRAPH.LEFT)
    for name, desc in c["do_systems"]:
        add_runs_para(
            doc,
            [
                (f"•  {name} — ", True, BODY_PT, NAVY),
                (desc, False, BODY_PT, INK),
            ],
            align=WD_ALIGN_PARAGRAPH.JUSTIFY,
            space_after=2,
        )
        # indent via left indent on last para
        doc.paragraphs[-1].paragraph_format.left_indent = Cm(0.5)
    add_bullet(doc, c["do_extra"], space_after=4)

    add_subheading(doc, "๔.๓ ขั้นตรวจสอบ (Check: C) – ติดตามผล สะท้อนความสำเร็จ")
    for item in c["check"]:
        add_bullet(doc, item)

    add_subheading(doc, "๔.๔ ขั้นปรับปรุง (Act: A) – พัฒนาต่อยอด ยกระดับคุณภาพ")
    for item in c["act"]:
        add_bullet(doc, item)

    # ๕
    add_section_heading(doc, "๕. รูปแบบแนวคิด วิธีการ กระบวนการที่ทำให้เกิดความสำเร็จ")
    add_subheading(doc, '๕.๑ รูปแบบแนวคิด “HEART Model” (หัวใจแห่งการเปลี่ยนผ่านดิจิทัล)')
    add_body(doc, c["model_intro"], space_after=3)
    add_body(doc, c["model_link_rationale"], space_after=4)

    # อินโฟกราฟิก HEART — ใช้ภาพ curated จาก public ถ้ามี (ไม่ทับด้วยภาพ PIL)
    curated = Path(__file__).resolve().parents[1] / "public" / "images" / "heart-model-infographic.png"
    infographic = OUT_DIR / "heart-model-infographic.png"
    if curated.exists():
        shutil.copy2(curated, infographic)
    else:
        build_heart_infographic(infographic)
    add_infographic(doc, infographic)

    add_para(doc, "รายละเอียด ๕ เสาหลัก มีดังนี้", size=BODY_PT, bold=True, color=NAVY, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=3)

    for letter, en, th in c["model"]:
        add_runs_para(
            doc,
            [
                (f"{letter} ({en})  ", True, BODY_PT, NAVY),
                (th, False, BODY_PT, INK),
            ],
            align=WD_ALIGN_PARAGRAPH.JUSTIFY,
            space_after=2,
        )
        doc.paragraphs[-1].paragraph_format.left_indent = Cm(0.5)
    add_body(doc, c["model_web_link"], space_after=4)

    add_subheading(doc, "๕.๒ เคล็ดลับและกลยุทธ์สำคัญ เทคนิค และรูปแบบการบริหารจัดการ")
    add_body(doc, c["strategy"])

    add_subheading(doc, "๕.๓ การมีส่วนร่วมของภาคีเครือข่าย")
    add_body(doc, c["partners"])

    # ๖
    add_section_heading(doc, "๖. ผลการดำเนินงาน")
    add_subheading(doc, "๖.๑ เชิงปริมาณ")
    for item in c["results_qty"]:
        add_para(doc, item, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3)
    add_subheading(doc, "๖.๒ เชิงคุณภาพ")
    for item in c["results_ql"]:
        add_para(doc, item, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3)
    add_body(
        doc,
        "หลักฐานเชิงประจักษ์จากการใช้งานระบบจริงบนเว็บโรงเรียน "
        "ได้จัดทำเป็นภาพหน้าจอไว้ใน ภาคผนวก ก เพื่อยืนยันว่านวัตกรรมดำเนินการจริง "
        "และสอดคล้องกับ HEART Model",
        space_after=4,
    )

    # ๗
    add_section_heading(doc, "๗. การเผยแพร่")
    add_body(doc, c["dissemination"])

    # ภาคผนวก ก
    add_appendix_evidence(doc)

    path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(path)
    return path


def add_appendix_evidence(doc: Document) -> None:
    """ภาคผนวก ก — ภาพหลักฐานจากระบบเว็บจริง"""
    # page break before appendix
    p = doc.add_paragraph()
    run = p.add_run()
    br = OxmlElement("w:br")
    br.set(qn("w:type"), "page")
    run._r.append(br)

    add_section_heading(doc, "ภาคผนวก ก  หลักฐานเชิงประจักษ์จากระบบเว็บโรงเรียน")
    add_body(
        doc,
        "ภาคผนวกนี้รวบรวมภาพหน้าจอระบบที่เปิดใช้งานจริงบนเว็บไซต์โรงเรียนบ้านคำไผ่ "
        "(https://kampai-school.vercel.app) เพื่อใช้เป็นหลักฐานประกอบผลการดำเนินงาน "
        "ว่ามีการพัฒนาระบบดิจิทัลตาม HEART Model และใช้งานได้จริง ไม่ใช่เพียงแนวคิดบนเอกสาร "
        "หมายเหตุ: ระบบหลังบ้านที่ต้องล็อกอิน (เช็คชื่อ คะแนน ปพ. สารบรรณ ลาออนไลน์ Digital Ops) "
        "เป็นหลักฐานภายในสถานศึกษา สามารถเพิ่มเติมในภาคผนวกนี้ได้เมื่อจัดทำรายงานฉบับส่งเขตพื้นที่ฯ",
        space_after=8,
    )

    for i, item in enumerate(EVIDENCE):
        img_path = EVIDENCE_DIR / item["file"]
        if not img_path.exists() or img_path.stat().st_size < 1000:
            continue
        add_para(
            doc,
            item["title"],
            size=BODY_PT,
            bold=True,
            color=NAVY,
            align=WD_ALIGN_PARAGRAPH.LEFT,
            space_before=8,
            space_after=3,
        )
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run()
        run.add_picture(str(img_path), width=Cm(14.5))
        add_para(
            doc,
            item["caption"],
            size=CAPTION_PT,
            color=MUTED,
            align=WD_ALIGN_PARAGRAPH.CENTER,
            space_after=2,
        )
        add_para(
            doc,
            f'ที่มา: {item["url"]}',
            size=CAPTION_PT,
            color=MUTED,
            align=WD_ALIGN_PARAGRAPH.CENTER,
            space_after=8,
        )


def export_pdf_via_word(docx_path: Path, pdf_path: Path) -> Path:
    """ใช้ Microsoft Word COM ผ่าน PowerShell — คัดลอกไป path ASCII ชั่วคราวเพื่อเลี่ยงปัญหา encoding"""
    import shutil
    import tempfile

    tmp_dir = Path(tempfile.mkdtemp(prefix="kampai_report_"))
    tmp_docx = tmp_dir / "report.docx"
    tmp_pdf = tmp_dir / "report.pdf"
    shutil.copy2(docx_path, tmp_docx)

    ps_script = tmp_dir / "to_pdf.ps1"
    ps_script.write_text(
        "\n".join(
            [
                "$ErrorActionPreference = 'Stop'",
                "$word = New-Object -ComObject Word.Application",
                "$word.Visible = $false",
                "$word.DisplayAlerts = 0",
                "try {",
                f"  $doc = $word.Documents.Open('{tmp_docx.as_posix()}')",
                "  $wdFormatPDF = 17",
                f"  $out = '{tmp_pdf.as_posix()}'",
                "  if (Test-Path $out) { Remove-Item $out -Force }",
                "  $doc.SaveAs([ref]$out, [ref]$wdFormatPDF)",
                "  $doc.Close()",
                "} finally {",
                "  $word.Quit()",
                "  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null",
                "}",
            ]
        ),
        encoding="utf-8",
    )
    result = subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(ps_script)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    try:
        if result.returncode != 0 or not tmp_pdf.exists():
            raise RuntimeError(
                "แปลง PDF ไม่สำเร็จ\n"
                f"stdout: {result.stdout}\nstderr: {result.stderr}"
            )
        pdf_path.parent.mkdir(parents=True, exist_ok=True)
        if pdf_path.exists():
            pdf_path.unlink()
        shutil.copy2(tmp_pdf, pdf_path)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
    return pdf_path


def main() -> int:
    parser = argparse.ArgumentParser(description="สร้างรายงานลดภาระงานครู รร.บ้านคำไผ่")
    parser.add_argument("--no-pdf", action="store_true", help="สร้างเฉพาะ DOCX")
    args = parser.parse_args()

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    docx_path = build_docx(OUT_DOCX)
    print(f"DOCX: {docx_path}")

    if not args.no_pdf:
        pdf_path = export_pdf_via_word(docx_path, OUT_PDF)
        print(f"PDF:  {pdf_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
