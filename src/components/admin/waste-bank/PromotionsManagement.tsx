import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Flame,
  Clock,
  Calendar,
  Gift,
  RotateCcw,
  Zap,
  Users,
} from 'lucide-react';
import {
  wastePromotionsService,
  wasteLuckySpinsService,
  type WastePromotion,
  type WasteLuckySpin,
} from '@/services/waste-bank.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { formatThaiDateFull } from '@/lib/thaiDate';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const PromotionsManagement: React.FC = () => {
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<WastePromotion[]>([]);
  const [spins, setSpins] = useState<WasteLuckySpin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'campaigns' | 'spins'>('campaigns');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<WastePromotion | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    banner_type: string;
    multiplier: string;
    bonus_points: string;
    badge_text: string;
    start_time: string;
    end_time: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  }>({
    title: '',
    description: '',
    banner_type: 'green_friday',
    multiplier: '2.0',
    bonus_points: '0',
    badge_text: '🔥 แต้ม x2',
    start_time: '',
    end_time: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [promoRes, spinsRes] = await Promise.all([
        wastePromotionsService.getAll(),
        wasteLuckySpinsService.getRecent(40),
      ]);
      if (promoRes.data) setPromotions(promoRes.data as WastePromotion[]);
      if (spinsRes.data) setSpins(spinsRes.data as WasteLuckySpin[]);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingPromo(null);
    setFormData({
      title: '',
      description: '',
      banner_type: 'green_friday',
      multiplier: '2.0',
      bonus_points: '0',
      badge_text: '🔥 แต้ม x2',
      start_time: '',
      end_time: '',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (promo: WastePromotion) => {
    setEditingPromo(promo);
    setFormData({
      title: promo.title,
      description: promo.description || '',
      banner_type: promo.banner_type,
      multiplier: String(promo.multiplier),
      bonus_points: String(promo.bonus_points),
      badge_text: promo.badge_text || '',
      start_time: promo.start_time || '',
      end_time: promo.end_time || '',
      start_date: promo.start_date || '',
      end_date: promo.end_date || '',
      is_active: promo.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const next = !current;
    const { error } = await wastePromotionsService.toggleActive(id, next);
    if (error) {
      toast({ title: 'ไม่สามารถเปลี่ยนสถานะได้', description: error.message, variant: 'destructive' });
      return;
    }
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: next } : p)));
    toast({ title: next ? 'เปิดใช้งานแคมเปญแล้ว' : 'ปิดใช้งานแคมเปญแล้ว' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบโปรโมชั่นนี้ใช่หรือไม่?')) return;
    const { error } = await wastePromotionsService.delete(id);
    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
      return;
    }
    setPromotions((prev) => prev.filter((p) => p.id !== id));
    toast({ title: 'ลบโปรโมชั่นเรียบร้อยแล้ว' });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'กรุณาระบุชื่อโปรโมชั่น', variant: 'destructive' });
      return;
    }

    const mult = parseFloat(formData.multiplier) || 1.0;
    const bonus = parseInt(formData.bonus_points, 10) || 0;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      banner_type: formData.banner_type,
      multiplier: mult,
      bonus_points: bonus,
      badge_text: formData.badge_text.trim() || null,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      is_active: formData.is_active,
      category_ids: null,
      days_of_week: formData.banner_type === 'green_friday' ? [5] : null,
      order_position: editingPromo ? editingPromo.order_position : promotions.length + 1,
    };

    if (editingPromo) {
      const { error } = await wastePromotionsService.update(editingPromo.id, payload);
      if (error) {
        toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'แก้ไขโปรโมชั่นเรียบร้อยแล้ว' });
    } else {
      const { error } = await wastePromotionsService.insert(payload);
      if (error) {
        toast({ title: 'สร้างไม่สำเร็จ', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'สร้างโปรโมชั่นใหม่สำเร็จ' });
    }

    setIsDialogOpen(false);
    loadData();
  };

  const handleSeedDefaults = async () => {
    if (!confirm('ต้องการเพิ่มชุดแคมเปญมาตรฐาน 4 แคมเปญ (วันศุกร์สีเขียว x2, พักเที่ยงโบนัส +5, สัปดาห์กล่องนม x3, ภารกิจบ้านสู่โรงเรียน)?')) return;
    try {
      await wastePromotionsService.seedDefaultCampaigns();
      toast({ title: 'เพิ่มแคมเปญมาตรฐานเรียบร้อยแล้ว' });
      loadData();
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeSubTab === 'campaigns' ? 'default' : 'outline'}
            className={cn(
              "h-9 text-xs font-semibold rounded-xl",
              activeSubTab === 'campaigns' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
            onClick={() => setActiveSubTab('campaigns')}
          >
            <Flame className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            <span>จัดการโปรโมชั่น & แคมเปญ ({promotions.length})</span>
          </Button>

          <Button
            size="sm"
            variant={activeSubTab === 'spins' ? 'default' : 'outline'}
            className={cn(
              "h-9 text-xs font-semibold rounded-xl",
              activeSubTab === 'spins' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
            onClick={() => setActiveSubTab('spins')}
          >
            <Gift className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            <span>ประวัติหมุนวงล้อเสี่ยงโชค ({spins.length})</span>
          </Button>
        </div>

        {activeSubTab === 'campaigns' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSeedDefaults}
              className="h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>แคมเปญมาตรฐาน</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>สร้างโปรโมชั่นใหม่</span>
            </Button>
          </div>
        )}
      </div>

      {/* Tab 1: Campaigns List */}
      {activeSubTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions.map((promo) => (
            <Card key={promo.id} className={cn(
              "border transition-all bg-card text-foreground",
              promo.is_active ? "border-primary/40 shadow-sm" : "border-border opacity-70"
            )}>
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={cn(
                        "text-xs px-2 py-0.5 font-bold border-none",
                        promo.multiplier > 1 ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"
                      )}>
                        {promo.badge_text || (promo.multiplier > 1 ? `แต้ม x${promo.multiplier}` : `โบนัส +${promo.bonus_points}`)}
                      </Badge>
                      <Badge variant="outline" className="text-[11px] text-muted-foreground border-border">
                        {promo.banner_type === 'green_friday' ? 'วันศุกร์สีเขียว' :
                         promo.banner_type === 'happy_hour' ? 'แฮปปี้อาวร์' :
                         promo.banner_type === 'target_item' ? 'ไอเทมเฉพาะกิจ' :
                         promo.banner_type === 'home_quest' ? 'ภารกิจบ้าน' : 'ทั่วไป'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={() => handleToggleActive(promo.id, promo.is_active)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-foreground">{promo.title}</h4>
                    {promo.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {promo.description}
                      </p>
                    )}
                  </div>

                  {/* Conditions Details */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground pt-1">
                    {promo.days_of_week && promo.days_of_week.length > 0 && (
                      <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3 text-primary/70" />
                        {promo.days_of_week.includes(5) ? 'ทุกวันศุกร์' :
                         promo.days_of_week.includes(1) ? 'ทุกวันจันทร์' : 'เฉพาะวันกำหนด'}
                      </span>
                    )}
                    {promo.start_time && promo.end_time && (
                      <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-primary/70" />
                        {promo.start_time.slice(0, 5)} - {promo.end_time.slice(0, 5)} น.
                      </span>
                    )}
                    {promo.multiplier > 1 && (
                      <span className="flex items-center gap-1 bg-amber-500/10 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                        <Zap className="w-3 h-3 text-amber-500" />
                        ตัวคูณ x{promo.multiplier}
                      </span>
                    )}
                    {promo.bonus_points > 0 && (
                      <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        โบนัส +{promo.bonus_points} แต้ม
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(promo)}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    <span>แก้ไข</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(promo.id)}
                    className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>ลบ</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 2: Lucky Spins History */}
      {activeSubTab === 'spins' && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              <span>ประวัติการหมุนวงล้อเสี่ยงโชค (ล่าสุด {spins.length} รายการ)</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              บันทึกรางวัลที่นักเรียนได้รับจากการส่งขยะครบ 20 ชิ้น
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {spins.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                ยังไม่มีประวัติการหมุนวงล้อเสี่ยงโชค
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {spins.map((spin) => (
                  <div key={spin.id} className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-xl flex-shrink-0">🎡</div>
                      <div>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <span>{spin.student_name}</span>
                          {spin.student_class && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                              {spin.student_class}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatThaiDateFull(spin.spun_at.slice(0, 10))} · เวลา {new Date(spin.spun_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">
                        {spin.spin_result}
                      </div>
                      {spin.bonus_points_awarded > 0 && (
                        <div className="text-xs text-amber-600 font-semibold">
                          +{spin.bonus_points_awarded} แต้มสะสม
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Promotion Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-card text-foreground border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingPromo ? 'แก้ไขแคมเปญโปรโมชั่น' : 'สร้างแคมเปญโปรโมชั่นใหม่'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              กำหนดกติกา ตัวคูณแต้ม หรือโบนัสพิเศษเพื่อเร่งยอดการส่งขยะรีไซเคิล
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">ชื่อโปรโมชั่น *</Label>
              <Input
                placeholder="เช่น วันศุกร์สีเขียว (Green Friday)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">คำอธิบายกติกา</Label>
              <Input
                placeholder="เช่น ส่งขยะทุกประเภท รับแต้มสะสมเพิ่ม 2 เท่า"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">รูปแบบแบนเนอร์</Label>
                <Select
                  value={formData.banner_type}
                  onValueChange={(val) => setFormData({ ...formData, banner_type: val })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green_friday">วันศุกร์สีเขียว (Green Friday)</SelectItem>
                    <SelectItem value="happy_hour">แฮปปี้อาวร์ (Lunch Break)</SelectItem>
                    <SelectItem value="target_item">สัปดาห์ไอเทมเฉพาะกิจ</SelectItem>
                    <SelectItem value="home_quest">ภารกิจบ้านสู่โรงเรียน</SelectItem>
                    <SelectItem value="flash_sale">แฟลชเซลล์ลดแต้ม</SelectItem>
                    <SelectItem value="custom">กำหนดเอง (Custom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">ข้อความ Badge</Label>
                <Input
                  placeholder="เช่น 🔥 แต้ม x2"
                  value={formData.badge_text}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">ตัวคูณแต้ม (Multiplier)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  placeholder="1.0 - 5.0"
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">แต้มโบนัสบวกเพิ่ม (Bonus Points)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0, 5, 10"
                  value={formData.bonus_points}
                  onChange={(e) => setFormData({ ...formData, bonus_points: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">เวลาเริ่ม (ถ้ามี)</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">เวลาสิ้นสุด (ถ้ามี)</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-xs">
              ยกเลิก
            </Button>
            <Button onClick={handleSave} className="h-9 text-xs bg-primary text-primary-foreground">
              บันทึกแคมเปญ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
