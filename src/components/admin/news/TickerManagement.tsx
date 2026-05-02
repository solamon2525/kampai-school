import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

export const TickerManagement = () => {
  const { toast } = useToast();
  const { settings, refetch: refetchSettings } = useSchoolSettings();

  const [speed, setSpeed] = useState(settings.ticker_speed_seconds || '30');
  const [gap, setGap] = useState(settings.ticker_gap_px || '60');
  const [pauseHover, setPauseHover] = useState(
    (settings.ticker_pause_on_hover ?? 'true') !== 'false'
  );
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setSpeed(settings.ticker_speed_seconds || '30');
    setGap(settings.ticker_gap_px || '60');
    setPauseHover((settings.ticker_pause_on_hover ?? 'true') !== 'false');
  }, [settings.ticker_speed_seconds, settings.ticker_gap_px, settings.ticker_pause_on_hover]);

  const saveSettings = async () => {
    setSavingSettings(true);
    const updates = [
      { key: 'ticker_speed_seconds', value: speed },
      { key: 'ticker_gap_px', value: gap },
      { key: 'ticker_pause_on_hover', value: pauseHover ? 'true' : 'false' },
    ];
    const { error } = await supabase
      .from('school_settings')
      .upsert(updates as any, { onConflict: 'key' });
    setSavingSettings(false);
    if (error) {
      toast({ title: 'บันทึกตั้งค่าล้มเหลว', description: error.message, variant: 'destructive' });
      return;
    }
    refetchSettings();
    toast({ title: 'บันทึกการตั้งค่าแล้ว' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>การตั้งค่าตัววิ่งข่าว</CardTitle>
          <CardDescription>
            ตั้งค่าความเร็ว/ระยะห่างของตัววิ่งข่าว — ข่าวที่จะวิ่งกำหนดในเมนู <strong>ข่าวสาร</strong> (เปิด Switch &quot;แสดงในตัววิ่งข่าว&quot; ในแต่ละข่าว สูงสุด 5)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>ความเร็ว (วินาทีต่อรอบ)</Label>
              <Input type="number" min={5} max={300} value={speed} onChange={(e) => setSpeed(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">ค่ามาก = ช้าลง (default: 30)</p>
            </div>
            <div>
              <Label>ระยะห่างระหว่างหัวข้อ (px)</Label>
              <Input type="number" min={8} max={300} value={gap} onChange={(e) => setGap(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">default: 60</p>
            </div>
            <div className="flex flex-col justify-between">
              <Label>หยุดเมื่อ hover</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch checked={pauseHover} onCheckedChange={setPauseHover} />
                <span className="text-sm">{pauseHover ? 'เปิด' : 'ปิด'}</span>
              </div>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={savingSettings}>
            <Save className="w-4 h-4 mr-2" />
            {savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TickerManagement;
