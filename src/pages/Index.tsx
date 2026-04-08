import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import CurriculumSection from '@/components/CurriculumSection';
import NewsSection from '@/components/NewsSection';
import AdministratorsSection from '@/components/AdministratorsSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <CurriculumSection />
        <NewsSection />
        <AdministratorsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
