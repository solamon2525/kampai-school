import { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Calendar, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { MasonryPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/masonry.css';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import { SEOHead } from '@/components/SEOHead';

interface Album {
  id: string;
  name: string;
  category: string | null;
  date: string;
  cover_image_url: string | null;
  description: string | null;
  photos: Photo[];
}

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

const categoryColors: Record<string, string> = {
  'กีฬาสี': 'bg-blue-500',
  'วันสำคัญ': 'bg-green-500',
  'ศึกษาดูงาน': 'bg-accent',
  'กิจกรรมวิชาการ': 'bg-orange-500',
  'พิธีการ': 'bg-red-500',
};

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [categories, setCategories] = useState<string[]>(['ทั้งหมด']);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const { data: albumsData, error: albumsError } = await supabase
        .from('gallery_albums' as any)
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (albumsError) throw albumsError;

      const albumsWithPhotos = await Promise.all(
        (albumsData || []).map(async (album: any) => {
          const { data: photos } = await supabase
            .from('gallery_photos' as any)
            .select('*')
            .eq('album_id', album.id)
            .order('sort_order');

          return {
            id: album.id,
            name: album.name,
            category: album.category,
            date: format(new Date(album.created_at), 'dd MMMM yyyy', { locale: th }),
            cover_image_url: album.cover_image_url || ((photos as any)?.[0]?.image_url) || null,
            description: album.description,
            photos: (photos as any[]) || [],
          };
        })
      );

      setAlbums(albumsWithPhotos);

      const uniqueCategories = Array.from(
        new Set((albumsData as any[])?.map((a) => a.category).filter(Boolean))
      ) as string[];
      setCategories(['ทั้งหมด', ...uniqueCategories]);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlbums =
    selectedCategory === 'ทั้งหมด'
      ? albums
      : albums.filter((album) => album.category === selectedCategory);

  const handleAlbumClick = (album: Album) => {
    if (album.photos.length > 0) {
      setSelectedAlbum(album);
    }
  };

  // Album view
  if (selectedAlbum) {
    const albumPhotos = selectedAlbum.photos.map((p) => ({
      src: p.image_url,
      width: 4,
      height: 3,
      alt: p.caption || '',
    }));

    const slides = selectedAlbum.photos.map((p) => ({
      src: p.image_url,
      title: selectedAlbum.name,
      description: p.caption || '',
    }));

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div className="max-w-7xl mx-auto w-full bg-background flex-grow flex flex-col">
        <main className="flex-grow container mx-auto px-4 py-6">
          {/* Back button + album title */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setSelectedAlbum(null)}
              className="flex items-center gap-2 text-primary font-semibold hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5" />
              กลับรายการอัลบั้ม
            </button>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-4">{selectedAlbum.name}</h2>

          {/* Masonry photo grid */}
          <MasonryPhotoAlbum
            photos={albumPhotos}
            onClick={({ index }) => setLightboxIndex(index)}
          />

          {/* Lightbox */}
          <Lightbox
            open={lightboxIndex >= 0}
            index={lightboxIndex}
            close={() => setLightboxIndex(-1)}
            slides={slides}
            plugins={[Thumbnails, Captions, Fullscreen]}
          />
        </main>
        <Footer />
        </div>
      </div>
    );
  }

  // Album list view
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="แกลเลอรี่" description="ภาพกิจกรรมและบรรยากาศโรงเรียน" />
      <SiteHeader />
      <div className="max-w-7xl mx-auto w-full bg-background flex-grow flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-4 text-primary">คลังภาพกิจกรรม</h1>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 text-base ${selectedCategory === category ? categoryColors[category] || 'bg-primary' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg shadow-md overflow-hidden animate-pulse h-64"></div>
            ))}
          </div>
        ) : filteredAlbums.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg">ไม่พบอัลบั้มในหมวดหมู่นี้</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAlbums.map((album) => (
              <div
                key={album.id}
                className="bg-card rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 group relative"
                onClick={() => handleAlbumClick(album)}
              >
                <div className="relative w-full h-48 overflow-hidden">
                  {album.cover_image_url ? (
                    <img
                      src={album.cover_image_url}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <h3 className="text-lg font-semibold text-white">{album.name}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{album.name}</h3>
                  {album.category && (
                    <Badge className={`mb-2 ${categoryColors[album.category] || 'bg-gray-500'}`}>
                      {album.category}
                    </Badge>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{album.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
      </div>
    </div>
  );
};

export default Gallery;
