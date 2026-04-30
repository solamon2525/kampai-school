import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Target, Eye, Heart, Star, Users, Award, BookOpen, GraduationCap, Building2, History, LucideIcon, Dumbbell, Monitor, FlaskConical } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import type { SchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { PageBlockRenderer } from '@/components/page-builder/PageBlockRenderer';

interface Milestone {
  id: string;
  year: string;
  event: string;
}

interface Facility {
  id: string;
  title: string;
  description: string | null;
  icon: string;
}

const iconMap: Record<string, LucideIcon> = {
  Building2, BookOpen, Award, Dumbbell, Monitor, FlaskConical, GraduationCap, History, Users,
};

const About = () => {
  const { settings } = useSchoolSettings();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (milestonesData) setMilestones(milestonesData);

      // Fetch facilities
      const { data: facilitiesData } = await supabase
        .from('facilities')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (facilitiesData) setFacilities(facilitiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use defaults if fetch fails
      setMilestones([
        { id: '1', year: '2517', event: 'ก่อตั้งโรงเรียน' },
        { id: '2', year: '2530', event: 'เปิดหลักสูตรวิทย์-คณิต' },
      ]);
      setFacilities([
        { id: '1', title: 'อาคารเรียน', description: 'อาคารเรียนทันสมัย', icon: 'Building2' },
      ]);
    }
  };

  const alignMap: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  const cardConfigs = [
    { key: 'vision',     icon: Target, title: 'วิสัยทัศน์',   text: settings.school_vision },
    { key: 'mission',    icon: Eye,    title: 'พันธกิจ',       text: settings.school_mission },
    { key: 'values',     icon: Heart,  title: 'ค่านิยม',       text: settings.school_values },
    { key: 'excellence', icon: Star,   title: 'ความเป็นเลิศ',  text: settings.school_excellence },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead title="เกี่ยวกับเรา" description="ประวัติและข้อมูลโรงเรียน" />
      <SiteHeader />
      <main>
        {/* Hero — Compact */}
        <section className="bg-primary py-2 md:py-6">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block text-xs md:text-sm font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5">
              เกี่ยวกับเรา
            </span>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-foreground mb-1.5">
              {settings.school_name}
            </h1>
            <p className="text-xs md:text-sm text-primary-foreground/75 max-w-2xl mx-auto">
              {settings.school_description}
            </p>
          </div>
        </section>

        {/* Vision Mission Section */}
        <section className="py-4 md:py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {cardConfigs.map((c) => {
                const img = settings[`${c.key}_image_url` as keyof SchoolSettings] as string;
                const align = (settings[`${c.key}_text_align` as keyof SchoolSettings] as string) || 'left';
                const bg = (settings[`${c.key}_bg_color` as keyof SchoolSettings] as string) || '';
                const alignClass = alignMap[align] || 'text-left';
                return (
                  <div
                    key={c.key}
                    style={bg ? { backgroundColor: bg } : {}}
                    className={`group ${!bg ? 'bg-card' : ''} rounded-2xl p-5 md:p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border`}
                  >
                    {img ? (
                      <img src={img} alt={c.title} className="w-12 h-12 rounded-xl object-cover mb-3" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                        <c.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                    )}
                    <h3 className={`text-lg font-bold text-foreground mb-2 ${alignClass}`}>{c.title}</h3>
                    <div
                      className={`text-foreground/80 text-sm leading-relaxed ${alignClass} prose prose-sm max-w-none`}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.text || '') }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Philosophy · Motto · Identity · Colors */}
        <section className="py-3 md:py-6 bg-secondary/20 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* ปรัชญา */}
              <div className="text-center p-4 md:p-5 bg-card rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">📖</span>
                </div>
                <div className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest mb-1">ปรัชญาโรงเรียน</div>
                <p className="text-base font-bold text-foreground mb-0.5 leading-snug">
                  {settings.school_philosophy || 'นัตถิ ปัญญา สมา อาภา'}
                </p>
                <p className="text-xs text-foreground/70 italic">
                  {settings.school_philosophy_translation || 'แสงสว่างเสมอด้วยปัญญาไม่มี'}
                </p>
              </div>
              {/* คำขวัญ */}
              <div className="text-center p-4 md:p-5 bg-card rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">🎯</span>
                </div>
                <div className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest mb-1">คำขวัญโรงเรียน</div>
                <p className="text-lg md:text-xl font-bold text-foreground leading-snug">
                  {settings.school_motto || 'เรียนดี มีคุณธรรม'}
                </p>
              </div>
              {/* อัตลักษณ์ */}
              <div className="text-center p-4 md:p-5 bg-card rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">✨</span>
                </div>
                <div className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest mb-1">อัตลักษณ์โรงเรียน</div>
                <p className="text-lg md:text-xl font-bold text-foreground leading-snug">
                  {settings.school_identity || 'ยิ้มง่าย ไหว้สวย'}
                </p>
              </div>
              {/* สีประจำโรงเรียน */}
              <div className="text-center p-4 md:p-5 bg-card rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="flex justify-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-border shadow" title="สีขาว" />
                  <div className="w-8 h-8 rounded-full bg-primary shadow" title="สีเขียว" />
                </div>
                <div className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest mb-1">สีประจำโรงเรียน</div>
                <p className="text-base md:text-lg font-bold text-foreground">สีขาว และสีเขียว</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-4 md:py-6 bg-primary">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-4 gap-3 md:gap-6">
              {[
                { icon: History, value: settings.about_stat_1, label: settings.about_stat_1_label },
                { icon: Users, value: settings.about_stat_2, label: settings.about_stat_2_label },
                { icon: GraduationCap, value: settings.about_stat_3, label: settings.about_stat_3_label },
                { icon: Award, value: settings.about_stat_4, label: settings.about_stat_4_label },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-7 h-7 md:w-9 md:h-9 text-accent mx-auto mb-1.5 md:mb-2" />
                  <div className="text-xl md:text-3xl lg:text-4xl font-bold text-accent mb-0.5 md:mb-1 leading-none">{stat.value}</div>
                  <div className="text-[10px] md:text-sm text-primary-foreground/85 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GPS-Model */}
        <section className="py-4 md:py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-6 md:mb-8">
              <span className="inline-block text-primary font-semibold mb-1.5 uppercase tracking-widest text-xs md:text-sm">นวัตกรรมการบริหาร</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">GPS-Model</h2>
              <p className="text-foreground/75 text-sm md:text-base leading-relaxed">
                โมเดลที่นำทางไปสู่จุดหมายและความสำเร็จ บนพื้นฐาน Good Governance ·{' '}
                Participation Management · System Approach
              </p>
            </div>

            {/* G · P · S cards */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8">
              {[
                {
                  letter: 'G',
                  bg: 'bg-primary',
                  title: 'Good & Goal',
                  subtitle: 'ดีและมีเป้าหมาย',
                  desc: 'บริหารงานตามหลักธรรมาภิบาล (Good Governance) มุ่งเน้นผลลัพธ์ที่ดีและมีเป้าหมายที่ชัดเจนในทุกมิติของการพัฒนาโรงเรียน',
                },
                {
                  letter: 'P',
                  bg: 'bg-accent',
                  title: 'Participation & Performance',
                  subtitle: 'มีส่วนร่วมและมีผลงาน',
                  desc: 'บริหารแบบมีส่วนร่วม (Participation Management) เปิดโอกาสให้ทุกภาคส่วนมีส่วนในการพัฒนา สร้างผลงานที่วัดผลได้',
                },
                {
                  letter: 'S',
                  bg: 'bg-primary/70',
                  title: 'System & Sustain',
                  subtitle: 'เป็นระบบและยั่งยืน',
                  desc: 'ใช้วิธีการเชิงระบบ (System Approach) ในการดำเนินงาน เพื่อพัฒนาอย่างต่อเนื่องและนำไปสู่ความยั่งยืน',
                },
              ].map(({ letter, bg, title, subtitle, desc }) => (
                <div key={letter} className="bg-card rounded-2xl p-5 md:p-6 shadow-md border border-border text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${bg} text-white flex items-center justify-center text-2xl md:text-3xl font-black mx-auto mb-3 shadow-md`}>
                    {letter}
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-0.5">{title}</h3>
                  <p className="text-xs md:text-sm text-primary font-semibold mb-2">{subtitle}</p>
                  <p className="text-foreground/75 text-xs md:text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* PDCA */}
            <div className="bg-secondary/40 rounded-2xl p-5 md:p-6 border border-border">
              <div className="text-center mb-4">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary">วงจรคุณภาพ</span>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mt-0.5">PDCA Cycle</h3>
                <p className="text-foreground/75 text-xs md:text-sm mt-1 max-w-xl mx-auto">
                  ขับเคลื่อน GPS-Model ด้วยวงจรคุณภาพ PDCA เพื่อแก้ปัญหาและปรับปรุงคุณภาพการดำเนินงานอย่างต่อเนื่อง
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-2xl mx-auto">
                {[
                  { letter: 'P', label: 'Plan', desc: 'วางแผน' },
                  { letter: 'D', label: 'Do', desc: 'ปฏิบัติ' },
                  { letter: 'C', label: 'Check', desc: 'ตรวจสอบ' },
                  { letter: 'A', label: 'Act', desc: 'ปรับปรุง' },
                ].map(({ letter, label, desc }) => (
                  <div key={letter} className="text-center p-2.5 md:p-3 bg-card rounded-xl border border-border">
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-primary text-white flex items-center justify-center text-base md:text-lg font-black mx-auto mb-1 shadow-sm">
                      {letter}
                    </div>
                    <div className="text-sm md:text-base font-bold text-foreground leading-tight">{label}</div>
                    <div className="text-[10px] md:text-xs text-foreground/70">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* History Timeline */}
        <section className="py-4 md:py-8 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6 md:mb-8">
              <span className="inline-block text-primary font-semibold mb-1.5 uppercase tracking-widest text-xs md:text-sm">ประวัติความเป็นมา</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                เส้นทางแห่งความสำเร็จ
              </h2>
            </div>

            <div className="max-w-3xl mx-auto">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-3 md:gap-5 mb-3 md:mb-4 last:mb-0">
                  <div className="flex-shrink-0 w-16 md:w-20 text-right">
                    <span className="text-lg md:text-xl font-bold text-primary">{milestone.year}</span>
                  </div>
                  <div className="relative">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-accent border-[3px] border-background" />
                    {index < milestones.length - 1 && (
                      <div className="absolute top-3 md:top-4 left-1 md:left-1.5 w-0.5 md:w-1 h-full bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-3 md:pb-4">
                    <div className="bg-card rounded-xl p-3 md:p-4 shadow-sm border border-border">
                      <p className="text-foreground text-sm md:text-base">{milestone.event}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section className="py-4 md:py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6 md:mb-8">
              <span className="inline-block text-primary font-semibold mb-1.5 uppercase tracking-widest text-xs md:text-sm">สิ่งอำนวยความสะดวก</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                สถานที่และอุปกรณ์
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {facilities.map((facility) => {
                const IconComponent = iconMap[facility.icon] || Building2;
                return (
                  <div key={facility.id} className="bg-card rounded-2xl p-5 md:p-6 shadow-md border border-border text-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-1.5">{facility.title}</h3>
                    <p className="text-foreground/75 text-sm">{facility.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <PageBlockRenderer dbKey="page_layout_about" />
      <Footer />
    </div>
  );
};

export default About;
