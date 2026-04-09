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
import { DocumentsManagement } from '@/components/admin/documents/DocumentsManagement';
import { WasteBankManagement } from '@/components/admin/waste-bank/WasteBankManagement';
import { AttendanceManagement } from '@/components/admin/attendance/AttendanceManagement';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Newspaper, Image, Calendar, Users, UserCog, Briefcase, FileText, GraduationCap, HardDrive, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Supabase Free Plan limits
const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
const DB_LIMIT_BYTES = 500 * 1024 * 1024;            // 500 MB

interface BucketUsage {
  bucket_id: string;
  file_count: number;
  total_bytes: number;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

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
  const [bucketUsage, setBucketUsage] = useState<BucketUsage[]>([]);
  const [dbSize, setDbSize] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data?.session) navigate('/admin');
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/admin');
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchStats();
    fetchStorageUsage();
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

  const fetchStorageUsage = async () => {
    try {
      const [storageRes, dbRes] = await Promise.all([
        supabase.rpc('get_storage_usage' as any),
        supabase.rpc('get_db_size' as any),
      ]);
      if (storageRes.data) setBucketUsage(storageRes.data as BucketUsage[]);
      if (dbRes.data) setDbSize(Number(dbRes.data));
    } catch {
      // silently fail — widget จะซ่อน
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

      case 'documents':
        return <DocumentsManagement />;

      case 'waste-bank':
        return <WasteBankManagement />;

      case 'attendance':
        return <AttendanceManagement />;

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
            <Card className="mb-6">
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

            {/* Storage & Database Usage */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Storage */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Storage (ที่เก็บไฟล์)</h3>
                      <p className="text-xs text-muted-foreground">Supabase Free Plan — ขีดจำกัด 1 GB</p>
                    </div>
                  </div>

                  {/* Total progress bar */}
                  {(() => {
                    const totalUsed = bucketUsage.reduce((s, b) => s + b.total_bytes, 0);
                    const pct = Math.min(100, (totalUsed / STORAGE_LIMIT_BYTES) * 100);
                    const color = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-blue-500';
                    return (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground font-medium">ใช้ไป: {formatBytes(totalUsed)}</span>
                          <span className="text-muted-foreground">เหลือ: {formatBytes(STORAGE_LIMIT_BYTES - totalUsed)}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all ${color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">{pct.toFixed(2)}% จาก 1 GB</p>
                      </div>
                    );
                  })()}

                  {/* Per bucket */}
                  {bucketUsage.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">แยกตาม Bucket</p>
                      {bucketUsage.map((b) => {
                        const pct = Math.min(100, (b.total_bytes / STORAGE_LIMIT_BYTES) * 100);
                        return (
                          <div key={b.bucket_id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                              <span className="text-foreground font-mono text-xs">{b.bucket_id}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-foreground">{formatBytes(b.total_bytes)}</span>
                              <span className="text-muted-foreground text-xs ml-2">({b.file_count} ไฟล์)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {bucketUsage.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">ยังไม่มีไฟล์ใน Storage</p>
                  )}
                </CardContent>
              </Card>

              {/* Database */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Database className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Database (ฐานข้อมูล)</h3>
                      <p className="text-xs text-muted-foreground">Supabase Free Plan — ขีดจำกัด 500 MB</p>
                    </div>
                  </div>

                  {dbSize > 0 ? (() => {
                    const pct = Math.min(100, (dbSize / DB_LIMIT_BYTES) * 100);
                    const color = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-green-500';
                    return (
                      <>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground font-medium">ใช้ไป: {formatBytes(dbSize)}</span>
                            <span className="text-muted-foreground">เหลือ: {formatBytes(DB_LIMIT_BYTES - dbSize)}</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full transition-all ${color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 text-right">{pct.toFixed(2)}% จาก 500 MB</p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
                          <p>💡 ขนาดฐานข้อมูลรวม overhead ของ PostgreSQL ซึ่งเป็นเรื่องปกติ</p>
                        </div>
                      </>
                    );
                  })() : (
                    <p className="text-sm text-muted-foreground text-center py-4">กำลังโหลดข้อมูล...</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      🔗 ดูรายละเอียดเพิ่มเติมได้ที่{' '}
                      <a
                        href="https://supabase.com/dashboard/project/lkpqssbqxxpasidfqhpb/settings/storage"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Supabase Dashboard
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
