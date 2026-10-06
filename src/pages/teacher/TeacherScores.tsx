import { useState } from 'react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { ScoresManagement } from '@/components/admin/scores/ScoresManagement';
import { PaporGenerator } from '@/components/admin/papor/PaporGenerator';
import { TEACHER_MENU } from './TeacherDashboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PenLine, FileText } from 'lucide-react';

export default function TeacherScores() {
    const [tab, setTab] = useState<'daily' | 'papor'>('papor');

    return (
        <RolePortalLayout title="Portal ครู" subtitle="ครู/บุคลากร" menu={TEACHER_MENU} accent="teacher">
            <div className="space-y-4">
                <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="papor" className="gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            ระบบ ปพ.5 / ปพ.6 สพฐ.
                        </TabsTrigger>
                        <TabsTrigger value="daily" className="gap-2">
                            <PenLine className="w-4 h-4" />
                            ระบบคะแนนเก็บย่อย
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="papor" className="pt-2">
                        <PaporGenerator />
                    </TabsContent>
                    <TabsContent value="daily" className="pt-2">
                        <ScoresManagement />
                    </TabsContent>
                </Tabs>
            </div>
        </RolePortalLayout>
    );
}
