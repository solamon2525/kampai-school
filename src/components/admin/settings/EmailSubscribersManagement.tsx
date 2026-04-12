import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Mail, Trash2 } from 'lucide-react';

interface Subscriber {
    id: string;
    email: string;
    name: string | null;
    is_active: boolean;
    subscribed_at: string;
}

export const EmailSubscribersManagement = () => {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchSubscribers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('email_subscribers' as any)
            .select('*')
            .order('subscribed_at', { ascending: false });
        setSubscribers((data as Subscriber[]) || []);
        setLoading(false);
    };

    useEffect(() => { fetchSubscribers(); }, []);

    const toggleActive = async (id: string, value: boolean) => {
        await supabase.from('email_subscribers' as any).update({ is_active: value }).eq('id', id);
        setSubscribers(prev => prev.map(s => s.id === id ? { ...s, is_active: value } : s));
    };

    const deleteSubscriber = async (id: string) => {
        if (!confirm('ลบผู้ติดตามนี้?')) return;
        await supabase.from('email_subscribers' as any).delete().eq('id', id);
        setSubscribers(prev => prev.filter(s => s.id !== id));
        toast({ title: 'ลบสำเร็จ' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    ผู้ติดตาม Email ({subscribers.filter(s => s.is_active).length} active)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-muted-foreground text-sm">กำลังโหลด...</p>
                ) : subscribers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">ยังไม่มีผู้ติดตาม</p>
                ) : (
                    <div className="space-y-2">
                        {subscribers.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-2.5 border rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">{s.email}</p>
                                    {s.name && <p className="text-xs text-muted-foreground">{s.name}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={s.is_active} onCheckedChange={v => toggleActive(s.id, v)} />
                                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => deleteSubscriber(s.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
