import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Mail, MailOpen, Trash2, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export const MessagesManagement = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('contact_messages' as any) // Cast to any to avoid type error until types are regenerated
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages((data as any) || []);
        } catch (error: any) {
            console.error('Error fetching messages:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูลข้อความได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewMessage = async (message: ContactMessage) => {
        setSelectedMessage(message);

        // Mark as read if not already
        if (!message.is_read) {
            try {
                const { error } = await supabase
                    .from('contact_messages' as any)
                    .update({ is_read: true })
                    .eq('id', message.id);

                if (error) throw error;

                // Update local state
                setMessages(messages.map(m =>
                    m.id === message.id ? { ...m, is_read: true } : m
                ));
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }
    };

    const handleDelete = async () => {
        if (!messageToDelete) return;

        try {
            const { error } = await supabase
                .from('contact_messages' as any)
                .delete()
                .eq('id', messageToDelete);

            if (error) throw error;

            setMessages(messages.filter(m => m.id !== messageToDelete));
            toast({
                title: 'สำเร็จ',
                description: 'ลบข้อความเรียบร้อยแล้ว',
            });
            if (selectedMessage?.id === messageToDelete) {
                setSelectedMessage(null);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถลบข้อความได้',
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setMessageToDelete(null);
        }
    };

    const filteredMessages = messages.filter(message =>
        message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const unreadCount = messages.filter(m => !m.is_read).length;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        กล่องข้อความ
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full px-2">
                                {unreadCount}
                            </Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground">ข้อความจากฟอร์มติดต่อหน้าเว็บไซต์</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchMessages}>
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาตามชื่อ, หัวข้อ หรืออีเมล..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>ผู้ส่ง</TableHead>
                            <TableHead>หัวข้อ</TableHead>
                            <TableHead>วันที่ส่ง</TableHead>
                            <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    กำลังโหลด...
                                </TableCell>
                            </TableRow>
                        ) : filteredMessages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    ไม่มีข้อความ
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMessages.map((message) => (
                                <TableRow
                                    key={message.id}
                                    className={message.is_read ? 'opacity-70' : 'bg-blue-50/30 font-medium'}
                                >
                                    <TableCell>
                                        {message.is_read ? (
                                            <MailOpen className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                            <Mail className="w-4 h-4 text-blue-500" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{message.name}</span>
                                            <span className="text-xs text-muted-foreground">{message.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{message.subject}</TableCell>
                                    <TableCell>
                                        {format(new Date(message.created_at), 'dd MMM yyyy HH:mm', { locale: th })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleViewMessage(message)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    setMessageToDelete(message.id);
                                                    setIsDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View Message Dialog */}
            <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>รายละเอียดข้อความ</DialogTitle>
                    </DialogHeader>
                    {selectedMessage && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block mb-1">ผู้ส่ง</span>
                                    <span className="font-medium">{selectedMessage.name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1">อีเมล</span>
                                    <span className="font-medium">{selectedMessage.email}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1">เบอร์โทรศัพท์</span>
                                    <span className="font-medium">{selectedMessage.phone || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1">วันที่ส่ง</span>
                                    <span className="font-medium">
                                        {format(new Date(selectedMessage.created_at), 'dd MMMM yyyy HH:mm น.', { locale: th })}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <span className="text-muted-foreground block mb-2 text-sm">หัวข้อ</span>
                                <h3 className="font-semibold text-lg">{selectedMessage.subject}</h3>
                            </div>

                            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed">
                                {selectedMessage.message}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setSelectedMessage(null)}>
                            ปิด
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (selectedMessage) {
                                    setMessageToDelete(selectedMessage.id);
                                    setIsDeleteDialogOpen(true);
                                    setSelectedMessage(null);
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            ลบข้อความ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบข้อความ</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณแน่ใจหรือไม่ที่จะลบข้อความนี้? การกระทำนี้ไม่สามารถเรียกคืนได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            ยืนยันลบ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
