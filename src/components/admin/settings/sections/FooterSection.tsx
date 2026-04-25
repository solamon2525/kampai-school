import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    settings: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

export const FooterSection = ({ settings, onChange }: Props) => (
    <Card>
        <CardHeader>
            <CardTitle>บริการออนไลน์ (Footer)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((num) => (
                <div key={num} className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor={`footer_service_${num}_name`}>ชื่อบริการ {num}</Label>
                        <Input
                            id={`footer_service_${num}_name`}
                            value={settings[`footer_service_${num}_name`] || ''}
                            onChange={(e) => onChange(`footer_service_${num}_name`, e.target.value)}
                            placeholder={`บริการที่ ${num}`}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`footer_service_${num}_url`}>ลิงก์ (URL)</Label>
                        <Input
                            id={`footer_service_${num}_url`}
                            value={settings[`footer_service_${num}_url`] || ''}
                            onChange={(e) => onChange(`footer_service_${num}_url`, e.target.value)}
                            placeholder="https://... หรือ #"
                        />
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);
