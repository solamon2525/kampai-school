import { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Search, Download, FileText, FileSpreadsheet, FileImage, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';

interface DocumentCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  order_position: number;
  is_active: boolean;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  academic_year: string | null;
  is_published: boolean;
  download_count: number;
  sort_order: number;
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return <File className="h-8 w-8 text-gray-400" />;
  const type = fileType.toLowerCase();
  if (type === 'pdf') return <FileText className="h-8 w-8 text-red-500" />;
  if (['xls', 'xlsx'].includes(type)) return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
  if (['doc', 'docx'].includes(type)) return <FileText className="h-8 w-8 text-blue-600" />;
  if (['ppt', 'pptx'].includes(type)) return <FileImage className="h-8 w-8 text-orange-500" />;
  return <File className="h-8 w-8 text-gray-400" />;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Documents = () => {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCategories();
    fetchDocuments();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('document_categories' as any)
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true });
    setCategories((data as DocumentCategory[]) || []);
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('documents' as any)
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    setDocuments((data as Document[]) || []);
    setIsLoading(false);
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.file_url) {
      toast({ title: 'ไม่พบไฟล์เอกสาร', variant: 'destructive' });
      return;
    }
    // Increment download count
    await supabase
      .from('documents' as any)
      .update({ download_count: doc.download_count + 1 })
      .eq('id', doc.id);
    // Update local state optimistically
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, download_count: d.download_count + 1 } : d))
    );
    window.open(doc.file_url, '_blank');
  };

  const getCategoryById = (id: string | null) => {
    if (!id) return null;
    return categories.find((c) => c.id === id) || null;
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchCat = selectedCategory === 'all' || doc.category_id === selectedCategory;
    const matchSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="เอกสาร" description="เอกสารและแบบฟอร์มสำหรับดาวน์โหลด" />
      <SiteHeader />

      {/* Hero Section */}
      <section className="bg-primary py-2 md:py-6 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
            เอกสารและแบบฟอร์ม
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            ดาวน์โหลดเอกสาร แบบฟอร์ม และเอกสารสำคัญต่าง ๆ ของโรงเรียน
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="bg-background border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                ทั้งหมด
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  style={
                    selectedCategory === cat.id
                      ? { backgroundColor: cat.color || '#3B82F6' }
                      : {}
                  }
                >
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาเอกสาร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Documents Grid */}
      <main className="flex-1 container mx-auto px-4 py-4 md:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            กำลังโหลดเอกสาร...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <FileText className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg">ไม่พบเอกสารที่ต้องการ</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-sm text-primary hover:underline"
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const category = getCategoryById(doc.category_id);
              return (
                <Card key={doc.id} className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 p-3 bg-muted rounded-lg group-hover:bg-muted/70 transition-colors">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
                          {doc.title}
                        </h3>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {category && (
                        <Badge
                          style={{ backgroundColor: category.color || '#3B82F6', color: '#fff' }}
                          className="text-xs"
                        >
                          {category.icon && <span className="mr-1">{category.icon}</span>}
                          {category.name}
                        </Badge>
                      )}
                      {doc.file_type && (
                        <Badge variant="outline" className="text-xs uppercase">
                          {doc.file_type}
                        </Badge>
                      )}
                      {doc.academic_year && (
                        <Badge variant="secondary" className="text-xs">
                          ปีการศึกษา {doc.academic_year}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {doc.download_count} ครั้ง
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        disabled={!doc.file_url}
                        className="flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        ดาวน์โหลด
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Documents;
