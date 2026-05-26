import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Heart, Loader2, Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import generatePayload from 'promptpay-qr';
import { toast } from 'sonner';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { donationsService, type DonationCampaign } from '@/services/donations.service';

const Donate = () => {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['donation-campaigns'],
    queryFn: () => donationsService.listCampaigns(),
  });

  const activeCampaigns = campaigns.filter((c) => c.is_active);
  const featured = activeCampaigns.find((c) => c.is_featured) ?? activeCampaigns[0];

  const [selected, setSelected] = useState<DonationCampaign | null>(null);
  const campaign = selected ?? featured ?? null;

  const [amount, setAmount] = useState('500');
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const promptpayPayload = campaign?.promptpay_id && amount && Number(amount) > 0
    ? generatePayload(campaign.promptpay_id, { amount: Number(amount) })
    : '';

  const submit = useMutation({
    mutationFn: () =>
      donationsService.submitDonation({
        campaign_id: campaign!.id,
        donor_name: anonymous ? 'ผู้ไม่ประสงค์ออกนาม' : donorName,
        donor_phone: anonymous ? null : donorPhone || null,
        donor_email: anonymous ? null : donorEmail || null,
        amount: Number(amount),
        message: message || null,
        is_anonymous: anonymous,
        payment_slip_url: null,
      }),
    onSuccess: () => {
      setSubmitted(true);
      toast.success('ขอบคุณสำหรับการบริจาค — โรงเรียนจะยืนยันสลิปและส่งใบเสร็จให้');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaigns.length) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center space-y-3">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                ขณะนี้ยังไม่มีแคมเปญรับบริจาค
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-600 mb-3">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">บริจาคให้โรงเรียน</h1>
          <p className="text-muted-foreground mt-2">
            ทุกบาทมีค่า — ขอบคุณที่ช่วยพัฒนาการเรียนการสอนของบุตรหลานชุมชน
          </p>
        </div>

        {/* Campaign picker */}
        {activeCampaigns.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeCampaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  campaign?.id === c.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-card'
                }`}
              >
                <p className="font-semibold text-sm">{c.title}</p>
                {c.target_amount && (
                  <>
                    <p className="text-xs text-muted-foreground mt-1">
                      ฿{Number(c.raised_amount).toLocaleString()} / ฿{Number(c.target_amount).toLocaleString()}
                    </p>
                    <Progress value={(Number(c.raised_amount) / Number(c.target_amount)) * 100} className="h-1.5 mt-2" />
                  </>
                )}
              </button>
            ))}
          </div>
        )}

        {campaign && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Campaign details */}
            <Card>
              <CardHeader>
                <CardTitle>{campaign.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaign.cover_image_url && (
                  <img src={campaign.cover_image_url} alt="" className="w-full rounded-lg" />
                )}
                {campaign.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
                )}
                {campaign.target_amount && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">เป้าหมาย</span>
                      <span className="font-bold">฿{Number(campaign.target_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ระดมแล้ว</span>
                      <span className="font-bold text-rose-600">฿{Number(campaign.raised_amount).toLocaleString()}</span>
                    </div>
                    <Progress value={(Number(campaign.raised_amount) / Number(campaign.target_amount)) * 100} />
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  PromptPay: {campaign.promptpay_id} {campaign.promptpay_owner_name && `(${campaign.promptpay_owner_name})`}
                </div>
              </CardContent>
            </Card>

            {/* Donation form + QR */}
            <Card>
              <CardHeader>
                <CardTitle>ร่วมบริจาค</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submitted ? (
                  <div className="text-center py-8 space-y-3">
                    <Check className="w-12 h-12 text-green-600 mx-auto" />
                    <p className="font-medium">ขอบคุณสำหรับการบริจาค</p>
                    <p className="text-sm text-muted-foreground">
                      โรงเรียนจะตรวจสลิปและส่งใบเสร็จให้ทางอีเมล/โทรศัพท์ที่แจ้งไว้
                    </p>
                    <Button onClick={() => { setSubmitted(false); setAmount('500'); setDonorName(''); setMessage(''); }}>
                      บริจาคเพิ่ม
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>จำนวน (บาท)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-2xl font-bold"
                      />
                      <div className="flex gap-1.5 mt-2">
                        {[100, 500, 1000, 2000, 5000].map((v) => (
                          <Button
                            key={v}
                            size="sm"
                            variant={Number(amount) === v ? 'default' : 'outline'}
                            onClick={() => setAmount(String(v))}
                          >
                            ฿{v.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {promptpayPayload && (
                      <div className="bg-white border-2 border-emerald-300 rounded-xl p-4 flex flex-col items-center gap-2">
                        <p className="text-xs font-medium text-emerald-700">สแกน QR PromptPay เพื่อจ่าย</p>
                        <QRCode value={promptpayPayload} size={180} />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(campaign.promptpay_id);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                          {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                          คัดลอกเลข PromptPay
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Switch id="anon" checked={anonymous} onCheckedChange={setAnonymous} />
                      <Label htmlFor="anon" className="text-sm cursor-pointer">บริจาคในนาม "ผู้ไม่ประสงค์ออกนาม"</Label>
                    </div>

                    {!anonymous && (
                      <>
                        <Input placeholder="ชื่อ-นามสกุล" value={donorName} onChange={(e) => setDonorName(e.target.value)} />
                        <Input placeholder="เบอร์โทร (สำหรับใบเสร็จ)" value={donorPhone} onChange={(e) => setDonorPhone(e.target.value)} />
                        <Input placeholder="อีเมล (ไม่บังคับ)" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} />
                      </>
                    )}

                    <Textarea placeholder="ข้อความให้กำลังใจ (ไม่บังคับ)" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />

                    <Button
                      className="w-full"
                      onClick={() => submit.mutate()}
                      disabled={submit.isPending || !Number(amount) || (!anonymous && !donorName)}
                    >
                      {submit.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
                      บันทึกการบริจาค ฿{Number(amount).toLocaleString()}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      กรุณาโอนเงินตาม QR แล้วกดปุ่มด้านบนเพื่อแจ้งโรงเรียน — โรงเรียนจะตรวจสลิปและส่งใบเสร็จ
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Donate;
