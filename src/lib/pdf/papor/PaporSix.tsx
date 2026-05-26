/**
 * ปพ.6 — สมุดรายงานผลการเรียน (1 ปีการศึกษา = ภาคเรียนที่ 1 + 2)
 * Generated per student per academic year — combines both semesters side-by-side.
 */
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PaporStudentData } from '@/services/papor.service';
import { ensurePaporFontsRegistered } from './fonts';

ensurePaporFontsRegistered();

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Sarabun', fontSize: 11, color: '#1a1a1a' },
  header: {
    textAlign: 'center',
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 8,
  },
  schoolName: { fontSize: 16, fontWeight: 'bold' },
  docTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  docSub: { fontSize: 10, color: '#555', marginTop: 1 },

  infoBlock: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  infoLeft: { flex: 1 },
  infoRight: { width: 80, height: 100, borderWidth: 1, borderColor: '#999', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', marginBottom: 2 },
  infoLabel: { width: 90, fontWeight: 'bold', color: '#374151' },
  infoVal: { flex: 1 },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#157F3C',
  },

  table: { width: '100%', borderWidth: 0.5, borderColor: '#9ca3af' },
  thRow: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderBottomWidth: 0.5, borderBottomColor: '#9ca3af' },
  tdRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d1d5db' },
  cell: { paddingVertical: 3, paddingHorizontal: 5, borderRightWidth: 0.5, borderRightColor: '#d1d5db' },
  cellLast: { paddingVertical: 3, paddingHorizontal: 5 },
  th: { fontWeight: 'bold', textAlign: 'center', fontSize: 10 },
  td: { fontSize: 10 },
  tdRight: { fontSize: 10, textAlign: 'right' },
  tdCenter: { fontSize: 10, textAlign: 'center' },

  signatures: { flexDirection: 'row', marginTop: 22, gap: 20 },
  sigBox: { flex: 1, alignItems: 'center' },
  sigLine: { borderTopWidth: 0.5, borderTopColor: '#1a1a1a', width: '90%', marginTop: 30 },
  sigLabel: { fontSize: 10, marginTop: 3, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
});

interface Props {
  term1: PaporStudentData | null;
  term2: PaporStudentData | null;
  schoolName?: string;
  schoolSub?: string;
}

/** Merge subjects from both terms so the table has every subject once with two columns. */
function mergeSubjects(t1: PaporStudentData | null, t2: PaporStudentData | null) {
  const merged = new Map<string, { t1?: { percent: number; grade: string }; t2?: { percent: number; grade: string } }>();
  for (const s of t1?.scores ?? []) {
    merged.set(s.subject, { t1: { percent: s.percent, grade: s.grade }, t2: undefined });
  }
  for (const s of t2?.scores ?? []) {
    const cur = merged.get(s.subject) ?? {};
    cur.t2 = { percent: s.percent, grade: s.grade };
    merged.set(s.subject, cur);
  }
  return Array.from(merged.entries())
    .map(([subject, v]) => ({ subject, ...v }))
    .sort((a, b) => a.subject.localeCompare(b.subject, 'th'));
}

