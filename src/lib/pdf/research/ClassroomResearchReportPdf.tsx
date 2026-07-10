import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatThaiDateFull, formatThaiDateMedium, formatThaiDateRange } from '@/lib/thaiDate';
import { ensurePaporFontsRegistered } from '@/lib/pdf/papor/fonts';
import { researchPhaseLabel } from '@/services/game-research.service';
import { downloadBlob } from '@/lib/download';
import type { ClassroomResearchDocInput } from '@/components/teacher/game-analytics/printClassroomResearchDoc';

ensurePaporFontsRegistered();

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Sarabun',
    color: '#0f172a',
    fontSize: 11,
    lineHeight: 1.45,
  },
  cover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  coverKicker: {
    fontSize: 12,
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0f2744',
    lineHeight: 1.35,
    maxWidth: 430,
  },
  coverLine: {
    width: 220,
    height: 2,
    backgroundColor: '#d4af37',
    marginTop: 18,
    marginBottom: 18,
  },
  coverSub: { fontSize: 12, color: '#334155', textAlign: 'center', marginBottom: 4 },
  coverMeta: { fontSize: 11.5, color: '#475569', textAlign: 'center', marginBottom: 2 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f2744',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginTop: 6,
    marginBottom: 4,
  },
  paragraph: { marginBottom: 5, textAlign: 'justify' },
  bullet: { marginBottom: 3, paddingLeft: 12 },
  bulletText: { fontSize: 10.8 },
  cardRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  statBox: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  statLabel: { fontSize: 9.5, color: '#64748b' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  table: { borderWidth: 0.8, borderColor: '#d1d5db', marginTop: 4 },
  row: { flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: '#e5e7eb' },
  headerRow: { flexDirection: 'row', backgroundColor: '#0f2744' },
  cell: { paddingVertical: 4, paddingHorizontal: 5, borderRightWidth: 0.6, borderRightColor: '#e5e7eb' },
  cellLast: { paddingVertical: 4, paddingHorizontal: 5 },
  headerText: { color: '#ffffff', fontSize: 9.2, fontWeight: 'bold', textAlign: 'center' },
  text: { fontSize: 9.6 },
  textCenter: { fontSize: 9.6, textAlign: 'center' },
  textRight: { fontSize: 9.6, textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 28,
    right: 28,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
});

