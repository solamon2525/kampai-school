import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { GraduationCap, Plus, Calendar, MapPin, Users, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { alumniService } from '@/services/alumni.service';

const Alumni = () => {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [rsvpFor, setRsvpFor] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    nickname: '',
    graduation_year: new Date().getFullYear() - 5,
    graduation_class: '',
    current_school: '',
    current_career: '',
    current_workplace: '',
    bio: '',
    contact_email_public: '',
    contact_phone_public: '',
  });
  const [rsvpForm, setRsvpForm] = useState({ guest_name: '', guest_phone: '', party_size: 1, notes: '' });

  const { data: alumni = [] } = useQuery({
    queryKey: ['public-alumni'],
    queryFn: () => alumniService.listVerified(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['alumni-events'],
    queryFn: () => alumniService.listEvents(),
  });

  const submit = useMutation({
    mutationFn: () =>
      alumniService.submit({
        ...form,
        photo_url: null,
        contact_email_public: form.contact_email_public || null,
        contact_phone_public: form.contact_phone_public || null,
        graduation_class: form.graduation_class || null,
        current_school: form.current_school || null,
        current_career: form.current_career || null,
        current_workplace: form.current_workplace || null,
        bio: form.bio || null,
        nickname: form.nickname || null,
      } as any),
    onSuccess: () => {
      setSubmitOpen(false);
      toast.success('ส่งแล้ว — โรงเรียนจะตรวจสอบและเผยแพร่หลังยืนยัน');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rsvp = useMutation({
    mutationFn: () =>
      alumniService.rsvp(rsvpFor!, rsvpForm.guest_name, rsvpForm.guest_phone, rsvpForm.party_size, rsvpForm.notes),
    onSuccess: () => {
      setRsvpFor(null);
      setRsvpForm({ guest_name: '', guest_phone: '', party_size: 1, notes: '' });
      toast.success('ขอบคุณ — RSVP สำเร็จ');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upcomingEvents = events.filter((e) => new Date(e.event_date) > new Date());

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-700 mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">เครือข่ายศิษย์เก่า</h1>
          <p className="text-muted-foreground mt-2">
            รวมศิษย์เก่าของโรงเรียนบ้านคำไผ่ — ความภาคภูมิใจของพวกเรา
          </p>
        </div>

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                กิจกรรมที่กำลังจะถึง
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="border border-border rounded-lg p-4 bg-card">
                  {e.cover_image_url && <img src={e.cover_image_url} alt="" className="w-full h-40 object-cover rounded-md mb-3" />}
                  <p className="font-bold text-lg">{e.title}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(e.event_date), 'EEEE d MMMM yyyy HH:mm', { locale: th })}</span>
                    {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />ตอบรับ {e.attendee_count}</span>
                  </div>
                  {e.description && <p className="text-sm mt-2 whitespace-pre-wrap">{e.description}</p>}
                  <Button size="sm" className="mt-3" onClick={() => setRsvpFor(e.id)}>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    ตอบรับ
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Alumni grid */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">ศิษย์เก่า ({alumni.length})</h2>
          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                เพิ่มข้อมูลของฉัน
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>ลงทะเบียนศิษย์เก่า</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>ชื่อ-นามสกุล</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>ชื่อเล่น</Label>
                    <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
                  </div>
                  <div>
                    <Label>ปีที่จบ</Label>
                    <Input type="number" value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>รุ่น/ชั้น</Label>
                    <Input placeholder="ป.6/1" value={form.graduation_class} onChange={(e) => setForm({ ...form, graduation_class: e.target.value })} />
                  </div>
                  <div>
                    <Label>เรียนต่อที่</Label>
                    <Input placeholder="ม. หรือ ร.ร." value={form.current_school} onChange={(e) => setForm({ ...form, current_school: e.target.value })} />
                  </div>
                  <div>
                    <Label>อาชีพปัจจุบัน</Label>
                    <Input value={form.current_career} onChange={(e) => setForm({ ...form, current_career: e.target.value })} />
                  </div>
                  <div>
                    <Label>ที่ทำงาน</Label>
                    <Input value={form.current_workplace} onChange={(e) => setForm({ ...form, current_workplace: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>เกี่ยวกับฉัน</Label>
                  <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>อีเมล (แสดงสาธารณะ)</Label>
                    <Input type="email" value={form.contact_email_public} onChange={(e) => setForm({ ...form, contact_email_public: e.target.value })} />
                  </div>
                  <div>
                    <Label>เบอร์โทร (แสดงสาธารณะ)</Label>
                    <Input value={form.contact_phone_public} onChange={(e) => setForm({ ...form, contact_phone_public: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSubmitOpen(false)}>ยกเลิก</Button>
                <Button onClick={() => submit.mutate()} disabled={!form.full_name || !form.graduation_year || submit.isPending}>
                  {submit.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  ส่งให้ตรวจสอบ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {!alumni.length && (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              ยังไม่มีศิษย์เก่าในระบบ — เป็นคนแรกที่ลงทะเบียน
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {alumni.map((a) => (
            <Card key={a.id} className={a.is_featured ? 'ring-2 ring-amber-300' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <PersonAvatar name={a.full_name} photoUrl={a.photo_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <p className="font-bold text-sm truncate">{a.full_name}</p>
                      {a.is_featured && <Badge variant="default" className="text-[9px]">เด่น</Badge>}
                    </div>
                    {a.nickname && <p className="text-[11px] text-muted-foreground">({a.nickname})</p>}
                    <p className="text-[11px] text-muted-foreground">รุ่น {a.graduation_year}{a.graduation_class && ` · ${a.graduation_class}`}</p>
                  </div>
                </div>
                {a.current_career && <p className="text-xs"><strong>{a.current_career}</strong>{a.current_workplace && ` @ ${a.current_workplace}`}</p>}
                {a.current_school && <p className="text-xs text-muted-foreground">📚 {a.current_school}</p>}
                {a.bio && <p className="text-xs mt-2 line-clamp-3 whitespace-pre-wrap">{a.bio}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!rsvpFor} onOpenChange={(v) => !v && setRsvpFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ตอบรับเข้าร่วม</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div><Label>ชื่อผู้ตอบรับ</Label><Input value={rsvpForm.guest_name} onChange={(e) => setRsvpForm({ ...rsvpForm, guest_name: e.target.value })} /></div>
              <div><Label>เบอร์โทร</Label><Input value={rsvpForm.guest_phone} onChange={(e) => setRsvpForm({ ...rsvpForm, guest_phone: e.target.value })} /></div>
              <div><Label>มากี่คน</Label><Input type="number" min="1" max="20" value={rsvpForm.party_size} onChange={(e) => setRsvpForm({ ...rsvpForm, party_size: Number(e.target.value) })} /></div>
              <div><Label>หมายเหตุ</Label><Textarea rows={2} value={rsvpForm.notes} onChange={(e) => setRsvpForm({ ...rsvpForm, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRsvpFor(null)}>ยกเลิก</Button>
              <Button onClick={() => rsvp.mutate()} disabled={!rsvpForm.guest_name || rsvp.isPending}>
                {rsvp.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                ยืนยัน
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Alumni;
