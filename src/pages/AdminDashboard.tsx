import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/shared/AdminLayout';
import { NewsManagement } from '@/components/admin/news/NewsManagement';
import { GalleryManagement } from '@/components/admin/gallery/GalleryManagement';
import { EventsManagement } from '@/components/admin/events/EventsManagement';
import { SettingsManagement } from '@/components/admin/settings/SettingsManagement';
import { AdministratorsManagement } from '@/components/admin/administrators/AdministratorsManagement';
import { StaffManagement } from '@/components/admin/staff/StaffManagement';
import { StudentsManagement } from '@/components/admin/students/StudentsManagement';
import { AdmissionsManagement } from '@/components/admin/admissions/AdmissionsManagement';
import { CurriculumManagement } from '@/components/admin/curriculum/CurriculumManagement';
import { ActivitiesManagement } from '@/components/admin/curriculum/ActivitiesManagement';
import { FaqManagement } from '@/components/admin/faq/FaqManagement';
import { MilestonesManagement } from '@/components/admin/about/MilestonesManagement';
import { FacilitiesManagement } from '@/components/admin/about/FacilitiesManagement';
import { MessagesManagement } from '@/components/admin/messages/MessagesManagement';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Newspaper, Image, Calendar, Users, UserCog, Briefcase, FileText, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [stats, setStats] = useState({
    news: 0,
    gallery: 0,
    events: 0,
    administrators: 0,
    staff: 0,
    admissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [newsRes, galleryRes, eventsRes, adminsRes, staffRes, admissionsRes] = await Promise.all([
        supabase.from('news').select('id', { count: 'exact', head: true }),
        supabase.from('gallery_albums' as any).select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('administrators').select('id', { count: 'exact', head: true }),
        supabase.from('staff').select('id', { count: 'exact', head: true }),
        supabase.from('admissions').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        news: newsRes.count || 0,
        gallery: galleryRes.count || 0,
        events: eventsRes.count || 0,
        administrators: adminsRes.count || 0,
        staff: staffRes.count || 0,
        admissions: admissionsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'news':
        return <NewsManagement />;

      case 'gallery':
        return <GalleryManagement />;

      case 'events':
        return <EventsManagement />;

      case 'administrators':
        return <AdministratorsManagement />;

      case 'staff':
        return <StaffManagement />;

      case 'students':
        return <StudentsManagement />;

      case 'admissions':
        return <AdmissionsManagement />;

      case 'curriculum':
        return <CurriculumManagement />;

      case 'activities':
        return <ActivitiesManagement />;

      case 'faq':
        return <FaqManagement />;

      case 'milestones':
        return <MilestonesManagement />;

      case 'facilities':
        return <FacilitiesManagement />;

      case 'messages':
        return <MessagesManagement />;

      case 'settings':
        return <SettingsManagement />;

      case 'dashboard':
        return (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">ยินดีต้อนรับสู่ระบบจัดการโรงเรียน</h1>
              <p className="text-muted-foreground">ภาพรวมข้อมูลทั้งหมดในระบบ</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'ข่าวสาร', value: stats.news, icon: Newspaper, color: 'bg-orange-500', tab: 'news' },
                { label: 'แกลเลอรี่', value: stats.gallery, icon: Image, color: 'bg-green-500', tab: 'gallery' },
                { label: 'กิจกรรม', value: stats.events, icon: Calendar, color: 'bg-purple-500', tab: 'events' },
                { label: 'ผู้บริหาร', value: stats.administrators, icon: UserCog, color: 'bg-blue-500', tab: 'administrators' },
                { label: 'บุคลากร', value: stats.staff, icon: Briefcase, color: 'bg-teal-500', tab: 'staff' },
                { label: 'ใบสมัคร', value: stats.admissions, icon: FileText, color: 'bg-pink-500', tab: 'admissions' },
              ].map((stat) => (
                <Card
                  key={stat.tab}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/admin/dashboard?tab=${stat.tab}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center flex-shrink-0`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {loading ? '-' : stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold mb-4">เมนูลัด</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'จัดการข่าวสาร', tab: 'news', icon: Newspaper, desc: 'เพิ่ม/แก้ไขข่าว' },
                    { label: 'จัดการแกลเลอรี่', tab: 'gallery', icon: Image, desc: 'อัพโหลดรูปภาพ' },
                    { label: 'จัดการกิจกรรม', tab: 'events', icon: Calendar, desc: 'เพิ่มกิจกรรม' },
                    { label: 'ตั้งค่าโรงเรียน', tab: 'settings', icon: Settings, desc: 'แก้ไขข้อมูลทั่วไป' },
                  ].map((item) => (
                    <button
                      key={item.tab}
                      onClick={() => navigate(`/admin/dashboard?tab=${item.tab}`)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="p-8">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Settings className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">ไม่พบหน้าที่ต้องการ</h3>
                <p className="text-muted-foreground">กรุณาเลือกเมนูด้านซ้าย</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <AdminLayout>
      {renderTabContent()}
    </AdminLayout>
  );
};

export default AdminDashboard;