function getReportData(input: ClassroomResearchDocInput) {
  const abstract = input.abstract?.trim() ||
    `การวิจัยในชั้นเรียนฉบับนี้มีวัตถุประสงค์เพื่อศึกษาผลของการใช้เกมการศึกษา "${input.gameTitle}" กับนักเรียนชั้น ${input.className} จำนวน ${input.stats.n} คน โดยเปรียบเทียบคะแนนก่อนเรียนและหลังเรียนในช่วง ${formatThaiDateRange(input.pretestRange.start, input.pretestRange.end)} และ ${formatThaiDateRange(input.posttestRange.start, input.posttestRange.end)} ผลการวิเคราะห์สะท้อนให้เห็นว่าคะแนนเฉลี่ยหลังเรียนสูงกว่าก่อนเรียน ${input.stats.meanGain.toFixed(1)} คะแนน และนักเรียน ${input.stats.percentImproved.toFixed(0)}% มีพัฒนาการเพิ่มขึ้นอย่างชัดเจน`;

  const problem = input.problemStatement?.trim() ||
    `การจัดการเรียนรู้เรื่อง ${input.gameTitle} จำเป็นต้องอาศัยกิจกรรมที่ช่วยกระตุ้นความสนใจ ให้ผู้เรียนได้ฝึกซ้ำอย่างเหมาะสม และเห็นผลย้อนกลับจากการเรียนรู้ได้อย่างเป็นรูปธรรม งานวิจัยชิ้นนี้จึงนำเกมการศึกษาในระบบ Kampai School มาใช้เป็นเครื่องมือหลัก เพื่อศึกษาการเปลี่ยนแปลงของผลสัมฤทธิ์และความสม่ำเสมอของการมีส่วนร่วมของนักเรียนชั้น ${input.className}`;

  const objectives = input.objectives.length > 0 ? input.objectives : [
    `เพื่อเปรียบเทียบผลสัมฤทธิ์ทางการเรียนของนักเรียนชั้น ${input.className} ก่อนเรียนและหลังเรียนด้วยเกม "${input.gameTitle}"`,
    'เพื่อศึกษาการเปลี่ยนแปลงของคะแนนเฉลี่ยและแนวโน้มพัฒนาการของผู้เรียนระหว่างช่วงก่อนเรียนและหลังเรียน',
  ];

  const hypotheses = [
    `คะแนนเฉลี่ยหลังเรียนของนักเรียนชั้น ${input.className} สูงกว่าก่อนเรียนอย่างมีนัยสำคัญในเชิงพัฒนาการ`,
    `นักเรียนส่วนใหญ่มีคะแนนหลังเรียนเพิ่มขึ้นจากการฝึกด้วยเกม "${input.gameTitle}"`,
  ];

  const benefits = [
    'ครูสามารถใช้ข้อมูลจริงจากระบบเพื่อปรับการจัดกิจกรรมการเรียนรู้ได้ตรงจุด',
    'นักเรียนได้รับประสบการณ์การฝึกซ้ำที่สนุก มีเป้าหมาย และตรวจสอบผลได้ทันที',
    'โรงเรียนสามารถนำผลการวิจัยไปใช้เป็นหลักฐานประกอบการพัฒนานวัตกรรมการสอนได้',
  ];

  const theory = [
    `แนวคิด Gamification อธิบายการนำองค์ประกอบของเกมมาประยุกต์ใช้ในกระบวนการเรียนรู้ เพื่อเพิ่มแรงจูงใจ การมีส่วนร่วม และความต่อเนื่องของการฝึกทักษะ`,
    `การฝึกทักษะด้วย ${input.gameTitle} ช่วยให้ผู้เรียนทำซ้ำในระยะสั้น รับผลย้อนกลับได้ทันที และจดจำรูปแบบคำตอบได้แม่นยำขึ้น`,
    'ระบบ Kampai School ทำหน้าที่เก็บข้อมูลก่อนเรียน–หลังเรียนและสรุปผลรายวัน จึงช่วยให้ครูวิเคราะห์แนวโน้มการเรียนรู้ได้เชิงประจักษ์',
  ];

  const relatedStudies = [
    'ผลการศึกษาที่ใช้เกมประกอบการสอนมักพบว่าผู้เรียนมีความสนใจเพิ่มขึ้น และมีคะแนนหลังเรียนสูงกว่าก่อนเรียนอย่างต่อเนื่อง',
    'การให้ feedback ทันทีระหว่างฝึกช่วยลดความสับสน ทำให้ผู้เรียนปรับคำตอบได้รวดเร็วและเกิดการเรียนรู้ที่ยั่งยืนขึ้น',
    'การเก็บข้อมูลเป็นรายวันทำให้ครูเห็นพัฒนาการของผู้เรียนเป็นลำดับ และนำผลไปปรับแผนการสอนในรอบถัดไปได้ชัดเจน',
  ];

  const methodology = [
    ['รูปแบบการวิจัย', 'การวิจัยเชิงปฏิบัติการในชั้นเรียน แบบ One-Group Pretest–Posttest Design'],
    ['กลุ่มเป้าหมาย', `นักเรียนชั้น ${input.className} จำนวน ${input.stats.n} คน`],
    ['เครื่องมือวิจัย', `เกม "${input.gameTitle}" และแบบบันทึกคะแนนในระบบ Kampai School`],
    ['การเก็บข้อมูล', `ช่วงก่อนเรียน ${formatThaiDateRange(input.pretestRange.start, input.pretestRange.end)} และช่วงหลังเรียน ${formatThaiDateRange(input.posttestRange.start, input.posttestRange.end)}`],
    ['การวิเคราะห์ข้อมูล', 'ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และร้อยละของผู้เรียนที่มีพัฒนาการสูงขึ้น'],
  ] as const;

  const dailyRows = input.dailySummaries ?? [];
  const studentRows = input.rows ?? [];
  const coverage = input.coverage;
  const recommendations = input.recommendations?.trim()
    ? input.recommendations.split('\n').map((s) => s.trim()).filter(Boolean)
    : [
        `ควรนำเกม "${input.gameTitle}" ไปใช้ซ้ำในรอบกิจกรรมถัดไปเพื่อสร้างความต่อเนื่องของการเรียนรู้`,
        'ควรติดตามนักเรียนที่ยังมีคะแนนก่อนเรียนต่ำ และจัดกิจกรรมเสริมให้เหมาะสม',
        'ควรเก็บข้อมูลรายวันอย่างสม่ำเสมอ เพื่อให้การวิเคราะห์แนวโน้มมีความครบถ้วนและตรวจสอบได้',
      ];

  const references = input.references?.trim()
    ? input.references.split('\n').map((s) => s.trim()).filter(Boolean)
    : [
        `ข้อมูลผลการเรียนรู้จากระบบ Kampai School ของโรงเรียน ${input.school.name}`,
        'เอกสารประกอบการสอนและบันทึกการจัดการเรียนรู้ของครูผู้สอน',
        `คู่มือการใช้เกมการศึกษา "${input.gameTitle}" สำหรับนักเรียนระดับชั้นต้น`,
      ];

  return {
    abstract,
    problem,
    objectives,
    hypotheses,
    benefits,
    theory,
    relatedStudies,
    methodology,
    dailyRows,
    studentRows,
    coverage,
    recommendations,
    references,
  };
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Paragraph({ children }: { children: string }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bullet}>
          <Text style={styles.bulletText}>• {item}</Text>
        </View>
      ))}
    </View>
  );
}