export const PaporSix = ({ term1, term2, schoolName = 'โรงเรียนบ้านคำไผ่', schoolSub = '' }: Props) => {
  const ref = term1 ?? term2;
  if (!ref) {
    return (
      <Document title="ปพ.6 - ไม่มีข้อมูล">
        <Page size="A4" style={styles.page}>
          <Text>ไม่มีข้อมูลสำหรับสร้าง ปพ.6</Text>
        </Page>
      </Document>
    );
  }
  const subjects = mergeSubjects(term1, term2);

  // Yearly totals (avg of two terms)
  const avgPercent = (() => {
    const vals = [term1?.averagePercent, term2?.averagePercent].filter((v): v is number => typeof v === 'number' && v > 0);
    return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
  })();
  const attendanceSum = (() => {
    const a = { present: 0, absent: 0, late: 0, leave: 0, totalDays: 0 };
    for (const t of [term1, term2]) {
      if (!t) continue;
      a.present += t.attendance.present;
      a.absent += t.attendance.absent;
      a.late += t.attendance.late;
      a.leave += t.attendance.leave;
      a.totalDays += t.attendance.totalDays;
    }
    return a;
  })();

  return (
    <Document title={`ปพ.6 - ${ref.student.name} - ปีการศึกษา ${ref.academicYear}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          {schoolSub ? <Text style={styles.docSub}>{schoolSub}</Text> : null}
          <Text style={styles.docTitle}>ปพ.6 — สมุดรายงานผลการเรียน</Text>
          <Text style={styles.docSub}>ปีการศึกษา {ref.academicYear}</Text>
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.infoLeft}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ชื่อ-สกุล:</Text>
              <Text style={styles.infoVal}>{ref.student.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เลขประจำตัว:</Text>
              <Text style={styles.infoVal}>{ref.student.student_code ?? '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ชั้น:</Text>
              <Text style={styles.infoVal}>
                {ref.student.class}
                {ref.student.room ? `/${ref.student.room}` : ''} เลขที่ {ref.student.class_number ?? '-'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>วันเกิด:</Text>
              <Text style={styles.infoVal}>{ref.student.birth_date ?? '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>บิดา/มารดา:</Text>
              <Text style={styles.infoVal}>
                {ref.student.father_name ?? '-'} / {ref.student.mother_name ?? '-'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRight}>
            {ref.student.photo_url ? (
              <Image src={ref.student.photo_url} style={styles.photo} />
            ) : (
              <Text style={{ fontSize: 9, color: '#999' }}>รูปนักเรียน</Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>ผลการเรียนทั้งปี — ภาคเรียนที่ 1 และ 2</Text>
        <View style={styles.table}>
          <View style={styles.thRow}>
            <View style={[styles.cell, { width: '40%' }]}>
              <Text style={styles.th}>รายวิชา</Text>
            </View>
            <View style={[styles.cell, { width: '15%' }]}>
              <Text style={styles.th}>ภาค 1 (%)</Text>
            </View>
            <View style={[styles.cell, { width: '15%' }]}>
              <Text style={styles.th}>เกรด 1</Text>
            </View>
            <View style={[styles.cell, { width: '15%' }]}>
              <Text style={styles.th}>ภาค 2 (%)</Text>
            </View>
            <View style={[styles.cellLast, { width: '15%' }]}>
              <Text style={styles.th}>เกรด 2</Text>
            </View>
          </View>
          {subjects.length === 0 ? (
            <View style={styles.tdRow}>
              <View style={[styles.cellLast, { width: '100%' }]}>
                <Text style={[styles.tdCenter, { color: '#9ca3af', padding: 4 }]}>ไม่มีข้อมูลคะแนนในปีการศึกษานี้</Text>
              </View>
            </View>
          ) : (
            subjects.map((s) => (
              <View style={styles.tdRow} key={s.subject}>
                <View style={[styles.cell, { width: '40%' }]}>
                  <Text style={styles.td}>{s.subject}</Text>
                </View>
                <View style={[styles.cell, { width: '15%' }]}>
                  <Text style={styles.tdRight}>{s.t1 ? `${s.t1.percent.toFixed(1)}%` : '-'}</Text>
                </View>
                <View style={[styles.cell, { width: '15%' }]}>
                  <Text style={[styles.tdCenter, { fontWeight: 'bold' }]}>{s.t1?.grade ?? '-'}</Text>
                </View>
                <View style={[styles.cell, { width: '15%' }]}>
                  <Text style={styles.tdRight}>{s.t2 ? `${s.t2.percent.toFixed(1)}%` : '-'}</Text>
                </View>
                <View style={[styles.cellLast, { width: '15%' }]}>
                  <Text style={[styles.tdCenter, { fontWeight: 'bold' }]}>{s.t2?.grade ?? '-'}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>สรุปประจำปี</Text>
        <View style={styles.table}>
          <View style={styles.thRow}>
            <View style={[styles.cell, { width: '34%' }]}>
              <Text style={styles.th}>คะแนนเฉลี่ยรวม</Text>
            </View>
            <View style={[styles.cell, { width: '22%' }]}>
              <Text style={styles.th}>มาเรียน</Text>
            </View>
            <View style={[styles.cell, { width: '22%' }]}>
              <Text style={styles.th}>ขาด</Text>
            </View>
            <View style={[styles.cellLast, { width: '22%' }]}>
              <Text style={styles.th}>เกรดเฉลี่ย</Text>
            </View>
          </View>
          <View style={styles.tdRow}>
            <View style={[styles.cell, { width: '34%' }]}>
              <Text style={styles.tdCenter}>{avgPercent.toFixed(1)}%</Text>
            </View>
            <View style={[styles.cell, { width: '22%' }]}>
              <Text style={styles.tdCenter}>
                {attendanceSum.present + attendanceSum.late}/{attendanceSum.totalDays} วัน
              </Text>
            </View>
            <View style={[styles.cell, { width: '22%' }]}>
              <Text style={styles.tdCenter}>{attendanceSum.absent} วัน</Text>
            </View>
            <View style={[styles.cellLast, { width: '22%' }]}>
              <Text style={[styles.tdCenter, { fontWeight: 'bold' }]}>
                {avgPercent >= 80 ? '4' : avgPercent >= 75 ? '3.5' : avgPercent >= 70 ? '3' : avgPercent >= 65 ? '2.5' : avgPercent >= 60 ? '2' : avgPercent >= 55 ? '1.5' : avgPercent >= 50 ? '1' : '0'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.signatures}>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>ครูประจำชั้น</Text>
          </View>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>นายทะเบียน</Text>
          </View>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>ผู้อำนวยการ</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          ออกโดยระบบ Kampai School Management · เอกสารนี้สร้างอัตโนมัติจากข้อมูลในระบบ
        </Text>
      </Page>
    </Document>
  );
};
