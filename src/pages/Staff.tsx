import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Mail, Phone } from 'lucide-react';

interface Administrator {
  id: string;
  name: string;
  position: string;
  education: string | null;
  quote: string | null;
  photo_url: string | null;
  order_position: number;
}

interface StaffMember {
  id: string;
  name: string;
  position: string;
  department: string | null;
  subject: string | null;
  education: string | null;
  experience: string | null;
  photo_url: string | null;
  staff_type: string;
  order_position: number;
}

const colorPalette = [
  'from-primary to-blue-600',
  'from-accent to-yellow-500',
  'from-green-500 to-green-400',
  'from-purple-500 to-purple-400',
  'from-blue-500 to-blue-400',
  'from-orange-500 to-orange-400',
  'from-teal-500 to-teal-400',
  'from-red-500 to-red-400',
  'from-indigo-500 to-indigo-400',
  'from-amber-500 to-amber-400',
];

// Mapping จำนวนคอลัมน์ → Tailwind class
const colsClass: Record<string, string> = {
  '1': 'grid-cols-1 max-w-sm mx-auto',
  '2': 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  '5': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

const Staff = () => {
  const { settings } = useSchoolSettings();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [teachingStaff, setTeachingStaff] = useState<StaffMember[]>([]);
  const [supportStaff, setSupportStaff] = useState<StaffMember[]>([]);
  const [adminCols, setAdminCols] = useState('1');
  const [teachingCols, setTeachingCols] = useState('4');
  const [supportCols, setSupportCols] = useState('4');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [adminsRes, staffRes, settingsRes] = await Promise.all([
        supabase.from('administrators').select('*').order('order_position'),
        supabase.from('staff').select('*').order('order_position'),
        supabase.from('school_settings')
          .select('key, value')
          .in('key', ['staff_admin_columns', 'staff_teaching_columns', 'staff_support_columns']),
      ]);

      if (adminsRes.data) setAdministrators(adminsRes.data);
      if (staffRes.data) {
        setTeachingStaff(staffRes.data.filter(s => s.staff_type === 'teaching'));
        setSupportStaff(staffRes.data.filter(s => s.staff_type === 'support'));
      }
      if (settingsRes.data) {
        settingsRes.data.forEach((s: any) => {
          if (s.key === 'staff_admin_columns') setAdminCols(s.value || '1');
          if (s.key === 'staff_teaching_columns') setTeachingCols(s.value || '4');
          if (s.key === 'staff_support_columns') setSupportCols(s.value || '4');
        });
      }
    } catch (err) {
      console.error('Error fetching personnel:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center max-w-3xl mx-auto">
            <span className="inline-block text-accent font-semibold mb-4">บุคลากร</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              คณะผู้บริหารและบุคลากร
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              ทีมผู้บริหาร ครู และบุคลากรที่มีความเชี่ยวชาญและทุ่มเทพัฒนาการศึกษา
            </p>
          </div>
        </section>

        {loading ? (
          <div className="py-24 text-center text-muted-foreground">กำลังโหลด...</div>
        ) : (
          <>
            {/* ─── ผู้บริหาร ─── */}
            {administrators.length > 0 && (
              <section className="py-16 md:py-24 bg-secondary/30">
                <div className="container mx-auto px-4">
                  <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-block text-accent font-semibold mb-4">ผู้บริหาร</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                      คณะผู้บริหารโรงเรียน
                    </h2>
                    <p className="text-muted-foreground">
                      ทีมผู้บริหารที่มีวิสัยทัศน์และความมุ่งมั่นในการพัฒนาการศึกษา
                    </p>
                  </div>
                  <div className={`grid gap-6 ${colsClass[adminCols] ?? colsClass['1']}`}>
                    {administrators.map((admin, index) => (
                      <div
                        key={admin.id}
                        className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border"
                      >
                        <div className={`h-48 bg-gradient-to-br ${colorPalette[index % colorPalette.length]} relative flex items-center justify-center`}>
                          {admin.photo_url ? (
                            <img
                              src={admin.photo_url}
                              alt={admin.name}
                              className="w-28 h-28 rounded-full object-cover border-4 border-card/50"
                            />
                          ) : (
                            <div className="w-28 h-28 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center border-4 border-card/50">
                              <span className="text-4xl font-bold text-card">{admin.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-6 text-center">
                          <h3 className="text-lg font-bold text-foreground mb-1">{admin.name}</h3>
                          <p className="text-accent font-medium mb-2">{admin.position}</p>
                          {admin.education && (
                            <p className="text-sm text-muted-foreground mb-4">{admin.education}</p>
                          )}
                          {admin.quote && (
                            <blockquote className="text-sm text-muted-foreground italic border-l-2 border-accent pl-3 text-left">
                              "{admin.quote}"
                            </blockquote>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ─── ครูผู้สอน ─── */}
            {teachingStaff.length > 0 && (
              <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                  <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-block text-accent font-semibold mb-4">ครูผู้สอน</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                      คณะครูผู้สอน
                    </h2>
                    <p className="text-muted-foreground">
                      ครูผู้เชี่ยวชาญในแต่ละสาขาวิชา พร้อมถ่ายทอดความรู้อย่างมีคุณภาพ
                    </p>
                  </div>
                  <div className={`grid gap-6 ${colsClass[teachingCols] ?? colsClass['4']}`}>
                    {teachingStaff.map((teacher, index) => (
                      <div
                        key={teacher.id}
                        className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border"
                      >
                        <div className={`h-32 bg-gradient-to-br ${colorPalette[index % colorPalette.length]} relative flex items-center justify-center`}>
                          {teacher.photo_url ? (
                            <img
                              src={teacher.photo_url}
                              alt={teacher.name}
                              className="w-20 h-20 rounded-full object-cover border-4 border-card/50"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center border-4 border-card/50">
                              <span className="text-3xl font-bold text-card">{teacher.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-5 text-center">
                          <h3 className="text-lg font-bold text-foreground mb-1">{teacher.name}</h3>
                          <p className="text-accent font-medium text-sm mb-2">{teacher.position}</p>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {teacher.subject && <p>วิชา: {teacher.subject}</p>}
                            {teacher.education && <p>{teacher.education}</p>}
                            {teacher.experience && <p>ประสบการณ์: {teacher.experience}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ─── บุคลากรสนับสนุน ─── */}
            {supportStaff.length > 0 && (
              <section className="py-16 bg-secondary/30">
                <div className="container mx-auto px-4">
                  <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-block text-accent font-semibold mb-4">บุคลากรสนับสนุน</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                      บุคลากรทางการศึกษา
                    </h2>
                    <p className="text-muted-foreground">
                      ทีมงานสนับสนุนที่ช่วยให้การดำเนินงานของโรงเรียนเป็นไปอย่างราบรื่น
                    </p>
                  </div>
                  <div className={`grid gap-6 ${colsClass[supportCols] ?? colsClass['4']}`}>
                    {supportStaff.map((staff, index) => (
                      <div
                        key={staff.id}
                        className="bg-card rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border text-center"
                      >
                        {staff.photo_url ? (
                          <img
                            src={staff.photo_url}
                            alt={staff.name}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-2 border-border"
                          />
                        ) : (
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorPalette[index % colorPalette.length]} flex items-center justify-center mx-auto mb-4`}>
                            <span className="text-2xl font-bold text-white">{staff.name.charAt(0)}</span>
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-foreground mb-1">{staff.name}</h3>
                        <p className="text-accent font-medium text-sm mb-2">{staff.position}</p>
                        {staff.department && <p className="text-sm text-muted-foreground mb-1">{staff.department}</p>}
                        {staff.experience && <p className="text-sm text-muted-foreground">ประสบการณ์: {staff.experience}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Contact */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-primary-foreground mb-2">ติดต่อโรงเรียน</h3>
                  <p className="text-primary-foreground/80">สอบถามข้อมูลเพิ่มเติมเกี่ยวกับบุคลากร</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={`tel:${settings.contact_phone}`}
                    className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    {settings.contact_phone}
                  </a>
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="inline-flex items-center gap-3 bg-primary-foreground/10 text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary-foreground/20 transition-colors border border-primary-foreground/20"
                  >
                    <Mail className="w-5 h-5" />
                    อีเมล
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Staff;
