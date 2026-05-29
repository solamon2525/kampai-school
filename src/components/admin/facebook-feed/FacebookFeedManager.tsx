import { useState } from 'react';
import { Facebook, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FacebookFeedSettingsCard } from '@/components/admin/settings/sections/FacebookFeedSettingsCard';

export const FacebookFeedManager = () => {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1877F2]/10 flex items-center justify-center flex-shrink-0">
          <Facebook className="w-6 h-6 text-[#1877F2]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">ฟีดข่าว Facebook</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ตั้งค่า Page Access Token + จำนวนโพสต์ที่ดึงจาก Facebook Page ของโรงเรียน
            มาแสดงในหน้าแรก
          </p>
        </div>
      </header>

      <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
        <div className="rounded-lg border border-border bg-muted/30">
          <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left">
            <span className="text-sm font-semibold text-foreground">
              วิธีตั้งค่าและแก้ปัญหา Token หมดอายุ
            </span>
            {helpOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 text-sm text-muted-foreground space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">1. หา Facebook Page ID</p>
                <p>
                  เข้า Page → Settings → About → เลื่อนลงไปที่ "Page Transparency"
                  จะเห็น Page ID เป็นตัวเลขยาว ๆ คัดลอกมาใส่ในช่อง "Facebook Page ID"
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">
                  2. สร้าง Long-Lived Page Access Token
                </p>
                <p>
                  ใช้ Graph API Explorer ของ Facebook Developer:{' '}
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    developers.facebook.com/tools/explorer{' '}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {' '}— ขอ User Token พร้อม permission{' '}
                  <code className="px-1 py-0.5 rounded bg-background text-xs">pages_read_engagement</code>
                  {' '}+{' '}
                  <code className="px-1 py-0.5 rounded bg-background text-xs">pages_show_list</code>
                  {' '}จากนั้นแลกเป็น Long-Lived Page Access Token (~60 วัน)
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">3. Token หมดอายุทำยังไง</p>
                <p>
                  Long-Lived Page Token จะอยู่ ~60 วัน แล้วต้องสร้างใหม่ตามขั้นตอนด้านบน
                  วาง token ใหม่ในฟอร์ม → กด "บันทึก" → กด "รีเฟรชเดี๋ยวนี้" เพื่อทดสอบ
                  ถ้าสถานะกลับเป็นสีเขียว ("เชื่อมต่อสำเร็จ") = ใช้ได้
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">หมายเหตุความปลอดภัย</p>
                <p>
                  Token ถูกเก็บใน table{' '}
                  <code className="px-1 py-0.5 rounded bg-background text-xs">
                    facebook_feed_config
                  </code>{' '}
                  พร้อม RLS — admin เท่านั้นที่อ่าน/แก้ได้ ไม่หลุดสู่ฝั่ง client
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <FacebookFeedSettingsCard />
    </div>
  );
};
