import React, { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Youtube, Instagram, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { MapEmbed } from '@/components/MapEmbed';
import { PageBlockRenderer } from '@/components/page-builder/PageBlockRenderer';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}


const Contact = () => {
  const { toast } = useToast();
  const { settings } = useSchoolSettings();
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  // Build contact info from settings
  const contactInfo = [
    { icon: MapPin, title: 'ที่อยู่', content: settings.contact_address || 'ไม่ได้ระบุ' },
    { icon: Phone, title: 'โทรศัพท์', content: settings.contact_phone || 'ไม่ได้ระบุ' },
    { icon: Mail, title: 'อีเมล', content: settings.contact_email || 'ไม่ได้ระบุ' },
    { icon: Clock, title: 'เวลาทำการ', content: settings.contact_hours || 'จันทร์ - ศุกร์ 07:30 - 16:30 น.' },
  ];

  // Build social links from settings.social_links (single source of truth)
  const platformIcons: Record<string, React.ElementType> = {
    facebook: Facebook, youtube: Youtube, instagram: Instagram, line: MessageCircle,
  };
  const platformColors: Record<string, string> = {
    facebook: 'hover:bg-blue-600', youtube: 'hover:bg-red-600',
    instagram: 'hover:bg-rose-600', line: 'hover:bg-green-500',
  };
  const socialLinks = (settings.social_links || [])
    .filter(link => !!link.url)
    .map(link => ({
      icon: platformIcons[link.platform] || LinkIcon,
      href: link.url,
      label: link.platform,
      color: platformColors[link.platform] || 'hover:bg-primary',
    }));

  useEffect(() => {
    fetchFaq();
  }, []);

  const fetchFaq = async () => {
    try {
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (error) throw error;
      setFaqItems(data || []);
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      // Use default FAQ if table doesn't exist yet
      setFaqItems([
        { id: '1', question: 'ค่าธรรมเนียมการศึกษาเท่าไหร่?', answer: 'ค่าธรรมเนียมการศึกษาต่อภาคเรียน ม.ต้น 15,000 บาท และ ม.ปลาย 18,000 บาท' },
        { id: '2', question: 'มีรถรับส่งนักเรียนหรือไม่?', answer: 'มีบริการรถรับส่งนักเรียน ครอบคลุมพื้นที่กรุงเทพฯ และปริมณฑล' },
        { id: '3', question: 'เปิดรับสมัครนักเรียนใหม่เมื่อไหร่?', answer: 'เปิดรับสมัครนักเรียนใหม่ทุกปี ช่วงเดือนกุมภาพันธ์ - มีนาคม' },
      ]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('contact_messages' as any)
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }]);

      if (error) throw error;

      toast({
        title: 'ส่งข้อความสำเร็จ',
        description: 'เราได้รับข้อความของคุณแล้ว จะติดต่อกลับโดยเร็วที่สุด',
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'ส่งข้อความไม่สำเร็จ',
        description: 'กรุณาลองใหม่อีกครั้งในภายหลัง',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="ติดต่อเรา" description="ข้อมูลการติดต่อโรงเรียน" />
      <SiteHeader />
      <div className="max-w-7xl mx-auto w-full bg-background">
      <main>
        {/* Hero — Compact */}
        <section className="bg-primary py-2 md:py-6">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block text-xs md:text-sm font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5">
              ติดต่อเรา
            </span>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-foreground mb-1.5">
              พร้อมให้บริการ
            </h1>
            <p className="text-xs md:text-sm text-primary-foreground/75 max-w-2xl mx-auto">
              มีคำถามหรือต้องการข้อมูลเพิ่มเติม? ติดต่อเราได้ทุกช่องทาง
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-4 md:py-6 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((item, index) => (
                <div key={index} className="bg-card rounded-2xl p-6 shadow-lg border border-border text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-6 md:py-10 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-card rounded-3xl p-8 md:p-10 shadow-lg border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-8">ส่งข้อความถึงเรา</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        ชื่อ-นามสกุล *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="กรอกชื่อ-นามสกุล"
                        required
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                        เบอร์โทรศัพท์
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0XX-XXX-XXXX"
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      อีเมล *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      required
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      เรื่อง *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="หัวข้อที่ต้องการติดต่อ"
                      required
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      ข้อความ *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="รายละเอียดที่ต้องการสอบถาม..."
                      required
                      rows={5}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 h-14 gap-2"
                  >
                    <Send className="w-5 h-5" />
                    ส่งข้อความ
                  </Button>
                </form>
              </div>

              {/* Map and Social */}
              <div className="space-y-8">
                {/* Map */}
                <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border h-80">
                  <MapEmbed url={settings.google_maps_embed} title="แผนที่โรงเรียน" />
                </div>

                {/* Social Links */}
                <div className="bg-primary rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-primary-foreground mb-6">ติดตามเราผ่านโซเชียลมีเดีย</h3>
                  <div className="flex gap-4 flex-wrap">
                    {settings.social_links && settings.social_links.length > 0 ? (
                      settings.social_links.map((link, index) => {
                        const getSocialIcon = (platform: string) => {
                          switch (platform) {
                            case 'facebook': return Facebook;
                            case 'youtube': return Youtube;
                            case 'instagram': return Instagram;
                            case 'line': return MessageCircle;
                            case 'twitter': return MessageCircle; // Use generic for now or import Twitter
                            case 'tiktok': return MessageCircle; // Use generic
                            default: return LinkIcon;
                          }
                        };
                        const Icon = getSocialIcon(link.platform);

                        // Assign colors based on platform
                        const getColor = (platform: string) => {
                          switch (platform) {
                            case 'facebook': return 'hover:bg-blue-600';
                            case 'youtube': return 'hover:bg-red-600';
                            case 'instagram': return 'hover:bg-rose-600';
                            case 'line': return 'hover:bg-green-500';
                            default: return 'hover:bg-primary-foreground/20';
                          }
                        }

                        return (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-14 h-14 rounded-xl bg-primary-foreground/10 flex items-center justify-center text-primary-foreground ${getColor(link.platform)} transition-colors`}
                          >
                            <Icon className="w-6 h-6" />
                          </a>
                        );
                      })
                    ) : (
                      <p className="text-primary-foreground/80">ยังไม่มีข้อมูลโซเชียลมีเดีย</p>
                    )}
                  </div>
                </div>

                {/* FAQ */}
                <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
                  <h3 className="text-xl font-bold text-foreground mb-6">คำถามที่พบบ่อย</h3>
                  <div className="space-y-4">
                    {faqItems.map((faq, index) => (
                      <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                        <h4 className="font-semibold text-foreground mb-2">{faq.question}</h4>
                        <p className="text-muted-foreground text-sm">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PageBlockRenderer dbKey="page_layout_contact" />
      <Footer />
      </div>
    </div>
  );
};

export default Contact;
