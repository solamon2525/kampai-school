import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Unlink, CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { lineService } from '@/services/line.service';

const LINE_OA_ID = import.meta.env.VITE_LINE_OA_BASIC_ID as string | undefined;
const LINE_ADD_FRIEND_URL = LINE_OA_ID ? `https://line.me/R/ti/p/%40${LINE_OA_ID.replace(/^@/, '')}` : '';

export const LineConnectCard = () => {
  const qc = useQueryClient();
  const [showQr, setShowQr] = useState(false);

  const { data: link, isLoading } = useQuery({
    queryKey: ['line-my-link'],
    queryFn: () => lineService.getMyLink(),
    staleTime: 60_000,
  });

  const unlink = useMutation({
    mutationFn: () => lineService.unlinkMine(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['line-my-link'] });
      toast.success('ยกเลิกการเชื่อมต่อ LINE แล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-muted-foreground">กำลังตรวจสอบสถานะ LINE...</span>
        </CardContent>
      </Card>
    );
  }

  if (link) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            เชื่อมต่อ LINE แล้ว
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {link.picture_url && (
              <img
                src={link.picture_url}
                alt=""
                className="w-10 h-10 rounded-full border border-border"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{link.display_name || 'LINE User'}</p>
              <p className="text-xs text-muted-foreground">
                คุณจะได้รับข่าวสารและการแจ้งเตือนทาง LINE
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => unlink.mutate()}
            disabled={unlink.isPending}
            className="w-full"
          >
            <Unlink className="w-4 h-4 mr-2" />
            ยกเลิกการเชื่อมต่อ
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-600" />
          เชื่อมต่อ LINE Official Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          เพิ่มเพื่อน LINE OA ของโรงเรียน เพื่อรับข่าวสาร, แจ้งเตือนการเข้าเรียน, และผลคะแนนของบุตรทันที
        </p>

        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>กดปุ่ม "เพิ่มเพื่อน LINE" ด้านล่าง (หรือสแกน QR)</li>
          <li>เพิ่มเพื่อนใน LINE</li>
          <li>แจ้งครู/ผู้ดูแลระบบเพื่อผูกบัญชี LINE กับบัญชี Kampai ของท่าน</li>
        </ol>

        <div className="flex gap-2">
          {LINE_ADD_FRIEND_URL && (
            <Button
              asChild
              size="sm"
              className="flex-1 bg-[#06C755] hover:bg-[#06B14C] text-white"
            >
              <a href={LINE_ADD_FRIEND_URL} target="_blank" rel="noopener noreferrer">
                <Link2 className="w-4 h-4 mr-2" />
                เพิ่มเพื่อน LINE
              </a>
            </Button>
          )}
          {LINE_ADD_FRIEND_URL && (
            <Button size="sm" variant="outline" onClick={() => setShowQr((s) => !s)}>
              {showQr ? 'ซ่อน QR' : 'แสดง QR'}
            </Button>
          )}
        </div>

        {!LINE_ADD_FRIEND_URL && (
          <p className="text-xs text-amber-600">
            ยังไม่ได้ตั้งค่า VITE_LINE_OA_BASIC_ID — ผู้ดูแลระบบต้องเพิ่ม env ก่อน
          </p>
        )}

        {showQr && LINE_ADD_FRIEND_URL && (
          <div className="flex justify-center pt-2">
            <div className="bg-white p-3 rounded-lg border border-border">
              <QRCode value={LINE_ADD_FRIEND_URL} size={140} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
