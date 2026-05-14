import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookOpen, CalendarDays, Package, Users, MessageSquare, Eye, LayoutGrid } from 'lucide-react';
import { ClassScheduleManagement } from './ClassScheduleManagement';
import { LessonPlanManagement } from './LessonPlanManagement';
import { TeachingMaterialsManagement } from './TeachingMaterialsManagement';
import { AcademicCalendarManagement } from './AcademicCalendarManagement';
import { SpecialNeedsManagement } from './SpecialNeedsManagement';
import { CounselingManagement } from './CounselingManagement';
import { SupervisionManagement } from './SupervisionManagement';

const TABS = [
  { value: 'schedule',   label: 'ตารางสอน',       icon: LayoutGrid },
  { value: 'lesson',     label: 'แผนการสอน',      icon: BookOpen },
  { value: 'materials',  label: 'สื่อการสอน',     icon: Package },
  { value: 'calendar',   label: 'ปฏิทินวิชาการ',  icon: CalendarDays },
  { value: 'special',    label: 'นักเรียนพิเศษ',  icon: Users },
  { value: 'counseling', label: 'แนะแนว',          icon: MessageSquare },
  { value: 'supervision',label: 'นิเทศ',           icon: Eye },
];

export const AcademicManagement = () => {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-2 border-b">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-slate-700" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">ฝ่ายวิชาการ</h1>
          <p className="text-xs text-muted-foreground">จัดการตารางสอน แผนการสอน สื่อ ปฏิทิน และการติดตามนักเรียน</p>
        </div>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="schedule" className="mt-4">
          <ClassScheduleManagement />
        </TabsContent>
        <TabsContent value="lesson" className="mt-4">
          <LessonPlanManagement />
        </TabsContent>
        <TabsContent value="materials" className="mt-4">
          <TeachingMaterialsManagement />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <AcademicCalendarManagement />
        </TabsContent>
        <TabsContent value="special" className="mt-4">
          <SpecialNeedsManagement />
        </TabsContent>
        <TabsContent value="counseling" className="mt-4">
          <CounselingManagement />
        </TabsContent>
        <TabsContent value="supervision" className="mt-4">
          <SupervisionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcademicManagement;
