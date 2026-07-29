/**
 * Public privacy / PDPA summary — linked from footer (trust polish).
 * Full consent self-serve remains at /parent/privacy for logged-in parents.
 */
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="นโยบายความเป็นส่วนตัว (PDPA)"
        description="โรงเรียนคำไผ่เก็บและใช้ข้อมูลส่วนบุคคลอย่างไร ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล"
      />
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">นโยบายความเป็นส่วนตัว (PDPA)</h1>
            <p className="text-sm text-muted-foreground mt-1">
              โรงเรียนบ้านคำไผ่เก็บข้อมูลเพื่อการเรียนการสอน การติดต่อผู้ปกครอง และรายงานตามกฎหมายเท่านั้น
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4 text-sm text-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-semibold">ข้อมูลที่เก็บ</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>ข้อมูลนักเรียน (ชื่อ ชั้น รหัส) และผลการเรียน/การมาเรียน ที่จำเป็นต่องานวิชาการ</li>
                <li>ข้อมูลผู้ปกครองที่เชื่อมบัญชีพอร์ทัล เพื่อแจ้งเตือนและมอบหมายงานบ้าน</li>
                <li>บันทึกการใช้งานเกม/สื่อการศึกษาเพื่อสนับสนุนการเรียน (คะแนน · ความก้าวหน้า)</li>
              </ul>
            </section>
            <section className="space-y-2">
              <h2 className="font-semibold">สิทธิของเจ้าของข้อมูล</h2>
              <p className="text-muted-foreground">
                ผู้ปกครองสามารถดูสถานะความยินยอมและจัดการสิทธิ์ของตนเองได้ในพอร์ทัลผู้ปกครอง
                หากต้องการแก้ไข/ลบข้อมูลที่เกี่ยวข้อง โปรดติดต่อโรงเรียนผ่านหน้าติดต่อเรา
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="font-semibold">การเปิดเผย</h2>
              <p className="text-muted-foreground">
                ไม่ขายข้อมูลส่วนบุคคล ใช้ภายในระบบโรงเรียนและหน่วยงานที่เกี่ยวข้องตามกฎหมาย
                (เช่น งานส่งออกข้อมูลการศึกษาเมื่อได้รับอำนาจ)
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/parent/privacy">จัดการความยินยอมในพอร์ทัลผู้ปกครอง</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/contact">ติดต่อโรงเรียน</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
