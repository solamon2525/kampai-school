import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Download, Eye, EyeOff, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UppyUpload } from '@/components/admin/shared/UppyUpload';

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

const emptyDoc: Omit<Document, 'id' | 'download_count' | 'sort_order'> = {
  title: '',
  description: '',
  category_id: null,
  file_url: null,
  file_name: null,
  file_type: null,
  file_size: null,
  academic_year: '',
  is_published: true,
};

const emptyCategory: Omit<DocumentCategory, 'id'> = {
  name: '',
  icon: '',
  color: '#3B82F6',
  order_position: 0,
  is_active: true,
};

export const DocumentsManagement = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'categories'>('documents');

  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Dialog state
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [docForm, setDocForm] = useState<typeof emptyDoc>({ ...emptyDoc });
  // Category dialog state
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<DocumentCategory | null>(null);
  const [catForm, setCatForm] = useState<typeof emptyCategory>({ ...emptyCategory });

  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchDocuments();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('document_categories' as any)
      .select('*')
      .order('order_position', { ascending: true });
    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } else {
      setCategories((data as DocumentCategory[]) || []);
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('documents' as any)
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } else {
      setDocuments((data as Document[]) || []);
    }
    setIsLoading(false);
  };

  const openAddDoc = () => {
    setEditingDoc(null);
    setDocForm({ ...emptyDoc });
    setShowDocDialog(true);
  };

  const openEditDoc = (doc: Document) => {
    setEditingDoc(doc);
    setDocForm({
      title: doc.title,
      description: doc.description,
      category_id: doc.category_id,
      file_url: doc.file_url,
      file_name: doc.file_name,
      file_type: doc.file_type,
      file_size: doc.file_size,
      academic_year: doc.academic_year,
      is_published: doc.is_published,
    });
    setShowDocDialog(true);
  };

  const saveDocument = async () => {
    if (!docForm.title.trim()) {
      toast({ title: 'กรุณากรอกชื่อเอกสาร', variant: 'destructive' });
      return;
    }
    try {
      if (editingDoc) {
        const { error } = await supabase
          .from('documents' as any)
          .update(docForm)
          .eq('id', editingDoc.id);
        if (error) throw error;
        toast({ title: 'แก้ไขเอกสารสำเร็จ' });
      } else {
        const { error } = await supabase
          .from('documents' as any)
          .insert([{ ...docForm, download_count: 0, sort_order: documents.length }]);
        if (error) throw error;
        toast({ title: 'เพิ่มเอกสารสำเร็จ' });
      }
      setShowDocDialog(false);
      fetchDocuments();
    } catch (error: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('ต้องการลบเอกสารนี้ใช่หรือไม่?')) return;
    const { error } = await supabase.from('documents' as any).delete().eq('id', id);
    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบเอกสารสำเร็จ' });
      fetchDocuments();
    }
  };

  const togglePublished = async (doc: Document) => {
    const { error } = await supabase
      .from('documents' as any)
      .update({ is_published: !doc.is_published })
      .eq('id', doc.id);
    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } else {
      fetchDocuments();
    }
  };

  const openAddCat = () => {
    setEditingCat(null);
    setCatForm({ ...emptyCategory });
    setShowCatDialog(true);
  };

  const openEditCat = (cat: DocumentCategory) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      order_position: cat.order_position,
      is_active: cat.is_active,
    });
    setShowCatDialog(true);
  };

  const saveCategory = async () => {
    if (!catForm.name.trim()) {
      toast({ title: 'กรุณากรอกชื่อหมวดหมู่', variant: 'destructive' });
      return;
    }
    try {
      if (editingCat) {
        const { error } = await supabase
          .from('document_categories' as any)
          .update(catForm)
          .eq('id', editingCat.id);
        if (error) throw error;
        toast({ title: 'แก้ไขหมวดหมู่สำเร็จ' });
      } else {
        const { error } = await supabase
          .from('document_categories' as any)
          .insert([{ ...catForm, order_position: categories.length }]);
        if (error) throw error;
        toast({ title: 'เพิ่มหมวดหมู่สำเร็จ' });
      }
      setShowCatDialog(false);
      fetchCategories();
    } catch (error: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('ต้องการลบหมวดหมู่นี้ใช่หรือไม่?')) return;
    const { error } = await supabase.from('document_categories' as any).delete().eq('id', id);
    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบหมวดหมู่สำเร็จ' });
      fetchCategories();
    }
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return '-';
    return categories.find((c) => c.id === id)?.name || '-';
  };

  const getCategoryColor = (id: string | null) => {
    if (!id) return '#6B7280';
    return categories.find((c) => c.id === id)?.color || '#6B7280';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || doc.category_id === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">จัดการเอกสาร</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'documents'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          เอกสารทั้งหมด
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          หมวดหมู่
        </button>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาเอกสาร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="all">ทุกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={openAddDoc}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มเอกสาร
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  กำลังโหลด...
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3 opacity-30" />
                  <p>ไม่พบเอกสาร</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/30">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ชื่อเอกสาร</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">หมวดหมู่</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ประเภทไฟล์</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ปีการศึกษา</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ดาวน์โหลด</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">สถานะ</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-sm">{doc.title}</p>
                              {doc.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doc.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {doc.category_id ? (
                              <Badge
                                style={{ backgroundColor: getCategoryColor(doc.category_id), color: '#fff' }}
                                className="text-xs"
                              >
                                {getCategoryName(doc.category_id)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {doc.file_type ? (
                              <Badge variant="outline" className="text-xs uppercase">
                                {doc.file_type}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">{doc.academic_year || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Download className="h-3.5 w-3.5" />
                              {doc.download_count}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => togglePublished(doc)}
                              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                                doc.is_published
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {doc.is_published ? (
                                <><Eye className="h-3 w-3" />เผยแพร่</>
                              ) : (
                                <><EyeOff className="h-3 w-3" />ซ่อน</>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditDoc(doc)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddCat}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มหมวดหมู่
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-12 text-muted-foreground">
                ยังไม่มีหมวดหมู่
              </div>
            ) : (
              categories.map((cat) => (
                <Card key={cat.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                          style={{ backgroundColor: cat.color || '#3B82F6' }}
                        >
                          {cat.icon || cat.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">ลำดับ: {cat.order_position}</p>
                          <Badge variant={cat.is_active ? 'default' : 'secondary'} className="mt-1 text-xs">
                            {cat.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditCat(cat)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteCategory(cat.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Document Dialog */}
      <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoc ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสาร'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="doc-title">ชื่อเอกสาร *</Label>
              <Input
                id="doc-title"
                value={docForm.title}
                onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="ชื่อเอกสาร"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="doc-desc">คำอธิบาย</Label>
              <textarea
                id="doc-desc"
                value={docForm.description || ''}
                onChange={(e) => setDocForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="คำอธิบายเอกสาร"
                rows={3}
                className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <Label htmlFor="doc-cat">หมวดหมู่</Label>
              <select
                id="doc-cat"
                value={docForm.category_id || ''}
                onChange={(e) => setDocForm((p) => ({ ...p, category_id: e.target.value || null }))}
                className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="doc-year">ปีการศึกษา</Label>
              <Input
                id="doc-year"
                value={docForm.academic_year || ''}
                onChange={(e) => setDocForm((p) => ({ ...p, academic_year: e.target.value }))}
                placeholder="เช่น 2567"
                className="mt-1"
              />
            </div>
            <div>
              <Label>ไฟล์เอกสาร</Label>
              {docForm.file_name ? (
                <div className="mt-1 flex items-center gap-3 p-3 border rounded-lg bg-secondary/50">
                  <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{docForm.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(docForm.file_size)}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setDocForm(p => ({ ...p, file_url: null, file_name: null, file_type: null, file_size: null }))}>
                    เปลี่ยนไฟล์
                  </Button>
                </div>
              ) : (
                <div className="mt-1">
                  <UppyUpload
                    bucket="school-documents"
                    folder="documents"
                    accept={['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']}
                    maxFiles={1}
                    maxFileSizeMB={50}
                    onUploadComplete={(files) => {
                      if (files[0]) {
                        setDocForm(p => ({
                          ...p,
                          file_url: files[0].url,
                          file_name: files[0].name,
                          file_type: files[0].type,
                          file_size: files[0].size,
                        }));
                      }
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="doc-published"
                checked={docForm.is_published}
                onChange={(e) => setDocForm((p) => ({ ...p, is_published: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="doc-published" className="cursor-pointer">เผยแพร่เอกสาร</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={saveDocument} disabled={uploading} className="flex-1">
                {editingDoc ? 'บันทึกการแก้ไข' : 'เพิ่มเอกสาร'}
              </Button>
              <Button variant="outline" onClick={() => setShowDocDialog(false)} className="flex-1">
                ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="cat-name">ชื่อหมวดหมู่ *</Label>
              <Input
                id="cat-name"
                value={catForm.name}
                onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="ชื่อหมวดหมู่"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cat-icon">ไอคอน (Emoji หรือข้อความ)</Label>
              <Input
                id="cat-icon"
                value={catForm.icon || ''}
                onChange={(e) => setCatForm((p) => ({ ...p, icon: e.target.value }))}
                placeholder="เช่น 📄 หรือ F"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cat-color">สี</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  id="cat-color"
                  value={catForm.color || '#3B82F6'}
                  onChange={(e) => setCatForm((p) => ({ ...p, color: e.target.value }))}
                  className="h-9 w-16 rounded border border-input cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{catForm.color}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="cat-order">ลำดับ</Label>
              <Input
                id="cat-order"
                type="number"
                value={catForm.order_position}
                onChange={(e) => setCatForm((p) => ({ ...p, order_position: Number(e.target.value) }))}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="cat-active"
                checked={catForm.is_active}
                onChange={(e) => setCatForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="cat-active" className="cursor-pointer">เปิดใช้งาน</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={saveCategory} className="flex-1">
                {editingCat ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
              </Button>
              <Button variant="outline" onClick={() => setShowCatDialog(false)} className="flex-1">
                ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
