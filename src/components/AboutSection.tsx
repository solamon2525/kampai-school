import { Target, Eye, Heart, Star } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const AboutSection = () => {
  const { settings } = useSchoolSettings();

  const features = [
    {
      icon: Target,
      title: 'วิสัยทัศน์',
      description: settings.school_vision,
    },
    {
      icon: Eye,
      title: 'พันธกิจ',
      description: settings.school_mission,
    },
    {
      icon: Heart,
      title: 'ค่านิยม',
      description: settings.school_values,
    },
    {
      icon: Star,
      title: 'ความเป็นเลิศ',
      description: 'มุ่งมั่นสู่ความเป็นเลิศในทุกด้าน ทั้งวิชาการ กีฬา ศิลปะ และการพัฒนาบุคลิกภาพของผู้เรียน',
    },
  ];

  const aboutStats = [
    { value: settings.about_stat_1, label: settings.about_stat_1_label },
    { value: settings.about_stat_2, label: settings.about_stat_2_label },
    { value: settings.about_stat_3, label: settings.about_stat_3_label },
    { value: settings.about_stat_4, label: settings.about_stat_4_label },
  ];

  return (
    <section id="about" className="section-padding bg-background">
      <div className="container-school">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-accent font-semibold mb-4">เกี่ยวกับเรา</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {settings.about_title_1}<span className="text-primary">{settings.about_title_2}</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {settings.school_description}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-primary rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {aboutStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-accent mb-2">{stat.value}</div>
                <div className="text-primary-foreground/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

