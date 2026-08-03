/**
 * DonationReceipt — printable tax/donation receipt (DESIGN 14.27 Phase 2 light)
 * Public read of verified donations via RLS.
 */
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { donationsService } from '@/services/donations.service';

export default function DonationReceipt() {
  const { id } = useParams<{ id: string }>();

  const { data: donation, isLoading, error } = useQuery({
    queryKey: ['donation-receipt', id],
    enabled: !!id,
    queryFn: () => donationsService.getDonation(id!),
  });

  const { data: campaign } = useQuery({
    queryKey: ['donation-receipt-campaign', donation?.campaign_id],
    enabled: !!donation?.campaign_id,
    queryFn: () => donationsService.getCampaign(donation!.campaign_id!),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> กำลังโหลดใบเสร็จ…
      </div>
    );
  }

  if (error || !donation || !donation.is_verified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground text-center max-w-md">
          ไม่พบใบเสร็จ หรือรายการยังไม่ได้ยืนยันโดยโรงเรียน
        </p>
      </div>
    );
  }

  const donorLabel = donation.is_anonymous ? 'ไม่ประสงค์ออกนาม' : donation.donor_name;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="print:hidden sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur px-4 py-3 flex justify-end gap-2">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          พิมพ์ใบเสร็จ
        </Button>
      </div>

      <article className="mx-auto max-w-2xl p-8 space-y-6">
        <header className="text-center space-y-1 border-b border-border pb-4">
          <p className="text-xs text-muted-foreground tracking-wide">โรงเรียนบ้านคำไผ่</p>
          <h1 className="text-2xl font-bold">ใบเสร็จรับบริจาค</h1>
          <p className="text-sm text-muted-foreground">
            เลขที่ {donation.receipt_number ?? '—'}
          </p>
        </header>

        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">วันที่บริจาค</dt>
            <dd className="font-medium">
              {format(new Date(donation.donated_at), 'd MMMM yyyy', { locale: th })}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">ผู้บริจาค</dt>
            <dd className="font-medium text-right">{donorLabel}</dd>
          </div>
          {campaign && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">แคมเปญ</dt>
              <dd className="font-medium text-right">{campaign.title}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-border pt-3">
            <dt className="text-muted-foreground">จำนวนเงิน</dt>
            <dd className="text-xl font-bold">
              ฿{Number(donation.amount).toLocaleString('th-TH')}
            </dd>
          </div>
          {donation.message && (
            <div className="pt-1">
              <dt className="text-muted-foreground mb-1">ข้อความ</dt>
              <dd className="italic text-sm">“{donation.message}”</dd>
            </div>
          )}
        </dl>

        <footer className="pt-8 text-xs text-muted-foreground space-y-2 border-t border-border">
          <p>
            เอกสารนี้ออกโดยระบบ kampai-school หลังยืนยันสลิปแล้ว —
            ใช้เป็นหลักฐานการบริจาคเบื้องต้น (ยังไม่ใช่ใบเสร็จภาษี e-Donation)
          </p>
          <div className="grid grid-cols-2 gap-8 pt-10 print:pt-16">
            <div className="text-center">
              <div className="border-t border-border pt-2">ผู้รับเงิน</div>
            </div>
            <div className="text-center">
              <div className="border-t border-border pt-2">ผู้อนุมัติ</div>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
