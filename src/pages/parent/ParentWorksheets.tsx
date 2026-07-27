/**
 * ParentWorksheets.tsx — ใบงานบ้าน กรองตามชั้นลูก (Phase 15)
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ExternalLink, FileText, Loader2, Package } from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { PARENT_MENU } from '@/pages/parent/ParentDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useActiveChild } from '@/hooks/useActiveChild';
import {
    gradeFromClassLabel,
    lessonPacksService,
} from '@/services/lesson-packs.service';
import { cn } from '@/lib/utils';

export default function ParentWorksheets() {
    const { activeChild, children: kids } = useActiveChild();
    const grade = useMemo(
        () => gradeFromClassLabel(activeChild?.class ?? null),
        [activeChild?.class],
    );

    const { data: worksheets, isLoading: loadingWs } = useQuery({
        queryKey: ['parent-worksheets', grade],
        enabled: !!activeChild,
        queryFn: () => lessonPacksService.listWorksheetsForGrade(grade),
    });

    const { data: packs, isLoading: loadingPacks } = useQuery({
        queryKey: ['parent-lesson-packs', grade],
        enabled: !!activeChild,
        queryFn: () => lessonPacksService.listPublishedWithItems({ grade }),
    });

    const isLoading = loadingWs || loadingPacks;

    return (
        <RolePortalLayout title="Portal ผู้ปกครอง" subtitle="ผู้ปกครอง" menu={PARENT_MENU} accent="parent">
            <div className="p-6 lg:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">ใบงานบ้าน</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            ใบงานและชุดเรียนที่เหมาะกับชั้นของลูก — พิมพ์ A4 ได้ที่บ้าน
                        </p>
                    </div>
                    {kids.length > 0 && <ChildSwitcher />}
                </div>

                {activeChild && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-muted-foreground">กำลังดูสำหรับ</span>
                        <Badge variant="secondary">{activeChild.name}</Badge>
                        {grade ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20">{grade}</Badge>
                        ) : (
                            <Badge variant="outline">ไม่ระบุชั้นจากข้อมูลห้อง</Badge>
                        )}
                    </div>
                )}

                {!activeChild && (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-amber-600">
                                บัญชีของคุณยังไม่ได้เชื่อมกับนักเรียน กรุณาติดต่อผู้ดูแลระบบ
                            </p>
                        </CardContent>
                    </Card>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> กำลังโหลดใบงาน…
                    </div>
                )}

                {!isLoading && activeChild && (
                    <>
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-bold">ชุดเรียนแนะนำ</h2>
                                <span className="text-xs text-muted-foreground">
                                    {packs?.length ?? 0} ชุด
                                </span>
                            </div>
                            {(packs?.length ?? 0) === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">
                                    ยังไม่มีชุดเรียนสำหรับชั้นนี้
                                </p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {packs!.map((pack) => {
                                        const media = pack.items?.find((i) => i.role === 'media');
                                        const ws = pack.items?.find((i) => i.role === 'worksheet');
                                        return (
                                            <Card key={pack.id} className="overflow-hidden">
                                                <CardContent className="p-0">
                                                    {pack.thumbnail_url ? (
                                                        <img
                                                            src={pack.thumbnail_url}
                                                            alt=""
                                                            className="aspect-video w-full object-cover bg-muted"
                                                        />
                                                    ) : (
                                                        <div className="flex aspect-video items-center justify-center bg-muted">
                                                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="space-y-2 p-3">
                                                        <p className="font-semibold line-clamp-2">{pack.title}</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {pack.subject && (
                                                                <Badge variant="outline" className="text-[10px]">{pack.subject}</Badge>
                                                            )}
                                                            {pack.grade_levels?.slice(0, 3).map((g) => (
                                                                <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>
                                                            ))}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {media?.item?.external_url && (
                                                                <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                                                                    <a href={media.item.external_url} target="_blank" rel="noopener noreferrer">
                                                                        <BookOpen className="mr-1 h-3.5 w-3.5" />
                                                                        เปิดสื่อ
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            {ws?.item?.external_url && (
                                                                <Button size="sm" className="h-8 text-xs" asChild>
                                                                    <a href={ws.item.external_url} target="_blank" rel="noopener noreferrer">
                                                                        <FileText className="mr-1 h-3.5 w-3.5" />
                                                                        เปิดใบงาน
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-bold">ใบงานทั้งหมด{grade ? ` · ${grade}` : ''}</h2>
                                <span className="text-xs text-muted-foreground">
                                    {worksheets?.length ?? 0} ใบ
                                </span>
                            </div>
                            {(worksheets?.length ?? 0) === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">
                                    ยังไม่มีใบงานสำหรับชั้นนี้ — ลองดูคลังใบงานสาธารณะ
                                </p>
                            ) : (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {worksheets!.map((ws) => (
                                        <a
                                            key={ws.id}
                                            href={ws.external_url ?? '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                'flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all',
                                                'hover:-translate-y-0.5 hover:shadow-md',
                                                !ws.external_url && 'pointer-events-none opacity-60',
                                            )}
                                        >
                                            {ws.thumbnail_url ? (
                                                <img src={ws.thumbnail_url} alt="" className="h-14 w-24 rounded-md object-cover bg-muted shrink-0" />
                                            ) : (
                                                <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-md bg-muted">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold line-clamp-2">{ws.title}</p>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {ws.subject && (
                                                        <Badge variant="outline" className="text-[10px]">{ws.subject}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        </a>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                ดูคลังเต็มได้ที่{' '}
                                <a href="/educational-hub?cat=worksheets" className="text-primary underline-offset-2 hover:underline">
                                    /educational-hub?cat=worksheets
                                </a>
                            </p>
                        </section>
                    </>
                )}
            </div>
        </RolePortalLayout>
    );
}
