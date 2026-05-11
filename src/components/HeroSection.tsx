import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Play, Users, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';
import heroImageFallback from '@/assets/hero-school.jpg';
import { useNavigate } from 'react-router-dom';

type ImageFit = 'cover' | 'contain';

interface HeroSlide {
  id: string;
  image_url: string;
  title: string | null;
  order_position: number;
  image_fit: string;
}

const HeroSection = () => {
  const { settings } = useSchoolSettings();
  const navigate = useNavigate();
  const [slides, setSlides] = useState<{ url: string; title: string; fit: ImageFit }[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stats = [
    { icon: Users, value: settings.stat_students, label: settings.stat_students_label },
    { icon: Award, value: settings.stat_university, label: settings.stat_university_label },
    { icon: BookOpen, value: settings.stat_years, label: settings.stat_years_label },
  ];

  // Fetch hero_slides from DB
  useEffect(() => {
    supabase
      .from('hero_slides')
      .select('id, image_url, title, order_position, image_fit')
      .eq('is_active', true)
      .order('order_position', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSlides((data as HeroSlide[]).map(s => ({
            url: s.image_url,
            title: s.title || '',
            fit: (s.image_fit === 'contain' ? 'contain' : 'cover') as ImageFit,
          })));
        } else {
          const fallbackUrl = settings.hero_image_url || heroImageFallback;
          setSlides([{ url: fallbackUrl, title: settings.school_name, fit: 'cover' }]);
        }
      });
  }, [settings.hero_image_url, settings.school_name]);

  const interval = Number(settings.hero_slide_interval || 5) * 1000;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length < 2) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide(p => (p + 1) % slides.length);
    }, interval);
  }, [slides.length, interval]);

  useEffect(() => {
    if (!paused) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, startTimer]);

  const prevSlide = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentSlide(p => (p - 1 + slides.length) % slides.length);
    if (!paused) startTimer();
  };

  const nextSlide = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentSlide(p => (p + 1) % slides.length);
    if (!paused) startTimer();
  };

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            {slide.fit === 'contain' ? (
              <>
                <img
                  src={slide.url}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
                />
                <img
                  src={slide.url}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </>
            ) : (
              <img
                src={slide.url}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/95 via-navy/80 to-navy/60" />
      </div>

      {/* Prev/Next Buttons */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="ภาพก่อนหน้า"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="ภาพถัดไป"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 container-school py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-full px-4 py-2 mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-accent text-sm font-medium">{settings.hero_badge}</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-card leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {settings.hero_title_1}
            <br />
            <span className="text-accent">{settings.hero_title_2}</span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-card/80 mb-8 max-w-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {settings.school_description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button
              onClick={() => navigate('/enrollment')}
              size="lg"
              className="bg-accent text-accent-foreground font-semibold hover:bg-accent/90 gap-2 h-14 px-8"
            >
              สมัครเรียน
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => scrollToSection('#about')}
              size="lg"
              variant="heroOutline"
              className="gap-2 h-14 px-8"
            >
              <Play className="w-5 h-5" />
              เรียนรู้เพิ่มเติม
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg animate-fade-in" style={{ animationDelay: '0.5s' }}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-6 h-6 text-accent mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-card">{stat.value}</div>
                <div className="text-sm text-card/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-white w-6 h-2.5' : 'bg-white/50 w-2.5 h-2.5'}`}
              aria-label={`ไปยังภาพที่ ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-8 h-12 border-2 border-card/30 rounded-full flex items-start justify-center pt-2">
          <div className="w-1.5 h-3 bg-card/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
