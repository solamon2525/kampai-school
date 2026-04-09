import SiteHeader from '@/components/SiteHeader';
import NewsTicker from '@/components/home/NewsTicker';
import HomeLeftSidebar from '@/components/home/HomeLeftSidebar';
import HomeMainContent from '@/components/home/HomeMainContent';
import HomeRightSidebar from '@/components/home/HomeRightSidebar';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Unified Header + Nav */}
      <SiteHeader />

      {/* News Ticker */}
      <NewsTicker />

      {/* 3-Column Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 py-4">
        {/* Desktop: 3 columns */}
        <div className="hidden lg:grid grid-cols-[200px_1fr_240px] gap-4 items-start">
          <HomeLeftSidebar />
          <HomeMainContent />
          <HomeRightSidebar />
        </div>

        {/* Mobile: stack main content + sidebars */}
        <div className="lg:hidden flex flex-col gap-4">
          <HomeMainContent />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <HomeLeftSidebar />
            <HomeRightSidebar />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
