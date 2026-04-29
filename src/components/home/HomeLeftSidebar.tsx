import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Home, Info, Users, GraduationCap, BookOpen, Image,
  Calendar, Newspaper, Phone, FileText, Recycle, ClipboardCheck,
} from 'lucide-react';

interface Admin {
  id: string;
  name: string;
  position: string;
  photo_url: string | null;
}

const DUMMY_PRINCIPAL: Admin = {
  id: 'dummy-principal',
  name: 'นายมกรธวัช แสนสง่า',
  position: 'ผู้อำนวยการโรงเรียน',
  photo_url: null,
};

const sidebarMenu = [
  { label: 'ประวัติโรงเรียน', href: '/about', icon: Info },
  { label: 'วิสัยทัศน์ / ปรัชญา', href: '/about', icon: BookOpen },
  { label: 'บุคลากร', href: '/staff', icon: Users },
  { label: 'นักเรียน', href: '/students', icon: GraduationCap },
  { label: 'หลักสูตร', href: '/curriculum', icon: BookOpen },
  { label: 'แกลเลอรี่', href: '/gallery', icon: Image },
  { label: 'ปฏิทินกิจกรรม', href: '/calendar', icon: Calendar },
  { label: 'ข่าวสาร', href: '/news', icon: Newspaper },
  { label: 'ธนาคารขยะ', href: '/waste-bank', icon: Recycle },
  { label: 'เอกสาร/แบบฟอร์ม', href: '/documents', icon: FileText },
  { label: 'ติดต่อโรงเรียน', href: '/contact', icon: Phone },
];

export const useHomeLeftBlocks = () => {
  const [principal, setPrincipal] = useState<Admin | null>(null);

  useEffect(() => {
    supabase
      .from('administrators')
      .select('id, name, position, photo_url')
      .order('order_position', { ascending: true })
      .limit(1)
      .single()
      .then(({ data }) => {
        setPrincipal(data ? (data as Admin) : DUMMY_PRINCIPAL);
      });
  }, []);

  const principalBlock = (
    <div key="principal" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" />
        ผู้อำนวยการโรงเรียน
      </div>
      <div className="p-3 text-center">
        {principal ? (
          <>
            <div className="w-28 h-28 rounded-xl overflow-hidden mx-auto mb-3 border-2 border-primary/30">
              {principal.photo_url ? (
                <img src={principal.photo_url} alt={principal.name} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{principal.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{principal.name}</p>
            <p className="text-xs text-primary mt-0.5">{principal.position}</p>
          </>
        ) : (
          <div className="py-4">
            <div className="w-28 h-28 rounded-xl bg-gray-100 mx-auto mb-3 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded mx-auto w-3/4 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );

  const menuBlock = (
    <div key="menu" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-2">
        เมนูทาง
      </div>
      <ul className="divide-y divide-border">
        {sidebarMenu.map((item) => (
          <li key={item.href + item.label}>
            <Link
              to={item.href}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary hover:text-primary transition-colors group"
            >
              <item.icon className="w-4 h-4 text-primary group-hover:text-primary flex-shrink-0" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const blockMap: Record<string, JSX.Element> = {
    principal: principalBlock,
    menu: menuBlock,
  };

  return blockMap;
};
