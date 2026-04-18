import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, FileText, Mail, UserX, Info, CheckCheck, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications, type NotificationType } from '@/hooks/useNotifications';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const ICONS: Record<NotificationType, React.ElementType> = {
    admission: FileText,
    message: Mail,
    leave: UserX,
    general: Info,
};

const COLORS: Record<NotificationType, string> = {
    admission: 'text-emerald-600 bg-emerald-50',
    message: 'text-blue-600 bg-blue-50',
    leave: 'text-amber-600 bg-amber-50',
    general: 'text-muted-foreground bg-secondary',
};

export const NotificationsManagement = () => {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications(100);

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('notifications' as any).delete().eq('id', id);
        if (error) {
            toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
        } else {
            qc.invalidateQueries({ queryKey: ['notifications'] });
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                        <Bell className="w-7 h-7" />
                        การแจ้งเตือน
                    </h1>
                    <p className="text-muted-foreground">
                        {unreadCount > 0 ? `${unreadCount} รายการใหม่` : 'ไม่มีรายการใหม่'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={() => markAllRead()}>
                        <CheckCheck className="w-4 h-4 mr-2" />
                        อ่านแล้วทั้งหมด
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>ยังไม่มีการแจ้งเตือน</p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {notifications.map((n) => {
                                const Icon = ICONS[n.type] || Info;
                                const color = COLORS[n.type] || COLORS.general;
                                return (
                                    <li
                                        key={n.id}
                                        className={`flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors ${
                                            !n.read_at ? 'bg-primary/5' : ''
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium">{n.title}</h3>
                                                {!n.read_at && <Badge variant="default" className="text-[10px] h-5">ใหม่</Badge>}
                                            </div>
                                            {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {new Date(n.created_at).toLocaleString('th-TH')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {n.link && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        markRead(n.id);
                                                        navigate(n.link!);
                                                    }}
                                                >
                                                    ดู
                                                </Button>
                                            )}
                                            {!n.read_at && (
                                                <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                                                    <CheckCheck className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive"
                                                onClick={() => handleDelete(n.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
