import { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Users, GraduationCap, Trophy, BookOpen, TrendingUp, Star, LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';

interface StudentStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface GradeData {
  id: string;
  level: string;
  rooms: number;
  students: number;
  boys: number;
  girls: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  year: string;
  category: string;
}

interface Activity {
  id: string;
  name: string;
  members: number;
  description: string;
}

interface StudentCouncil {
  id: string;
  name: string;
  position: string;
  class: string | null;
  initial: string | null;
  image_url: string | null;
}

const iconMap: Record<string, LucideIcon> = {
  Users, GraduationCap, Trophy, BookOpen, TrendingUp, Star,
};

const Students = () => {
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [gradeData, setGradeData] = useState<GradeData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [studentCouncil, setStudentCouncil] = useState<StudentCouncil[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch student stats
      const { data: statsData } = await supabase
        .from('student_stats')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });
      if (statsData) setStudentStats(statsData);

      // Fetch grade data
      const { data: gradeDataResult } = await supabase
        .from('grade_data')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });
      if (gradeDataResult) setGradeData(gradeDataResult);

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('student_achievements')
        .select('*')
        .order('order_position', { ascending: true });
      if (achievementsData) setAchievements(achievementsData);

      // Fetch activities
      const { data: activitiesData } = await supabase
        .from('student_activities')
        .select('*')
        .order('order_position', { ascending: true });
      if (activitiesData) setActivities(activitiesData);

      // Fetch student council
      const { data: councilData } = await supabase
        .from('student_council')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });
      if (councilData) setStudentCouncil(councilData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use defaults if fetch fails
      setStudentStats([
        { id: '1', label: 'นักเรียนทั้งหมด', value: '1,250', icon: 'Users', color: 'text-primary' },
        { id: '2', label: 'ม.ปลาย', value: '650', icon: 'GraduationCap', color: 'text-accent' },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="นักเรียน" description="ข้อมูลนักเรียนของโรงเรียน" />
      <SiteHeader />
      <div className="max-w-7xl mx-auto w-full bg-background">
      <main>
        {/* Hero — Compact */}
        <section className="bg-primary py-6 md:py-8">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block text-xs md:text-sm font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5">
              นักเรียน
            </span>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-foreground mb-1.5">
              ข้อมูลนักเรียน
            </h1>
            <p className="text-xs md:text-sm text-primary-foreground/75 max-w-2xl mx-auto">
              ข้อมูลสถิตินักเรียน ผลงานความสำเร็จ และกิจกรรมต่างๆ ของโรงเรียน
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-4 md:py-6 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {studentStats.map((stat) => {
                const IconComponent = iconMap[stat.icon] || Users;
                return (
                  <div key={stat.id} className="bg-card rounded-xl p-4 text-center shadow-sm border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      <IconComponent className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Grade Distribution */}
        <section className="py-4 md:py-8">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-4">
              <span className="inline-block text-accent font-semibold mb-1 text-sm uppercase tracking-wider">สถิติ</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                จำนวนนักเรียนแยกตามระดับชั้น
              </h2>
              <p className="text-sm text-muted-foreground">
                ข้อมูลจำนวนนักเรียนในแต่ละระดับชั้น ปีการศึกษา 2567
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-xs sm:text-sm">ระดับชั้น</th>
                    <th className="px-2 sm:px-4 py-2 text-center font-semibold text-xs sm:text-sm">ห้อง</th>
                    <th className="px-2 sm:px-4 py-2 text-center font-semibold text-xs sm:text-sm">ชาย</th>
                    <th className="px-2 sm:px-4 py-2 text-center font-semibold text-xs sm:text-sm">หญิง</th>
                    <th className="px-2 sm:px-4 py-2 text-center font-semibold text-xs sm:text-sm">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeData.map((grade, index) => (
                    <tr key={index} className="border-t border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-3 sm:px-4 py-2 font-medium text-foreground text-xs sm:text-sm">{grade.level}</td>
                      <td className="px-2 sm:px-4 py-2 text-center text-muted-foreground text-xs sm:text-sm">{grade.rooms}</td>
                      <td className="px-2 sm:px-4 py-2 text-center text-blue-500 font-semibold text-xs sm:text-sm">{grade.boys}</td>
                      <td className="px-2 sm:px-4 py-2 text-center text-rose-500 font-semibold text-xs sm:text-sm">{grade.girls}</td>
                      <td className="px-2 sm:px-4 py-2 text-center text-primary font-bold text-xs sm:text-sm">{grade.students}</td>
                    </tr>
                  ))}
                  <tr className="bg-secondary/50 font-bold">
                    <td className="px-3 sm:px-4 py-2 text-foreground text-xs sm:text-sm">รวมทั้งหมด</td>
                    <td className="px-2 sm:px-4 py-2 text-center text-muted-foreground text-xs sm:text-sm">{gradeData.reduce((sum, g) => sum + (g.rooms || 0), 0)}</td>
                    <td className="px-2 sm:px-4 py-2 text-center text-blue-500 text-xs sm:text-sm">{gradeData.reduce((sum, g) => sum + (g.boys || 0), 0)}</td>
                    <td className="px-2 sm:px-4 py-2 text-center text-rose-500 text-xs sm:text-sm">{gradeData.reduce((sum, g) => sum + (g.girls || 0), 0)}</td>
                    <td className="px-2 sm:px-4 py-2 text-center text-primary text-xs sm:text-sm">{gradeData.reduce((sum, g) => sum + (g.students || 0), 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="py-4 md:py-6 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-4">
              <span className="inline-block text-accent font-semibold mb-1 text-sm uppercase tracking-wider">ความสำเร็จ</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                ผลงานนักเรียนดีเด่น
              </h2>
              <p className="text-sm text-muted-foreground">
                ความสำเร็จและรางวัลที่นักเรียนได้รับจากการแข่งขันต่างๆ
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                    <Trophy className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-xs text-primary font-semibold">{achievement.year}</span>
                  <h3 className="text-base font-bold text-foreground mt-0.5 mb-1">{achievement.title}</h3>
                  <p className="text-muted-foreground text-xs">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Activities */}
        <section className="py-4 md:py-8">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-4">
              <span className="inline-block text-accent font-semibold mb-1 text-sm uppercase tracking-wider">กิจกรรม</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                ชมรมและกิจกรรมนักเรียน
              </h2>
              <p className="text-sm text-muted-foreground">
                กิจกรรมหลากหลายเพื่อพัฒนาทักษะและความสามารถของนักเรียน
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-foreground">{activity.name}</h3>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                      {activity.members} คน
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Student Council */}
        <section className="py-4 md:py-6 bg-primary">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block text-accent font-semibold mb-1 text-sm uppercase tracking-wider">สภานักเรียน</span>
              <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-2">
                คณะกรรมการสภานักเรียน
              </h2>
              <p className="text-sm text-primary-foreground/80 mb-4">
                ตัวแทนนักเรียนที่ได้รับเลือกตั้งเพื่อทำหน้าที่เป็นสื่อกลางระหว่างนักเรียนและโรงเรียน
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                {studentCouncil.map((member) => (
                  <div key={member.id} className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/20">
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} className="w-12 h-12 rounded-full object-cover mx-auto mb-2" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-accent-foreground">{member.initial || member.name.charAt(0)}</span>
                      </div>
                    )}
                    <h3 className="text-base font-bold text-primary-foreground">{member.name}</h3>
                    <p className="text-sm text-accent font-semibold">{member.position}</p>
                    <p className="text-primary-foreground/70 text-xs mt-1">{member.class}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      </div>
    </div>
  );
};

export default Students;
