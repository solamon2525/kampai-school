import { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Target, Eye, Heart, Star, Users, Award, BookOpen, GraduationCap, Building2, History, LucideIcon, Dumbbell, Monitor, FlaskConical } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import type { SchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';

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
      <SiteHeader />
      <main>
        {/* Hero Section */}
        <section className="bg-primary py-20">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block text-accent font-semibold mb-4">เกี่ยวกับเรา</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              {settings.school_name}
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto">
              {settings.school_description}
            </p>
          </div>
        </section>

        {/* Vision Mission Section */}
        <section className="section-padding bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cardConfigs.map((c) => {
                const img = settings[`${c.key}_image_url` as keyof SchoolSettings] as string;
                const align = (settings[`${c.key}_text_align` as keyof SchoolSettings] as string) || 'left';
                const bg = (settings[`${c.key}_bg_color` as keyof SchoolSettings] as string) || '';
                const alignClass = alignMap[align] || 'text-left';
                return (
                  <div
                    key={c.key}
                    style={bg ? { backgroundColor: bg } : {}}
                    className={`group ${!bg ? 'bg-card' : ''} rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border`}
                  >
                    {img ? (
                      <img src={img} alt={c.title} className="w-14 h-14 rounded-xl object-cover mb-6" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                        <c.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                    )}
                    <h3 className={`text-xl font-bold text-foreground mb-3 ${alignClass}`}>{c.title}</h3>
                    <p className={`text-muted-foreground leading-relaxed ${alignClass}`}>{c.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: History, value: settings.about_stat_1, label: settings.about_stat_1_label },
                { icon: Users, value: settings.about_stat_2, label: settings.about_stat_2_label },
                { icon: GraduationCap, value: settings.about_stat_3, label: settings.about_stat_3_label },
                { icon: Award, value: settings.about_stat_4, label: settings.about_stat_4_label },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-10 h-10 text-accent mx-auto mb-4" />
                  <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-accent mb-2">{stat.value}</div>
                  <div className="text-primary-foreground/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* History Timeline */}
        <section className="section-padding bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block text-accent font-semibold mb-4">ประวัติความเป็นมา</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                เส้นทางแห่งความสำเร็จ
              </h2>
            </div>

            <div className="max-w-3xl mx-auto">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6 mb-8 last:mb-0">
                  <div className="flex-shrink-0 w-24 text-right">
                    <span className="text-2xl font-bold text-primary">{milestone.year}</span>
                  </div>
                  <div className="relative">
                    <div className="w-4 h-4 rounded-full bg-accent border-4 border-background" />
                    {index < milestones.length - 1 && (
                      <div className="absolute top-4 left-1.5 w-1 h-full bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="bg-card rounded-xl p-6 shadow-md border border-border">
                      <p className="text-foreground">{milestone.event}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section className="section-padding bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block text-accent font-semibold mb-4">สิ่งอำนวยความสะดวก</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                สถานที่และอุปกรณ์
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {facilities.map((facility) => {
                const IconComponent = iconMap[facility.icon] || Building2;
                return (
                  <div key={facility.id} className="bg-card rounded-2xl p-8 shadow-md border border-border text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{facility.title}</h3>
                    <p className="text-muted-foreground">{facility.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
