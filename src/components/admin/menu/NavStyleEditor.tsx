import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    type NavStyle, FONT_WEIGHT_OPTIONS, FONT_SIZE_OPTIONS,
} from '@/lib/menuDefaults';

interface Props {
    style: NavStyle;
    onChange: (next: NavStyle) => void;
}

interface ColorRowProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    helper?: string;
}

const ColorRow = ({ label, value, onChange, helper }: ColorRowProps) => {
    // For non-hex (e.g. "transparent" or rgba) the native picker can't display
    // — show a fallback swatch. Pickers only work with #RRGGBB.
    const isHex = /^#[0-9A-Fa-f]{6}$/.test(value);

    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium">{label}</Label>
            <div className="flex items-center gap-2">
                {isHex ? (
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-10 h-9 rounded border border-border cursor-pointer flex-shrink-0"
                        aria-label={`${label} color picker`}
                    />
                ) : (
                    <div
                        className="w-10 h-9 rounded border border-border flex-shrink-0"
                        style={{ background: value }}
                        title={value}
                    />
                )}
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#157F3C หรือ rgba(...)"
                    className="font-mono text-xs"
                />
            </div>
            {helper && <p className="text-[11px] text-muted-foreground">{helper}</p>}
        </div>
    );
};

export const NavStyleEditor = ({ style, onChange }: Props) => {
    const update = (patch: Partial<NavStyle>) => onChange({ ...style, ...patch });

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold">สีและฟอนต์ของแถบเมนู</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ColorRow
                    label="พื้นหลังแถบเมนู"
                    value={style.navBg}
                    onChange={(v) => update({ navBg: v })}
                    helper="สีพื้นหลักของ navbar"
                />
                <ColorRow
                    label="สีตัวอักษร"
                    value={style.navText}
                    onChange={(v) => update({ navText: v })}
                />
                <ColorRow
                    label="สีตัวอักษรตอน active"
                    value={style.navTextActive}
                    onChange={(v) => update({ navTextActive: v })}
                    helper="เมื่อผู้ใช้อยู่หน้านั้นๆ"
                />
                <ColorRow
                    label="สีพื้นตอน active"
                    value={style.navBgActive}
                    onChange={(v) => update({ navBgActive: v })}
                    helper="ใช้ rgba(...) เพื่อโปร่งใส"
                />
                <ColorRow
                    label="สีพื้น hover"
                    value={style.navHoverBg}
                    onChange={(v) => update({ navHoverBg: v })}
                />
                <ColorRow
                    label="สีตัวอักษร hover"
                    value={style.navHoverText}
                    onChange={(v) => update({ navHoverText: v })}
                />
                <ColorRow
                    label="ขอบล่าง active"
                    value={style.borderActive}
                    onChange={(v) => update({ borderActive: v })}
                    helper="ใช้ 'transparent' เพื่อซ่อน"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">น้ำหนักฟอนต์</Label>
                    <Select value={style.fontWeight} onValueChange={(v) => update({ fontWeight: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {FONT_WEIGHT_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">ขนาดฟอนต์</Label>
                    <Select value={style.fontSize} onValueChange={(v) => update({ fontSize: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {FONT_SIZE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};

export default NavStyleEditor;
