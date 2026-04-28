import { useState, useEffect } from 'react';
import { Mail, Phone } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';

interface Administrator {
  id: string;
  name: string;
  position: string;
  education: string;
  quote: string;
  photo_url: string;
  order_position: number;
}

const colorPalette = [
  'from-primary to-navy-light',
  'from-accent to-gold-light',
  'from-green-500 to-green-400',
  'from-emerald-500 to-emerald-400',
  'from-blue-500 to-blue-400',
  'from-orange-500 to-orange-400',
];

const AdministratorsSection = () => {
  const { settings } = useSchoolSettings();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdministrators();
  }, []);

  const fetchAdministrators = async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
      console.error('Error fetching administrators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section id="administrators" className="section-padding bg-secondary/30">
        <div className="container-school">
          <div className="text-center py-12">
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="administrators" className="section-padding bg-secondary/30">
      <div className="container-school">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-accent font-semibold mb-4">ผู้บริหาร</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            <span className="text-primary">คณะผู้บริหาร</span>โรงเรียน
          </h2>
          <p className="text-muted-foreground text-lg">
            ทีมผู้บริหารที่มีวิสัยทัศน์และความมุ่งมั่นในการพัฒนาการศึกษาให้ก้าวหน้า
          </p>
        </div>

        {/* Administrators Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {administrators.map((admin, index) => (
            <div
              key={admin.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border"
            >
              {/* Avatar */}
              <div className={`h-48 bg-gradient-to-br ${colorPalette[index % colorPalette.length]} relative flex items-center justify-center`}>
                {admin.photo_url ? (
                  <img
                    src={admin.photo_url}
                    alt={admin.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-card/50"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center border-4 border-card/50">
                    <span className="text-4xl font-bold text-card">
                      {admin.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <h3 className="text-lg font-bold text-foreground mb-1">{admin.name}</h3>
                <p className="text-accent font-medium mb-2">{admin.position}</p>
                {admin.education && (
                  <p className="text-sm text-muted-foreground mb-4">{admin.education}</p>
                )}
                {admin.quote && (
                  <blockquote className="text-sm text-muted-foreground italic border-l-2 border-accent pl-3 text-left">
                    "{admin.quote}"
                  </blockquote>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="mt-16 bg-primary rounded-3xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold text-primary-foreground mb-2">ติดต่อฝ่ายบริหาร</h3>
              <p className="text-primary-foreground/80">พร้อมรับฟังข้อเสนอแนะและให้ความช่วยเหลือ</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`tel:${settings.contact_phone}`}
                className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors"
              >
                <Phone className="w-5 h-5" />
                {settings.contact_phone}
              </a>
              <a
                href={`mailto:${settings.contact_email}`}
                className="inline-flex items-center gap-3 bg-primary-foreground/10 text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary-foreground/20 transition-colors border border-primary-foreground/20"
              >
                <Mail className="w-5 h-5" />
                อีเมล
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdministratorsSection;

