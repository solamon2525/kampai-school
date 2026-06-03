import 'leaflet/dist/leaflet.css';
import { useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { Video, MapPin, Camera, ShieldAlert } from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { TEACHER_MENU } from './TeacherDashboard';
import { cctvService, type CctvCamera } from '@/services/cctv.service';
import { CctvPlayer } from '@/components/portal/CctvPlayer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ศูนย์กลางแผนที่ default (อ.เมือง อุดรธานี) — ใช้เมื่อกล้องยังไม่มีพิกัด
const DEFAULT_CENTER: [number, number] = [17.4138, 102.787];

/** หมุดกล้องแบบ divIcon (ใช้ CSS var ตามธีม — ไม่ hardcode hex) */
const makeCameraIcon = (active: boolean) =>
  L.divIcon({
    className: 'cctv-marker',
    html: `<div style="
        width:30px;height:30px;border-radius:9999px;
        display:flex;align-items:center;justify-content:center;
        background:${active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'};
        color:hsl(var(--primary-foreground));
        box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid hsl(var(--card));">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/>
          <rect x="2" y="6" width="14" height="12" rx="2"/>
        </svg>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

/** ปรับ map ให้ครอบทุกกล้องเมื่อรายการเปลี่ยน */
const FitToCameras = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useMemo(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 16);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 17 });
    }
  }, [points, map]);
  return null;
};

export default function TeacherCctv() {
  const [selected, setSelected] = useState<CctvCamera | null>(null);

  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ['cctv-cameras'],
    queryFn: cctvService.listCameras,
  });

  const points = useMemo(
    () =>
      cameras
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => [c.lat as number, c.lng as number] as [number, number]),
    [cameras],
  );

  const center = points[0] ?? DEFAULT_CENTER;

  return (
    <RolePortalLayout title="กล้องวงจรปิด" subtitle="ครู/บุคลากร" menu={TEACHER_MENU} accent="teacher">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Video className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">กล้องวงจรปิดโรงเรียน</h1>
          <span className="text-xs text-muted-foreground">({cameras.length} ตัว)</span>
        </div>

        {/* แจ้งเตือนความเป็นส่วนตัว */}
        <div className="flex items-start gap-2 mb-3 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <ShieldAlert className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span>ภาพกล้องสำหรับครู/บุคลากรเท่านั้น ห้ามเผยแพร่หรือบันทึกหน้าจอเพื่อความเป็นส่วนตัวของนักเรียน (PDPA)</span>
        </div>

        {cameras.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium">ยังไม่มีกล้องในระบบ</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                ผู้ดูแลระบบต้องเพิ่มกล้อง (ชื่อ พิกัด และ HLS URL จาก relay) ก่อนจึงจะแสดงที่นี่
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* แผนที่ */}
            <div className="lg:col-span-8 rounded-lg overflow-hidden border border-border" style={{ height: '70vh' }}>
              <MapContainer center={center} zoom={16} className="w-full h-full" style={{ background: 'hsl(var(--muted))' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitToCameras points={points} />
                {cameras
                  .filter((c) => c.lat != null && c.lng != null)
                  .map((c) => (
                    <Marker
                      key={c.id}
                      position={[c.lat as number, c.lng as number]}
                      icon={makeCameraIcon(selected?.id === c.id)}
                      eventHandlers={{ click: () => setSelected(c) }}
                    />
                  ))}
              </MapContainer>
            </div>

            {/* รายชื่อกล้อง */}
            <div className="lg:col-span-4 rounded-lg border border-border bg-card overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>
              <div className="px-3 py-2 border-b border-border">
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  <Camera className="w-4 h-4" /> รายชื่อกล้อง
                </h2>
              </div>
              <ul className="flex-1 overflow-y-auto divide-y divide-border">
                {cameras.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelected(c)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-secondary',
                        selected?.id === c.id && 'bg-secondary',
                      )}
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-primary" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium truncate">{c.name}</span>
                        {c.location_label && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <MapPin className="w-3 h-3" /> {c.location_label}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* โมดอลดูภาพสด */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Video className="w-4 h-4 text-primary" />
              {selected?.name}
              {selected?.location_label && (
                <span className="text-xs font-normal text-muted-foreground">· {selected.location_label}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && <CctvPlayer src={selected.hls_url} />}
        </DialogContent>
      </Dialog>
    </RolePortalLayout>
  );
}
