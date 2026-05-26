/**
 * ปพ.5 — แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (1 หน้า/คน/ภาคเรียน)
 * Generated per student per semester.
 */
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PaporStudentData } from '@/services/papor.service';
import { ensurePaporFontsRegistered } from './fonts';

ensurePaporFontsRegistered();

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Sarabun',
    fontSize: 11,
    color: '#1a1a1a',
  },
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

  infoBlock: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  infoLeft: { flex: 1 },
  infoRight: {
    width: 80,
    height: 100,
    borderWidth: 1,
    borderColor: '#999',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  cell: {
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: '#d1d5db',
  },
  cellLast: { paddingVertical: 3, paddingHorizontal: 5 },
  th: { fontWeight: 'bold', textAlign: 'center', fontSize: 10 },
  td: { fontSize: 10 },
  tdRight: { fontSize: 10, textAlign: 'right' },
  tdCenter: { fontSize: 10, textAlign: 'center' },

  summary: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  summaryBox: {
    flex: 1,
    padding: 6,
    borderWidth: 0.5,
    borderColor: '#9ca3af',
    borderRadius: 3,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 9, color: '#555' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },

  signatures: { flexDirection: 'row', marginTop: 22, gap: 20 },
  sigBox: { flex: 1, alignItems: 'center' },
  sigLine: { borderTopWidth: 0.5, borderTopColor: '#1a1a1a', width: '90%', marginTop: 30 },
  sigLabel: { fontSize: 10, marginTop: 3, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
});

interface Props {
  data: PaporStudentData;
  schoolName?: string;
  schoolSub?: string; // เช่น "สำนักงานเขตพื้นที่การศึกษา..."
}

