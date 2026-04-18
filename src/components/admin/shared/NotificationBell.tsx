import { useNavigate } from 'react-router-dom';
import { Bell, FileText, Mail, UserX, Info, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, type NotificationType } from '@/hooks/useNotifications';

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

const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60_000);
    if (min < 1) return 'เมื่อครู่';
    if (min < 60) return `${min} นาทีที่แล้ว`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} ชม. ที่แล้ว`;
    const day = Math.floor(hour / 24);
    if (day < 7) return `${day} วันที่แล้ว`;
    return new Date(iso).toLocaleDateString('th-TH');
};

export const NotificationBell = () => {
    const navigate = useNavigate();
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications(20);

    const handleClick = (id: string, link: string | null) => {
        markRead(id);
        if (link) navigate(link);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-3 border-b">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">การแจ้งเตือน</h3>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                                {unreadCount} ใหม่
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead()}>
                            <CheckCheck className="w-3.5 h-3.5 mr-1" />
                            อ่านแล้วทั้งหมด
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            ไม่มีการแจ้งเตือน
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {notifications.map((n) => {
                                const Icon = ICONS[n.type] || Info;
                                const color = COLORS[n.type] || COLORS.general;
                                return (
                                    <li key={n.id}>
                                        <button
                                            onClick={() => handleClick(n.id, n.link)}
                                            className={`w-full text-left p-3 hover:bg-secondary transition-colors flex gap-3 ${
                                                !n.read_at ? 'bg-primary/5' : ''
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium leading-tight">{n.title}</p>
                                                {n.body && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground mt-1">{formatTime(n.created_at)}</p>
                                            </div>
                                            {!n.read_at && (
                                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </ScrollArea>
                <div className="p-2 border-t">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => navigate('/admin/dashboard/notifications')}
                    >
                        ดูทั้งหมด
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
