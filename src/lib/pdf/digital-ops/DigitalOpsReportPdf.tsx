import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ensurePaporFontsRegistered } from '@/lib/pdf/papor/fonts';
import { downloadBlob } from '@/lib/download';
import type { DigitalOpsReportPayload } from '@/lib/docx/digitalOpsReportDocx';

ensurePaporFontsRegistered();

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Sarabun',
    color: '#0f172a',
    fontSize: 11,
    lineHeight: 1.45,
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#0f2744', marginBottom: 4, textAlign: 'center' },
  sub: { fontSize: 12, color: '#334155', marginBottom: 2, textAlign: 'center' },
  section: { fontSize: 13, fontWeight: 'bold', color: '#0f2744', marginTop: 12, marginBottom: 4 },
  p: { marginBottom: 4, textAlign: 'justify' },
  bullet: { marginBottom: 2, paddingLeft: 8 },
});

function DigitalOpsReportDocument({ data }: { data: DigitalOpsReportPayload }) {
  const { kpi } = data;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>รายงานผลการดำเนินงานลดภาระงานครูของสถานศึกษา</Text>
        <Text style={styles.sub}>ด้วยนวัตกรรม และ/หรือ เทคโนโลยีดิจิทัล</Text>
        <Text style={styles.sub}>ประจำปีงบประมาณ {data.fiscalYearBe}</Text>
        <Text style={[styles.sub, { fontWeight: 'bold', marginBottom: 10 }]}>{data.schoolName}</Text>
        <Text style={styles.p}>
          ชื่อผลงาน Kampai Smart Office — ปรับกระบวนการ พลิกงานเอกสาร สู่ระบบดิจิทัล
        </Text>

        <Text style={styles.section}>๑. หลักการและเหตุผล</Text>
        <Text style={styles.p}>
          สถานศึกษานำนโยบายลดภาระงานครูของ สพฐ. มาสู่การปฏิบัติ โดยบูรณาการระบบดิจิทัลบนเว็บไซต์โรงเรียน
          เพื่อลดงานเอกสารซ้ำซ้อน คืนเวลาให้ครูจัดการเรียนรู้และดูแลผู้เรียน
        </Text>

        <Text style={styles.section}>๒. วัตถุประสงค์</Text>
        <Text style={styles.bullet}>๒.๑ พัฒนาระบบงานเอกสารและธุรการให้เป็น Digital Workflow</Text>
        <Text style={styles.bullet}>๒.๒ ลดระยะเวลาและภาระงานเชิงธุรการของครู</Text>
        <Text style={styles.bullet}>๒.๓ สร้างเสริมทักษะดิจิทัลและวัฒนธรรมองค์กรที่ยั่งยืน</Text>

        <Text style={styles.section}>๓. เป้าหมายเชิงปริมาณ (สถานะปัจจุบัน)</Text>
        <Text style={styles.bullet}>• ระบบงานดิจิทัลหลัก: {kpi.digitalSystemsInUse} ระบบ</Text>
        <Text style={styles.bullet}>
          • การลาออนไลน์ {kpi.sinceDays} วัน: {kpi.leaveRequests} รายการ
        </Text>
        <Text style={styles.bullet}>
          • หนังสือสารบรรณ {kpi.sinceDays} วัน: {kpi.letters} ฉบับ
        </Text>
        <Text style={styles.bullet}>• ครูอัปสื่อ: {kpi.teacherUploaders} คน</Text>
        <Text style={styles.bullet}>
          • ครูที่มี adoption: {kpi.activeTeachers}/{kpi.staffTotal} คน ({kpi.adoptionPct}%)
        </Text>
        <Text style={styles.bullet}>• ส่งงานการบ้าน: {kpi.homeworkSubmissions} ชิ้น</Text>
        <Text style={styles.bullet}>• ความพึงพอใจ: {kpi.surveyResponses} ตอบกลับ</Text>
        <Text style={styles.bullet}>
          • เวลาเฉลี่ยที่ลดได้:{' '}
          {kpi.avgTimeSavedPct != null ? `${kpi.avgTimeSavedPct}%` : 'ยังไม่บันทึก'}
        </Text>

        <Text style={styles.section}>๔. วิธีการดำเนินงาน (PDCA)</Text>
        <Text style={styles.p}>
          Plan → Do (5 ระบบงาน) → Check (Digital Ops + แบบสำรวจ) → Act (Role Model / PLC)
        </Text>

        <Text style={styles.section}>๕. ตัวชี้วัด Time-Saving</Text>
        {data.baselines.length === 0 ? (
          <Text style={styles.bullet}>• ยังไม่มีข้อมูล baseline</Text>
        ) : (
          data.baselines.map((b) => {
            const pct =
              Number(b.minutes_before) > 0
                ? Math.round((1 - Number(b.minutes_after) / Number(b.minutes_before)) * 100)
                : 0;
            return (
              <Text key={b.workflow_label} style={styles.bullet}>
                • {b.workflow_label}: {b.minutes_before} → {b.minutes_after} นาที (−{pct}%)
              </Text>
            );
          })
        )}

        <Text style={styles.section}>๖. Digital Role Model</Text>
        {data.models.length === 0 ? (
          <Text style={styles.bullet}>• ยังไม่มีข้อมูล adoption</Text>
        ) : (
          data.models.map((m, i) => (
            <Text key={m.name} style={styles.bullet}>
              {i + 1}. {m.name} — {m.badges.join(', ')} (คะแนน {m.score})
            </Text>
          ))
        )}

        <Text style={styles.section}>๗. การเผยแพร่</Text>
        <Text style={styles.p}>เผยแพร่ผ่านเว็บไซต์โรงเรียน เพจเฟซบุ๊ก และ LINE ผู้ปกครอง</Text>
        <Text style={[styles.p, { marginTop: 12, color: '#64748b', fontSize: 9 }]}>
          สร้างอัตโนมัติจากระบบเมื่อ {data.generatedAt}
        </Text>
      </Page>
    </Document>
  );
}

export async function downloadDigitalOpsReportPdf(data: DigitalOpsReportPayload) {
  const blob = await pdf(<DigitalOpsReportDocument data={data} />).toBlob();
  downloadBlob(blob, `รายงานลดภาระครู-${new Date().toISOString().slice(0, 10)}.pdf`);
}