export const PaporFive = ({ data, schoolName = 'โรงเรียนบ้านคำไผ่', schoolSub = '' }: Props) => {
  const semLabel = data.semester === '1' ? 'ภาคเรียนที่ 1' : 'ภาคเรียนที่ 2';
  return (
    <Document title={`ปพ.5 - ${data.student.name} - ${semLabel} ปีการศึกษา ${data.academicYear}`}>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          {schoolSub ? <Text style={styles.docSub}>{schoolSub}</Text> : null}
          <Text style={styles.docTitle}>ปพ.5 — แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล</Text>
          <Text style={styles.docSub}>
            {semLabel} ปีการศึกษา {data.academicYear}
          </Text>
        </View>

        {/* STUDENT INFO */}
        <View style={styles.infoBlock}>
          <View style={styles.infoLeft}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ชื่อ-สกุล:</Text>
              <Text style={styles.infoVal}>{data.student.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เลขประจำตัว:</Text>
              <Text style={styles.infoVal}>{data.student.student_code ?? '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ชั้น:</Text>
              <Text style={styles.infoVal}>
                {data.student.class}
                {data.student.room ? `/${data.student.room}` : ''} เลขที่ {data.student.class_number ?? '-'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>วันเกิด:</Text>
              <Text style={styles.infoVal}>{data.student.birth_date ?? '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เชื้อชาติ/ศาสนา:</Text>
              <Text style={styles.infoVal}>
                {data.student.nationality ?? '-'} / {data.student.religion ?? '-'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>บิดา/มารดา:</Text>
              <Text style={styles.infoVal}>
                {data.student.father_name ?? '-'} / {data.student.mother_name ?? '-'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRight}>
            {data.student.photo_url ? (
              <Image src={data.student.photo_url} style={styles.photo} />
            ) : (
              <Text style={{ fontSize: 9, color: '#999' }}>รูปนักเรียน</Text>
            )}
          </View>
        </View>

        {/* SCORES */}
        <Text style={styles.sectionTitle}>1. ผลการเรียนรายวิชา</Text>
        <View style={styles.table}>
          <View style={styles.thRow}>
            <View style={[styles.cell, { width: '40%' }]}>
              <Text style={styles.th}>รายวิชา</Text>
            </View>
            <View style={[styles.cell, { width: '15%' }]}>
              <Text style={styles.th}>คะแนนเก็บ</Text>
            </View>
            <View style={[styles.cell, { width: '15%' }]}>
              <Text style={styles.th}>คะแนนเต็ม</Text>
            </View>
            <View style={[styles.cell, { width: '15%' }]}>
              <Text style={styles.th}>ร้อยละ</Text>
            </View>
            <View style={[styles.cellLast, { width: '15%' }]}>
              <Text style={styles.th}>เกรด</Text>
            </View>
          </View>
          {data.scores.length === 0 ? (
            <View style={styles.tdRow}>
              <View style={[styles.cellLast, { width: '100%' }]}>
                <Text style={[styles.tdCenter, { color: '#9ca3af', padding: 4 }]}>ไม่มีข้อมูลคะแนนในภาคเรียนนี้</Text>
              </View>
            </View>
          ) : (
            data.scores.map((s) => (
              <View style={styles.tdRow} key={s.subject}>
                <View style={[styles.cell, { width: '40%' }]}>
                  <Text style={styles.td}>{s.subject}</Text>
                </View>
                <View style={[styles.cell, { width: '15%' }]}>
                  <Text style={styles.tdRight}>{s.total.toFixed(1)}</Text>
                </View>
                <View style={[styles.cell, { width: '15%' }]}>
                  <Text style={styles.tdRight}>{s.max.toFixed(1)}</Text>
                </View>
                <View style={[styles.cell, { width: '15%' }]}>
                  <Text style={styles.tdRight}>{s.percent.toFixed(1)}%</Text>
                </View>
                <View style={[styles.cellLast, { width: '15%' }]}>
                  <Text style={[styles.tdCenter, { fontWeight: 'bold' }]}>{s.grade}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* SUMMARY */}
        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>คะแนนเฉลี่ย</Text>
            <Text style={styles.summaryValue}>{data.averagePercent.toFixed(1)}%</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>เกรดเฉลี่ย</Text>
            <Text style={styles.summaryValue}>{data.averageGrade}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>มาเรียน</Text>
            <Text style={styles.summaryValue}>
              {data.attendance.present + data.attendance.late}/{data.attendance.totalDays} วัน
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>ร้อยละการมาเรียน</Text>
            <Text style={styles.summaryValue}>{data.attendance.presentPercent.toFixed(1)}%</Text>
          </View>
        </View>

        {/* ATTENDANCE DETAIL */}
        <Text style={styles.sectionTitle}>2. สถิติการมาเรียน</Text>
        <View style={styles.table}>
          <View style={styles.thRow}>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text style={styles.th}>มาเรียน</Text>
            </View>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text style={styles.th}>มาสาย</Text>
            </View>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text style={styles.th}>ลา</Text>
            </View>
            <View style={[styles.cellLast, { width: '25%' }]}>
              <Text style={styles.th}>ขาด</Text>
            </View>
          </View>
          <View style={styles.tdRow}>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text style={styles.tdCenter}>{data.attendance.present} วัน</Text>
            </View>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text style={styles.tdCenter}>{data.attendance.late} วัน</Text>
            </View>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text style={styles.tdCenter}>{data.attendance.leave} วัน</Text>
            </View>
            <View style={[styles.cellLast, { width: '25%' }]}>
              <Text style={styles.tdCenter}>{data.attendance.absent} วัน</Text>
            </View>
          </View>
        </View>

        {/* CONDUCT */}
        <Text style={styles.sectionTitle}>3. คุณลักษณะอันพึงประสงค์ / ความประพฤติ</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.summaryBox, { flex: 1 }]}>
            <Text style={styles.summaryLabel}>ความดี</Text>
            <Text style={[styles.summaryValue, { color: '#157F3C' }]}>+{data.conduct.positiveCount}</Text>
          </View>
          <View style={[styles.summaryBox, { flex: 1 }]}>
            <Text style={styles.summaryLabel}>ที่ควรปรับปรุง</Text>
            <Text style={[styles.summaryValue, { color: '#b91c1c' }]}>{data.conduct.negativeCount}</Text>
          </View>
          <View style={[styles.summaryBox, { flex: 1 }]}>
            <Text style={styles.summaryLabel}>คะแนนสุทธิ</Text>
            <Text style={styles.summaryValue}>{data.conduct.netScore > 0 ? `+${data.conduct.netScore}` : data.conduct.netScore}</Text>
          </View>
        </View>
        {data.conduct.topReasons.length > 0 && (
          <Text style={{ fontSize: 10, marginTop: 4, color: '#374151' }}>
            พฤติกรรมที่บันทึกบ่อย: {data.conduct.topReasons.join(' · ')}
          </Text>
        )}

        {/* SIGNATURES */}
        <View style={styles.signatures}>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>ครูประจำชั้น</Text>
          </View>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>หัวหน้าฝ่ายวิชาการ</Text>
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
