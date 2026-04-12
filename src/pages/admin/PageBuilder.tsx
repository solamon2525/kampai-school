import { useEffect, useState } from 'react';
import { Puck, type Data } from '@measured/puck';
import '@measured/puck/puck.css';
import { puckConfig } from '@/components/puck/puck-config';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const DEFAULT_DATA: Data = {
    content: [],
    root: { props: {} },
    zones: {},
};

export default function PageBuilder() {
    const [data, setData] = useState<Data>(DEFAULT_DATA);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const loadConfig = async () => {
            const { data: row } = await supabase
                .from('school_settings' as any)
                .select('value')
                .eq('key', 'page_config_home')
                .single();

            if (row?.value) {
                try {
                    setData(JSON.parse(row.value));
                } catch {
                    // use default
                }
            }
            setLoading(false);
        };
        loadConfig();
    }, []);

    const handlePublish = async (publishData: Data) => {
        const { error } = await supabase
            .from('school_settings' as any)
            .upsert({ key: 'page_config_home', value: JSON.stringify(publishData) }, { onConflict: 'key' });

        if (error) {
            toast({ title: 'บันทึกล้มเหลว', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'บันทึก Page Config สำเร็จ' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">กำลังโหลด...</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-card z-50">
                <h1 className="font-bold text-lg">Page Builder — หน้าแรก</h1>
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← กลับ Dashboard
                </button>
            </div>
            <div className="flex-1 overflow-hidden">
                <Puck
                    config={puckConfig as any}
                    data={data}
                    onPublish={handlePublish}
                />
            </div>
        </div>
    );
}
