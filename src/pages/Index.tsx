import { SEOHead } from '@/components/SEOHead';
import SiteHeader from '@/components/SiteHeader';
import HomeHeaderZone from '@/components/home/HomeHeaderZone';
import HomeLeftSidebar from '@/components/home/HomeLeftSidebar';
import HomeMainContent from '@/components/home/HomeMainContent';
import HomeRightSidebar from '@/components/home/HomeRightSidebar';
import HomeFooterZone from '@/components/home/HomeFooterZone';
import Footer from '@/components/Footer';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

interface HomepageLayout {
  header?: { blocks: string[]; hidden: string[] };
  left?: { blocks: string[]; hidden: string[] };
  main?: { blocks: string[]; hidden: string[] };
  right?: { blocks: string[]; hidden: string[] };
  footer?: { blocks: string[]; hidden: string[] };
}

const getVisibleBlocks = (zone?: { blocks: string[]; hidden: string[] }): string[] => {
  if (!zone) return [];
  return zone.blocks.filter((id) => !zone.hidden.includes(id));
};

const Index = () => {
  const { settings } = useSchoolSettings();

  // Parse homepage layout from settings
  let layout: HomepageLayout | null = null;
  if (settings.homepage_layout_raw) {
    try { layout = JSON.parse(settings.homepage_layout_raw); } catch { /* fallback */ }
  }

  // Header zone blocks
  const headerBlocks = layout ? getVisibleBlocks(layout.header) : ['news_ticker'];
  // Footer zone blocks
  const footerBlocks = layout ? getVisibleBlocks(layout.footer) : [];
  const useCustomFooter = footerBlocks.length > 0;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <SEOHead />
      {/* Unified Header + Nav */}
      <SiteHeader />

      {/* Header Zone (News Ticker, Banners) */}
      <HomeHeaderZone blockOrder={headerBlocks} />

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

      {/* Footer — use custom footer zone if configured, otherwise default */}
      {useCustomFooter ? (
        <HomeFooterZone blockOrder={footerBlocks} />
      ) : (
        <Footer />
      )}
    </div>
  );
};

export default Index;
