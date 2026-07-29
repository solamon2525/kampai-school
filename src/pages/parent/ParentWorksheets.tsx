/**
 * ParentWorksheets.tsx — ใบงานบ้าน กรองตามชั้นลูก + ฝึกแล้ว + ส่งงาน/feedback (Phase 15–16)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, FileText, Loader2, Package } from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { PARENT_MENU } from '@/pages/parent/ParentDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useActiveChild } from '@/hooks/useActiveChild';
import {
    gradeFromClassLabel,
    lessonPacksService,
} from '@/services/lesson-packs.service';
import { LessonPackCard } from '@/components/educational-hub/LessonPackCard';
import { cn } from '@/lib/utils';

function practicedKey(childId: string) {
    return `kampai_pack_practiced_${childId}`;
}

function loadPracticed(childId: string): Set<string> {
    try {
        const raw = localStorage.getItem(practicedKey(childId));
        const arr = raw ? (JSON.parse(raw) as string[]) : [];
        return new Set(arr);
    } catch {
        return new Set();
    }
}

function savePracticed(childId: string, set: Set<string>) {
    localStorage.setItem(practicedKey(childId), JSON.stringify([...set]));
}

export default function ParentWorksheets() {
    const { activeChild, children: kids } = useActiveChild();
    const grade = useMemo(
        () => gradeFromClassLabel(activeChild?.class ?? null),
        [activeChild?.class],
    );

    const [practiced, setPracticed] = useState<Set<string>>(() =>
        activeChild?.id ? loadPracticed(activeChild.id) : new Set(),
    );

    // Reload when child switches
    useEffect(() => {
        if (activeChild?.id) setPracticed(loadPracticed(activeChild.id));
        else setPracticed(new Set());
    }, [activeChild?.id]);

    const togglePracticed = useCallback(
        (packId: string) => {
            if (!activeChild?.id) return;
            setPracticed((prev) => {
                const next = new Set(prev);
                if (next.has(packId)) next.delete(packId);
                else next.add(packId);
                savePracticed(activeChild.id, next);
                return next;
            });
        },
        [activeChild?.id],
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
                            ชุดเรียน: สื่อ → พิมพ์ → ส่งงาน/รับความเห็นครู — กรองตามชั้นของลูก
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
                                    {packs!.map((pack) => (
                                        <LessonPackCard
                                            key={pack.id}
                                            pack={pack}
                                            ritual
                                            childId={activeChild.id}
                                            practiced={practiced.has(pack.id)}
                                            onTogglePracticed={() => togglePracticed(pack.id)}
                                        />
                                    ))}
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
                                {' · '}
                                <a href="/parent/assignments" className="text-primary underline-offset-2 hover:underline">
                                    การบ้าน / ความเห็นครู
                                </a>
                            </p>
                        </section>
                    </>
                )}
            </div>
        </RolePortalLayout>
    );
}
