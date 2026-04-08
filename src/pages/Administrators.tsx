import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdministratorsSection from '@/components/AdministratorsSection';

const Administrators = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <AdministratorsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Administrators;
