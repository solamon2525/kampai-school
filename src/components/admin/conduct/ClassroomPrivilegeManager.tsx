import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conductService, type ClassroomPrivilege, type PrivilegeRedemption } from '@/services/conduct.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import { TableSkeleton } from '@/components/ui/loading-skeletons';
import {
  Ticket,
  Plus,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  Clock,
  PackageOpen,
  XCircle,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CLASS_OPTIONS = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

export const ClassroomPrivilegeManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedClass, setSelectedClass] = useState<string>('ป.4');
  const [selectedRoom, setSelectedRoom] = useState<string>('1');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingPrivilege, setEditingPrivilege] = useState<ClassroomPrivilege | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formIcon, setFormIcon] = useState<string>('🎟️');
  const [formCost, setFormCost] = useState<number>(10);
  const [formStock, setFormStock] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Fetch Privileges
  const {
    data: privileges = [],
    isLoading: loadingPrivileges,
    refetch: refetchPrivileges,
  } = useQuery({
    queryKey: ['classroom-privileges', selectedClass, selectedRoom],
    queryFn: () => conductService.getPrivilegesByClass(selectedClass, selectedRoom),
  });

  // Fetch Redemptions
  const {
    data: redemptions = [],
    isLoading: loadingRedemptions,
    refetch: refetchRedemptions,
  } = useQuery({
    queryKey: ['privilege-redemptions', selectedClass, selectedRoom],
    queryFn: () => conductService.getRedemptionsByClass(selectedClass, selectedRoom),
  });

  // Seed Presets Mutation
  const seedMutation = useMutation({
    mutationFn: () => conductService.seedDefaultPrivileges(selectedClass, selectedRoom),
    onSuccess: () => {
      toast({
        title: 'เพิ่มชุดคูปองแนะนำสำเร็จ ✨',
        description: `เพิ่มชุดคูปองมาตรฐาน 6 รายการให้กับชั้น ${selectedClass}/${selectedRoom} เรียบร้อยแล้ว`,
      });
      queryClient.invalidateQueries({ queryKey: ['classroom-privileges'] });
    },
    onError: (err: any) => {
      toast({
        title: 'ไม่สามารถเพิ่มชุดคูปองได้',
        description: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        variant: 'destructive',
      });
    },
  });

  // Upsert Mutation
  const upsertMutation = useMutation({
    mutationFn: async () => {
      const stockVal = formStock.trim() === '' ? null : parseInt(formStock, 10);
      if (editingPrivilege) {
        return conductService.updatePrivilege(editingPrivilege.id, {
          title: formTitle,
          description: formDescription,
          icon: formIcon || '🎟️',
          virtue_points_cost: formCost,
          stock: isNaN(stockVal as number) ? null : stockVal,
          is_active: formIsActive,
        });
      } else {
        return conductService.createPrivilege({
          class: selectedClass,
          room: selectedRoom,
          title: formTitle,
          description: formDescription,
          icon: formIcon || '🎟️',
          virtue_points_cost: formCost,
          stock: isNaN(stockVal as number) ? null : stockVal,
          is_active: formIsActive,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: editingPrivilege ? 'แก้ไขคูปองสำเร็จ' : 'สร้างคูปองสำเร็จ ✨',
        description: `บันทึกรายการ "${formTitle}" เรียบร้อยแล้ว`,
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['classroom-privileges'] });
    },
    onError: (err: any) => {
      toast({
        title: 'ไม่สามารถบันทึกข้อมูลได้',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => conductService.deletePrivilege(id),
    onSuccess: () => {
      toast({ title: 'ลบคูปองเรียบร้อยแล้ว' });
      queryClient.invalidateQueries({ queryKey: ['classroom-privileges'] });
    },
  });

  // Mark Used Mutation
  const markUsedMutation = useMutation({
    mutationFn: (redemptionId: string) => conductService.markPrivilegeUsed(redemptionId),
    onSuccess: () => {
      toast({
        title: 'ยืนยันการใช้สิทธิ์สำเร็จ ✅',
        description: 'นักเรียนใช้สิทธิ์คูปองเรียบร้อยแล้ว',
      });
      queryClient.invalidateQueries({ queryKey: ['privilege-redemptions'] });
    },
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: (redemptionId: string) => conductService.cancelPrivilegeRedemption(redemptionId),
    onSuccess: () => {
      toast({
        title: 'ยกเลิกการใช้สิทธิ์แล้ว',
      });
      queryClient.invalidateQueries({ queryKey: ['privilege-redemptions'] });
    },
  });

  const openCreateDialog = () => {
    setEditingPrivilege(null);
    setFormTitle('');
    setFormDescription('');
    setFormIcon('🎟️');
    setFormCost(10);
    setFormStock('');
    setFormIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (item: ClassroomPrivilege) => {
    setEditingPrivilege(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormIcon(item.icon || '🎟️');
    setFormCost(item.virtue_points_cost);
    setFormStock(item.stock !== null && item.stock !== undefined ? String(item.stock) : '');
    setFormIsActive(item.is_active);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Filters & Actions ── */}
      <Card className="border border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">ชั้นเรียน</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-28 h-9 text-xs bg-background">
                    <SelectValue placeholder="เลือกชั้น" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">ห้อง</Label>
                <Input
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  placeholder="เช่น 1"
                  className="w-20 h-9 text-xs bg-background"
                />
              </div>

              <div className="pt-5">
                <Badge variant="outline" className="text-xs py-1 px-2.5 bg-muted text-foreground border-border">
                  ห้อง {selectedClass}/{selectedRoom || 'ทั้งหมด'}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="text-xs font-bold border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                เพิ่มชุดคูปองแนะนำ (6 รายการ)
              </Button>

              <Button
                size="sm"
                onClick={openCreateDialog}
                className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                สร้างคูปองใหม่
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Privilege Cards Grid ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            คูปองสิทธิ์พิเศษในห้องเรียน ({privileges.length} รายการ)
          </h3>
          <span className="text-xs text-muted-foreground font-medium">
            คูปองกิจกรรมสร้างแรงจูงใจโดยไม่ต้องใช้งบประมาณ
          </span>
        </div>

        {loadingPrivileges ? (
          <TableSkeleton rows={4} cols={3} />
        ) : privileges.length === 0 ? (
          <Card className="border-dashed border-2 border-border p-8 text-center bg-card rounded-2xl">
            <PackageOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h4 className="text-sm font-bold text-foreground mb-1">ยังไม่มีคูปองสิทธิ์พิเศษในห้องนี้</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              คุณครูสามารถกดปุ่ม "เพิ่มชุดคูปองแนะนำ" เพื่อเริ่มต้นใช้งานคูปองสิทธิพิเศษ 6 รายการได้ทันที
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedMutation.mutate()}
              className="text-xs font-bold border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              เพิ่มชุดคูปองแนะนำทันที
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {privileges.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'border transition-shadow hover:shadow-md relative overflow-hidden bg-card',
                  item.is_active ? 'border-border' : 'border-border opacity-60 bg-muted/30'
                )}
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-primary to-amber-400" />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-muted/60 border border-border flex items-center justify-center">
                        {item.icon || '🎟️'}
                      </span>
                      <div>
                        <CardTitle className="text-sm font-extrabold text-foreground line-clamp-1">
                          {item.title}
                        </CardTitle>
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1">
                          <Coins className="w-3 h-3 text-amber-500" />
                          ใช้ {item.virtue_points_cost} คะแนนความดี
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`คุณต้องการลบคูปอง "${item.title}" หรือไม่?`)) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2 min-h-[32px]">
                    {item.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border text-[11px]">
                    <span className="text-muted-foreground">
                      สต็อก: {item.stock !== null ? `${item.stock} สิทธิ์` : 'ไม่จำกัด'}
                    </span>
                    <Badge
                      variant={item.is_active ? 'default' : 'secondary'}
                      className={cn(
                        'text-[10px] px-2 py-0.5 font-bold',
                        item.is_active ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {item.is_active ? 'เปิดให้แลก' : 'ปิดใช้งาน'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Active Redemptions & Fulfillment Section ── */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            ประวัติการแลกและใช้สิทธิ์คูปอง ({redemptions.length} รายการ)
          </h3>
          <span className="text-xs text-muted-foreground">
            เมื่อนักเรียนมาขอใช้สิทธิ์ ให้กดปุ่ม "ยืนยันการใช้สิทธิ์"
          </span>
        </div>

        {loadingRedemptions ? (
          <TableSkeleton rows={4} cols={4} />
        ) : redemptions.length === 0 ? (
          <Card className="border border-border p-6 text-center bg-card rounded-xl">
            <p className="text-xs text-muted-foreground">ยังไม่มีรายการแลกคูปองในห้องนี้</p>
          </Card>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-foreground font-bold">
                  <tr>
                    <th className="py-2.5 px-3">นักเรียน</th>
                    <th className="py-2.5 px-3">คูปองที่แลก</th>
                    <th className="py-2.5 px-3 text-center">คะแนนที่ใช้</th>
                    <th className="py-2.5 px-3">เวลาที่แลก</th>
                    <th className="py-2.5 px-3 text-center">สถานะ</th>
                    <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {redemptions.map((r) => {
                    const student = r.students;
                    const privilege = r.classroom_privileges;
                    const isActive = r.status === 'active';
                    const isUsed = r.status === 'used';

                    return (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <PersonAvatar
                              name={student?.name || 'นักเรียน'}
                              photoUrl={student?.photo_url}
                              size="sm"
                              className="w-7 h-7"
                            />
                            <div>
                              <p className="font-extrabold text-foreground">{student?.name || '-'}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {student?.class}{student?.room ? `/${student?.room}` : ''}
                                {student?.student_code ? ` (${student.student_code})` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">{privilege?.icon || '🎟️'}</span>
                            <span className="font-bold text-foreground">{privilege?.title || '-'}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center font-black text-amber-600">
                          {r.points_used} คะแนน
                        </td>

                        <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                          {new Date(r.redeemed_at).toLocaleString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {isActive ? (
                            <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-extrabold text-[10px]">
                              รอใช้สิทธิ์ 🎟️
                            </Badge>
                          ) : isUsed ? (
                            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold text-[10px]">
                              ใช้สิทธิ์แล้ว ✅
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              ยกเลิกแล้ว
                            </Badge>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          {isActive && (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                onClick={() => markUsedMutation.mutate(r.id)}
                                disabled={markUsedMutation.isPending}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันใช้สิทธิ์
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm('คุณต้องการยกเลิกการแลกคูปองนี้หรือไม่?')) {
                                    cancelMutation.mutate(r.id);
                                  }
                                }}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                          {isUsed && r.used_at && (
                            <span className="text-[10px] text-muted-foreground">
                              ใช้เมื่อ {new Date(r.used_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog for Create / Edit Privilege ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">
              {editingPrivilege ? 'แก้ไขคูปองสิทธิ์พิเศษ' : 'สร้างคูปองสิทธิ์พิเศษใหม่'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">ชื่อคูปองสิทธิ์พิเศษ *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="เช่น เลือกที่นั่งประจำสัปดาห์ 🪑"
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">ไอคอนอิโมจิ</Label>
                <Input
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="เช่น 🪑 หรือ 🎵"
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">คะแนนความดีที่ใช้ *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formCost}
                  onChange={(e) => setFormCost(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="h-9 text-xs bg-background font-bold text-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">คำอธิบายรายละเอียดสิทธิ์</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="ระบุเงื่อนไขและรายละเอียดสิทธิ์ที่นักเรียนจะได้รับ..."
                rows={2}
                className="text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">จำนวนสิทธิ์จำกัด (สต็อก)</Label>
              <Input
                type="number"
                min={1}
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                placeholder="เว้นว่างไว้หากไม่จำกัดสิทธิ์"
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <Label className="text-xs font-bold text-foreground block">เปิดให้นักเรียนแลก</Label>
                <span className="text-[10px] text-muted-foreground">แสดงในหน้าพอร์ทัลของนักเรียน</span>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={() => upsertMutation.mutate()}
              disabled={!formTitle.trim() || upsertMutation.isPending}
              className="font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              บันทึกคูปอง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
