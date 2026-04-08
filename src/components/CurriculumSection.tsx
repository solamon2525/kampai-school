import { useState, useEffect } from 'react';
import { BookOpen, FlaskConical, Languages, Calculator, Palette, Music, Monitor, Dumbbell, GraduationCap, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface CurriculumProgram {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  is_active: boolean;
}

interface Activity {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  FlaskConical,
  Languages,
  Calculator,
  Monitor,
  BookOpen,
  Palette,
  Music,
  Dumbbell,
  GraduationCap,
};

const CurriculumSection = () => {
  const { settings } = useSchoolSettings();
  const [programs, setPrograms] = useState<CurriculumProgram[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [programsRes, activitiesRes] = await Promise.all([
        supabase
          .from('curriculum_programs')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true }),
        supabase
          .from('curriculum_activities')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true })
      ]);

      if (programsRes.error) throw programsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;

      setPrograms(programsRes.data || []);
      setActivities(activitiesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || BookOpen;
  };

  return (
    <section id="curriculum" className="section-padding bg-secondary/30">
      <div className="container-school">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-accent font-semibold mb-4">หลักสูตรการศึกษา</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            <span className="text-primary">{settings.curriculum_title_1}</span>{settings.curriculum_title_2}
          </h2>
          <p className="text-muted-foreground text-lg">
            {settings.curriculum_description}
          </p>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </div>
        ) : programs.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {programs.map((program) => {
              const IconComponent = getIconComponent(program.icon);
              return (
                <div
                  key={program.id}
                  className="group bg-card rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-border overflow-hidden relative"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${program.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl ${program.color} flex items-center justify-center mb-6`}>
                      <IconComponent className="w-7 h-7 text-card" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">{program.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{program.description}</p>
                    <Link to={`/curriculum#${program.id}`}>
                      <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 p-0 h-auto font-semibold">
                        ดูรายละเอียด →
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 mb-16">
            <p className="text-muted-foreground">ยังไม่มีข้อมูลหลักสูตร</p>
          </div>
        )}

        {/* Activities */}
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-lg border border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">กิจกรรมเสริมหลักสูตร</h3>
              <p className="text-muted-foreground">พัฒนาทักษะรอบด้านนอกเหนือจากวิชาการ</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {activities.map((activity) => {
                const IconComponent = getIconComponent(activity.icon);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 bg-secondary rounded-full px-5 py-3 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer group"
                  >
                    <IconComponent className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                    <span className="font-medium">{activity.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurriculumSection;