function KeyValueTable({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <View style={styles.table}>
      {rows.map(([label, value], index) => (
        <View
          key={label}
          style={[
            styles.row,
            index === rows.length - 1 ? { borderBottomWidth: 0 } : null,
          ]}
        >
          <View style={[styles.cell, { width: '36%', backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff' }]}>
            <Text style={styles.text}>{label}</Text>
          </View>
          <View style={[styles.cellLast, { width: '64%', backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff' }]}>
            <Text style={styles.text}>{value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function DataTable({
  headers,
  rows,
  widths,
}: {
  headers: string[];
  rows: (string | number)[][];
  widths: string[];
}) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        {headers.map((header, index) => (
          <View key={header} style={[styles.cell, index === headers.length - 1 ? styles.cellLast : styles.cell, { width: widths[index] }]}>
            <Text style={styles.headerText}>{header}</Text>
          </View>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View key={`${rowIndex}-${row.join('-')}`} style={[styles.row, rowIndex === rows.length - 1 ? { borderBottomWidth: 0 } : null]}>
          {row.map((value, cellIndex) => (
            <View
              key={`${rowIndex}-${cellIndex}`}
              style={[
                cellIndex === row.length - 1 ? styles.cellLast : styles.cell,
                { width: widths[cellIndex], backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc' },
              ]}
            >
              <Text style={cellIndex === 0 ? styles.text : styles.textCenter}>{String(value)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function SummaryGrid({ input }: { input: ClassroomResearchDocInput }) {
  const boxes = [
    ['นักเรียน', String(input.stats.n)],
    ['เฉลี่ยก่อน', input.stats.meanPretest.toFixed(1)],
    ['เฉลี่ยหลัง', input.stats.meanPosttest.toFixed(1)],
    ['% ดีขึ้น', `${input.stats.percentImproved.toFixed(0)}%`],
  ];
  return (
    <View style={styles.cardRow}>
      {boxes.map(([label, value]) => (
        <View key={label} style={styles.statBox}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function ResearchReportPdfDocument({ input }: { input: ClassroomResearchDocInput }) {
  const data = getReportData(input);
  const today = formatThaiDateFull(new Date().toISOString().split('T')[0]);
  const pretestLabel = formatThaiDateRange(input.pretestRange.start, input.pretestRange.end);
  const posttestLabel = formatThaiDateRange(input.posttestRange.start, input.posttestRange.end);
  const reportTitle = input.title?.trim() || `รายงานวิจัยในชั้นเรียนเรื่อง ${input.gameTitle}`;
  const oneDay =
    input.pretestRange.start === input.pretestRange.end &&
    input.posttestRange.start === input.posttestRange.end &&
    input.pretestRange.start === input.posttestRange.start;

  return (
    <Document title={reportTitle} author={input.teacherName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.coverKicker}>{input.school.name} · ปีการศึกษา {input.school.academicYear}</Text>
          <Text style={styles.coverTitle}>รายงานวิจัยในชั้นเรียนฉบับสมบูรณ์</Text>
          <View style={styles.coverLine} />
          <Text style={styles.coverSub}>{reportTitle}</Text>
          <Text style={styles.coverMeta}>ผู้วิจัย: {input.teacherName}</Text>
          <Text style={styles.coverMeta}>ระดับชั้น: {input.className} · เครื่องมือที่ใช้: {input.gameTitle}</Text>
          <Text style={styles.coverMeta}>ช่วงก่อนเรียน: {pretestLabel}</Text>
          <Text style={styles.coverMeta}>ช่วงหลังเรียน: {posttestLabel}</Text>
          <Text style={[styles.coverMeta, { marginTop: 16, color: '#94a3b8' }]}>จัดทำเมื่อ {today}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>บทคัดย่อ</SectionTitle>
        <Paragraph>{data.abstract}</Paragraph>
        <View style={styles.table}>
          {[
            ['ชื่อเรื่อง', reportTitle],
            ['กลุ่มตัวอย่าง', `นักเรียนชั้น ${input.className} จำนวน ${input.stats.n} คน`],
            ['ช่วงก่อนเรียน', pretestLabel],
            ['ช่วงหลังเรียน', posttestLabel],
            ['ลักษณะการทดสอบ', oneDay ? 'ก่อนเรียนและหลังเรียนภายในวันเดียว' : 'ก่อนเรียนและหลังเรียนตามช่วงวันที่กำหนด'],
          ].map(([label, value], index, arr) => (
            <View key={label} style={[styles.row, index === arr.length - 1 ? { borderBottomWidth: 0 } : null]}>
              <View style={[styles.cell, { width: '32%', backgroundColor: '#f8fafc' }]}>
                <Text style={styles.text}>{label}</Text>
              </View>
              <View style={[styles.cellLast, { width: '68%', backgroundColor: '#ffffff' }]}>
                <Text style={styles.text}>{value}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>บทที่ 1 บทนำ</SectionTitle>
        <Text style={styles.subsectionTitle}>1.1 ความเป็นมาและความสำคัญของปัญหา</Text>
        <Paragraph>{data.problem}</Paragraph>
        <Text style={styles.subsectionTitle}>1.2 วัตถุประสงค์ของการวิจัย</Text>
        <BulletList items={data.objectives} />
        <Text style={styles.subsectionTitle}>1.3 สมมติฐานการวิจัย</Text>
        <BulletList items={data.hypotheses} />
        <Text style={styles.subsectionTitle}>1.4 ขอบเขตของการวิจัย</Text>
        <KeyValueTable rows={[
          ['ประชากร', `นักเรียนชั้น ${input.className} ที่เข้าร่วมโครงการวิจัย`],
          ['กลุ่มตัวอย่าง', `${input.className} จำนวน ${input.stats.n} คน`],
          ['เนื้อหา', `ทักษะการคูณและการฝึกด้วยเกม "${input.gameTitle}"`],
          ['ระยะเวลา', `${pretestLabel} ถึง ${posttestLabel}`],
          ['เครื่องมือ', `เกม "${input.gameTitle}" และระบบบันทึกคะแนนอัตโนมัติ`],
        ]} />
        <Text style={styles.subsectionTitle}>1.5 ประโยชน์ที่คาดว่าจะได้รับ</Text>
        <BulletList items={data.benefits} />
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง</SectionTitle>
        <Text style={styles.subsectionTitle}>2.1 แนวคิด Gamification</Text>
        <Paragraph>{data.theory[0]}</Paragraph>
        <Text style={styles.subsectionTitle}>2.2 การฝึกทักษะด้วยเกมการศึกษา</Text>
        <Paragraph>{data.theory[1]}</Paragraph>
        <Text style={styles.subsectionTitle}>2.3 ระบบบันทึกข้อมูลใน Kampai School</Text>
        <Paragraph>{data.theory[2]}</Paragraph>
        <Text style={styles.subsectionTitle}>2.4 งานวิจัยที่เกี่ยวข้อง</Text>
        <BulletList items={data.relatedStudies} />

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>บทที่ 3 วิธีดำเนินการวิจัย</Text>
        <KeyValueTable rows={data.methodology} />
        <Text style={styles.subsectionTitle}>3.1 การเก็บข้อมูลรายวัน</Text>
        <Paragraph>ระบบบันทึกข้อมูลรายวันแยกตามช่วงก่อนเรียนและหลังเรียน เพื่อให้สามารถติดตามจำนวนรอบ จำนวนผู้เรียน และค่าเฉลี่ยได้อย่างต่อเนื่อง</Paragraph>
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>บทที่ 4 ผลการวิจัย</SectionTitle>
        <SummaryGrid input={input} />
        <Text style={styles.subsectionTitle}>4.1 สรุปผลภาพรวม</Text>
        <DataTable
          headers={['รายการ', 'ก่อนเรียน', 'หลังเรียน', 'ผลต่าง', '% ดีขึ้น']}
          widths={['30%', '17%', '17%', '18%', '18%']}
          rows={[
            ['สรุปภาพรวม', input.stats.meanPretest.toFixed(1), input.stats.meanPosttest.toFixed(1), `${input.stats.meanGain >= 0 ? '+' : ''}${input.stats.meanGain.toFixed(1)}`, `${input.stats.percentImproved.toFixed(0)}%`],
          ]}
        />

        <Text style={styles.subsectionTitle}>4.2 ตารางรายบุคคล</Text>
        <DataTable
          headers={['เลขที่', 'ชื่อ-สกุล', 'ก่อนเรียน', 'หลังเรียน', 'ผลต่าง']}
          widths={['12%', '42%', '15%', '15%', '16%']}
          rows={data.studentRows.map((row, index) => [
            String(row.classNumber ?? index + 1),
            row.name,
            row.pretestMean !== null ? row.pretestMean.toFixed(1) : '—',
            row.posttestMean !== null ? row.posttestMean.toFixed(1) : '—',
            row.gain !== null ? `${row.gain >= 0 ? '+' : ''}${row.gain.toFixed(1)}` : '—',
          ])}
        />

        <Text style={styles.subsectionTitle}>4.3 ข้อมูลรายวัน</Text>
        <DataTable
          headers={['วันที่', 'ช่วง', 'รอบ', 'นักเรียน', 'เฉลี่ย']}
          widths={['26%', '18%', '12%', '22%', '22%']}
          rows={data.dailyRows.map((row) => [
            formatThaiDateMedium(row.date),
            researchPhaseLabel(row.phase),
            String(row.sessions),
            String(row.uniqueStudents),
            row.meanScore !== null ? row.meanScore.toFixed(1) : '—',
          ])}
        />
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>บทที่ 5 สรุป อภิปรายผล และข้อเสนอแนะ</SectionTitle>
        <Text style={styles.subsectionTitle}>5.1 อภิปรายผลการวิจัย</Text>
        <Paragraph>
          ผลการวิจัยสะท้อนว่าการจัดการเรียนรู้ด้วยเกม "{input.gameTitle}" ช่วยให้ผู้เรียนมีส่วนร่วมมากขึ้น
          และมีผลสัมฤทธิ์หลังเรียนสูงกว่าก่อนเรียนอย่างเห็นได้ชัด จึงสอดคล้องกับแนวคิดการเรียนรู้เชิงรุกที่เน้นการลงมือฝึกและรับผลย้อนกลับอย่างต่อเนื่อง
        </Paragraph>
        <Text style={styles.subsectionTitle}>5.2 ข้อจำกัดของการวิจัย</Text>
        <BulletList items={[
          `ข้อมูลที่ใช้วิเคราะห์เก็บจากนักเรียนชั้น ${input.className} ในช่วงเวลาที่กำหนด`,
          'รูปแบบการวิจัยเป็นการศึกษาในชั้นเรียนแบบกลุ่มเดียว จึงควรตีความผลด้วยความระมัดระวัง',
          'หากข้อมูลรายวันขาดช่วง อาจส่งผลต่อความสมบูรณ์ของการวิเคราะห์แนวโน้ม',
        ]} />
        <Text style={styles.subsectionTitle}>5.3 ข้อเสนอแนะ</Text>
        <BulletList items={data.recommendations} />
        <Text style={styles.subsectionTitle}>5.4 สรุปโดยย่อ</Text>
        <Paragraph>
          โดยสรุป การใช้เกมการศึกษา "{input.gameTitle}" เป็นสื่อประกอบการเรียนรู้สามารถช่วยยกระดับผลสัมฤทธิ์และแรงจูงใจของผู้เรียนได้อย่างเหมาะสม
          และควรนำไปใช้ต่อยอดในชั้นเรียนอื่นหรือเนื้อหาที่ใกล้เคียงกันเพื่อสร้างความต่อเนื่องของการเรียนรู้
        </Paragraph>

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>เอกสารอ้างอิง</Text>
        <BulletList items={data.references} />
      </Page>
    </Document>
  );
}

export async function downloadClassroomResearchPdf(input: ClassroomResearchDocInput) {
  const blob = await pdf(<ResearchReportPdfDocument input={input} />).toBlob();
  const filename = `research-report-${(input.title || input.gameTitle).replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80) || 'classroom-research'}.pdf`;
  downloadBlob(blob, filename);
}
