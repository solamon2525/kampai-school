import { SEOHead } from '@/components/SEOHead';
import SiteHeader from '@/components/SiteHeader';
import HomeHeaderZone from '@/components/home/HomeHeaderZone';
import { useHomeLeftBlocks } from '@/components/home/HomeLeftSidebar';
import { useHomeMainBlocks } from '@/components/home/HomeMainContent';
import { useHomeRightBlocks } from '@/components/home/HomeRightSidebar';
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

  const leftBlocksMap = useHomeLeftBlocks();
  const mainBlocksMap = useHomeMainBlocks();
  const rightBlocksMap = useHomeRightBlocks();

  const allBlocksMap = { ...leftBlocksMap, ...mainBlocksMap, ...rightBlocksMap };

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

  const renderZone = (zoneData?: { blocks: string[]; hidden: string[] }, defaultBlocks: string[] = [], className: string = "flex flex-col gap-4 w-full") => {
      const ids = zoneData ? getVisibleBlocks(zoneData) : defaultBlocks;
      return (
          <div className={className}>
              {ids.map(id => {
                  const block = allBlocksMap[id as keyof typeof allBlocksMap];
                  return block ? <div key={id}>{block}</div> : null;
              })}
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col overflow-x-hidden w-full">
      <SEOHead />
      {/* Unified Header + Nav */}
      <SiteHeader />

      {/* Header Zone (News Ticker, Banners) */}
      <HomeHeaderZone blockOrder={headerBlocks} />

      {/* 3-Column Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 py-4 overflow-x-hidden min-w-0">
        {/* Desktop: 3 columns */}
        <div className="hidden lg:grid grid-cols-[200px_1fr_240px] gap-4 items-start">
          <aside className="min-w-0 overflow-hidden">{renderZone(layout?.left, ['principal', 'menu'], 'flex flex-col gap-3 w-full')}</aside>
          <main className="min-w-0 overflow-hidden">{renderZone(layout?.main, ['hero', 'news', 'about'], 'flex flex-col gap-4 w-full')}</main>
          <aside className="min-w-0 overflow-hidden">{renderZone(layout?.right, ['categories', 'gallery', 'services', 'social', 'stats'], 'flex flex-col gap-3 w-full')}</aside>
        </div>

        {/* Mobile: stack main content + sidebars */}
        <div className="lg:hidden flex flex-col gap-4 min-w-0">
          <div className="min-w-0 overflow-hidden">{renderZone(layout?.main, ['hero', 'news', 'about'], 'flex flex-col gap-4 w-full')}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <aside className="min-w-0 overflow-hidden">{renderZone(layout?.left, ['principal', 'menu'], 'flex flex-col gap-3 w-full')}</aside>
            <aside className="min-w-0 overflow-hidden">{renderZone(layout?.right, ['categories', 'gallery', 'services', 'social', 'stats'], 'flex flex-col gap-3 w-full')}</aside>
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
