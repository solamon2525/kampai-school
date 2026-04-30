import { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { SEOHead } from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Mail, Phone, RotateCcw, LayoutGrid, List } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Administrator {
  id: string;
  name: string;
  position: string;
  education: string | null;
  quote: string | null;
  photo_url: string | null;
  order_position: number;
}

interface StaffMember {
  id: string;
  name: string;
  position: string;
  department: string | null;
  subject: string | null;
  education: string | null;
  experience: string | null;
  photo_url: string | null;
  staff_type: string;
  order_position: number;
}

interface ModalPerson {
  id: string;
  name: string;
  position: string;
  photo_url?: string | null;
  education?: string | null;
  quote?: string | null;
  subject?: string | null;
  department?: string | null;
  experience?: string | null;
}

// ── Utilities ──────────────────────────────────────────────────────────────────
function subjClass(s: string | null | undefined): string {
  const t = s || '';
  if (/คณิต/.test(t)) return 'sd-subj-math';
  if (/ภาษาไทย|ไทย/.test(t)) return 'sd-subj-thai';
  if (/วิทย/.test(t)) return 'sd-subj-sci';
  if (/สังคม/.test(t)) return 'sd-subj-social';
  if (/อังกฤษ|english/i.test(t)) return 'sd-subj-eng';
  if (/พลศึกษา|สุขศึกษา/.test(t)) return 'sd-subj-pe';
  if (/ศิลป|ดนตรี/.test(t)) return 'sd-subj-art';
  if (/คอม|เทคโน/.test(t)) return 'sd-subj-comp';
  return 'sd-subj-admin';
}

function getInitials(name: string): string {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 ? (w[0]?.[0] || '') + (w[1]?.[0] || '') : name.slice(0, 2);
}

const colsMap: Record<string, string> = {
  '1': 'grid-cols-1 max-w-sm mx-auto',
  '2': 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  '5': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

// ── CSS Injection ──────────────────────────────────────────────────────────────
const StaffDirCSS = () => (
  <style>{`
    :root {
      --sd-dk:   oklch(28% 0.10 255);
      --sd-mid:  oklch(38% 0.13 255);
      --sd-base: oklch(50% 0.16 255);
      --sd-pale: oklch(97% 0.015 255);
      --sd-acc:  oklch(78% 0.14 82);
      --sd-acc-dk: oklch(62% 0.15 82);
      --sd-shd:  0 2px 12px oklch(28% 0.08 255 / 0.12);
      --sd-shd-h:0 14px 40px oklch(28% 0.12 255 / 0.28);
      --sd-subj-math: oklch(62% 0.14 235);
      --sd-subj-thai: oklch(60% 0.16 25);
      --sd-subj-sci:  oklch(58% 0.14 155);
      --sd-subj-social: oklch(65% 0.14 60);
      --sd-subj-eng:  oklch(55% 0.17 300);
      --sd-subj-pe:   oklch(60% 0.15 145);
      --sd-subj-art:  oklch(65% 0.17 345);
      --sd-subj-comp: oklch(55% 0.14 210);
      --sd-subj-admin:oklch(50% 0.08 270);
    }
    .dark { --sd-pale: oklch(20% 0.03 255); }

    /* ── Card ─────────────────────────────────────────────── */
    .sd-card {
      background: hsl(var(--card));
      border-radius: 20px;
      box-shadow: var(--sd-shd);
      overflow: hidden;
      position: relative;
      transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s;
      width: 100%;
    }
    .sd-card:hover { transform: translateY(-8px); box-shadow: var(--sd-shd-h); }

    /* ── Card flip ── */
    .sd-card-inner {
      transform-style: preserve-3d;
      transition: transform .65s cubic-bezier(.4,.2,.2,1);
      width: 100%;
      position: relative;
    }
    .sd-card.sd-flipped .sd-card-inner { transform: rotateY(180deg); }
    .sd-card-front, .sd-card-back {
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    .sd-card-back {
      position: absolute; inset: 0;
      transform: rotateY(180deg);
      background: linear-gradient(160deg, var(--sd-dk), var(--sd-mid));
      color: #fff; padding: 20px 18px;
      display: flex; flex-direction: column; gap: 10px;
      border-radius: 20px; overflow: hidden;
    }
    .sd-card-back::before {
      content: ''; position: absolute; top: -40px; right: -40px;
      width: 120px; height: 120px;
      background: var(--sd-acc); border-radius: 50%; opacity: .18;
    }

    /* ── Photo ── */
    .sd-photo {
      position: relative; width: 100%; aspect-ratio: 4/5; overflow: hidden;
      background: linear-gradient(160deg, var(--sd-mid), var(--sd-base));
    }
    .sd-photo img {
      width: 100%; height: 100%; object-fit: cover;
      filter: grayscale(20%); transition: transform .6s, filter .4s;
    }
    .sd-card:hover .sd-photo img { transform: scale(1.06); filter: grayscale(0%); }
    .sd-photo-init {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      font-size: 4rem; font-weight: 700; color: #fff;
      background: linear-gradient(135deg, var(--sd-dk), var(--sd-base));
    }

    /* ── Photo overlay ── */
    .sd-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom,
        transparent 40%,
        oklch(12% 0.08 255 / .62) 72%,
        oklch(6% 0.10 255 / .93) 100%);
      display: flex; flex-direction: column; justify-content: flex-end;
      padding: 14px 16px; color: #fff;
      transition: opacity .3s ease;
    }
    .sd-card:hover .sd-overlay { opacity: 0; }
    .sd-ov-pos  { font-size: .76rem; opacity: .92; font-weight: 600;
      text-shadow: 0 1px 4px oklch(0% 0 0 / .9); }
    .sd-ov-name { font-size: 1.05rem; font-weight: 700; line-height: 1.25;
      text-shadow: 0 2px 6px oklch(0% 0 0 / .95); }

    /* ── Hover reveal ── */
    .sd-reveal {
      position: absolute; left: 0; right: 0; bottom: 0;
      background: linear-gradient(180deg,
        oklch(16% 0.12 255 / .80) 0%,
        oklch(9% 0.14 255 / .97) 100%);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-top: 1px solid oklch(100% 0 0 / .12);
      color: #fff; padding: 16px 16px 18px;
      transform: translateY(100%);
      transition: transform .38s cubic-bezier(.2,.8,.2,1);
      display: flex; flex-direction: column; gap: 5px;
    }
    .sd-card:not(.sd-flipped):hover .sd-reveal { transform: translateY(0); }
    .sd-reveal-name { font-size: .98rem; font-weight: 700; line-height: 1.3;
      text-shadow: 0 1px 6px oklch(0% 0 0 / .8); }
    .sd-reveal-pos  { font-size: .74rem; opacity: .80; font-weight: 500; }
    .sd-reveal-cta  { font-size: .70rem; opacity: .60; margin-top: 3px; letter-spacing: .02em; }

    /* ── Ribbon ── */
    .sd-ribbon {
      position: absolute; top: 14px; left: -6px; z-index: 3;
      background: var(--sd-acc); color: var(--sd-dk);
      font-size: .68rem; font-weight: 700; padding: 4px 12px 4px 10px;
      clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 0 100%);
      box-shadow: 0 2px 6px oklch(0% 0 0 / .18);
    }

    /* ── Subject badge ── */
    .sd-badge {
      display: inline-flex; align-items: center;
      color: #fff; font-size: .74rem; font-weight: 600;
      padding: 3px 11px; border-radius: 999px;
    }
    .sd-badge.sd-subj-math   { background: var(--sd-subj-math); }
    .sd-badge.sd-subj-thai   { background: var(--sd-subj-thai); }
    .sd-badge.sd-subj-sci    { background: var(--sd-subj-sci); }
    .sd-badge.sd-subj-social { background: var(--sd-subj-social); }
    .sd-badge.sd-subj-eng    { background: var(--sd-subj-eng); }
    .sd-badge.sd-subj-pe     { background: var(--sd-subj-pe); }
    .sd-badge.sd-subj-art    { background: var(--sd-subj-art); }
    .sd-badge.sd-subj-comp   { background: var(--sd-subj-comp); }
    .sd-badge.sd-subj-admin  { background: var(--sd-subj-admin); }

    /* ── Flip button ── */
    .sd-flip-btn {
      position: absolute; bottom: 12px; right: 12px; z-index: 10;
      width: 32px; height: 32px; border-radius: 50%; border: none;
      background: var(--sd-acc); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px oklch(0% 0 0 / .28); color: var(--sd-dk);
      opacity: 1; transition: transform .2s, background .2s, box-shadow .2s;
      font-weight: 700;
    }
    .sd-flip-btn:hover { transform: scale(1.12); box-shadow: 0 4px 14px oklch(0% 0 0 / .32); }
    .sd-card.sd-flipped .sd-flip-btn { background: var(--sd-dk); color: oklch(100% 0 0); }

    /* ── Section divider ── */
    .sd-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
    .sd-divider-line {
      flex: 1; height: 1px;
      background: linear-gradient(90deg, transparent, oklch(82% 0.02 255) 40%, oklch(82% 0.02 255) 60%, transparent);
    }
    .dark .sd-divider-line {
      background: linear-gradient(90deg, transparent, oklch(35% 0.04 255) 40%, oklch(35% 0.04 255) 60%, transparent);
    }
    .sd-sec-title {
      display: flex; align-items: center; gap: 8px; padding: 0 14px;
      font-weight: 700; font-size: 1.05rem; white-space: nowrap;
      color: var(--sd-dk);
    }
    .dark .sd-sec-title { color: oklch(88% 0.04 255); }
    .sd-sec-icon {
      width: 28px; height: 28px; border-radius: 8px;
      background: var(--sd-pale); color: var(--sd-dk);
      display: flex; align-items: center; justify-content: center;
    }
    .dark .sd-sec-icon { background: oklch(25% 0.04 255); color: oklch(80% 0.06 255); }
    .sd-cnt {
      background: var(--sd-acc); color: var(--sd-dk);
      font-size: .7rem; font-weight: 700;
      padding: 2px 9px; border-radius: 999px; margin-left: 2px;
    }

    /* ── Featured card (Director) ── */
    .sd-featured { max-width: 100% !important; aspect-ratio: auto !important; }
    .sd-featured .sd-card-inner { width: 100%; }
    .sd-featured .sd-card-front {
      display: grid !important;
      grid-template-columns: 240px 1fr !important;
      min-height: 320px;
    }
    .sd-featured .sd-card-back {
      display: flex !important;
      min-height: 320px;
    }
    .sd-featured .sd-photo { aspect-ratio: auto; height: 100%; }
    .sd-featured .sd-photo img { object-position: top; }
    @media (max-width: 600px) {
      .sd-featured .sd-card-front { grid-template-columns: 1fr !important; }
      .sd-featured .sd-photo { aspect-ratio: 4/5 !important; height: auto !important; }
    }

    /* ── Stats border ── */
    .sd-stat-sep:not(:last-child) { border-right: 1px solid hsl(var(--border)); }
    @media (max-width: 600px) {
      .sd-stat-grid { grid-template-columns: repeat(4, 1fr) !important; }
    }

    /* ── List view ── */
    .sd-list .sd-card:not(.sd-featured) {
      display: grid !important;
      grid-template-columns: 90px 1fr !important;
      max-width: 100% !important;
      border-radius: 14px;
    }
    .sd-list .sd-card:not(.sd-featured) .sd-photo {
      width: 90px; aspect-ratio: 1 !important;
      border-radius: 14px 0 0 14px;
    }
    .sd-list .sd-card:not(.sd-featured) .sd-overlay,
    .sd-list .sd-card:not(.sd-featured) .sd-reveal { display: none !important; }
    .sd-list .sd-card:not(.sd-featured):hover { transform: none; box-shadow: var(--sd-shd); }
    .sd-list .sd-card:not(.sd-featured) .sd-flip-btn { display: none; }

    /* ── Jump nav ── */
    .sd-jump-link {
      display: flex; align-items: center; justify-content: space-between;
      padding: 7px 10px; border-radius: 8px;
      color: hsl(var(--muted-foreground)); text-decoration: none; font-size: .85rem;
      transition: all .15s; margin-bottom: 2px;
    }
    .sd-jump-link:hover { background: var(--sd-pale); color: var(--sd-dk); }
    .dark .sd-jump-link:hover { background: oklch(25% 0.04 255); color: oklch(88% 0.04 255); }
    .sd-jump-link.active {
      background: var(--sd-pale); color: var(--sd-dk);
      font-weight: 600; border-left: 3px solid var(--sd-acc);
    }
    .dark .sd-jump-link.active { background: oklch(25% 0.04 255); color: oklch(88% 0.04 255); }

    /* ── Contact btn on card back ── */
    .sd-back-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 12px; border-radius: 8px;
      font-size: .78rem; font-weight: 600;
      cursor: pointer; border: none; text-decoration: none; transition: opacity .15s;
    }
    .sd-back-btn:hover { opacity: .82; }
    .sd-back-btn.phone { background: oklch(93% 0.04 255); color: var(--sd-dk); }
    .sd-back-btn.detail { background: oklch(100% 0 0 / .15); color: #fff; }
  `}</style>
);

// ── Section Divider ────────────────────────────────────────────────────────────
const SectionDivider = ({ title, count, icon }: { title: string; count: number; icon: React.ReactNode }) => (
  <div className="sd-divider">
    <span className="sd-divider-line" />
    <span className="sd-sec-title">
      <span className="sd-sec-icon">{icon}</span>
      {title}
      <span className="sd-cnt">{count}</span>
    </span>
    <span className="sd-divider-line" />
  </div>
);

// ── Photo Box ──────────────────────────────────────────────────────────────────
const PhotoBox = ({ url, name, className = '' }: { url: string | null; name: string; className?: string }) =>
  url ? (
    <img src={url} alt={name} className={className} />
  ) : (
    <div className={`sd-photo-init${className ? ' ' + className : ''}`}>{getInitials(name)}</div>
  );

// ── Featured Director Card ─────────────────────────────────────────────────────
const FeaturedCard = ({
  admin, isFlipped, onFlip, onOpenModal,
}: {
  admin: Administrator;
  isFlipped: boolean;
  onFlip: (e: React.MouseEvent) => void;
  onOpenModal: () => void;
}) => (
  <motion.div
    className={`sd-card sd-featured${isFlipped ? ' sd-flipped' : ''}`}
    initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: .45 }}
  >
    <div className="sd-card-inner" style={{ minHeight: 260 }}>
      {/* ── Front ── */}
      <div className="sd-card-front" style={{ borderRadius: 20, overflow: 'hidden' }}>
        <div className="sd-photo" onClick={onOpenModal} style={{ cursor: 'pointer' }}>
          <PhotoBox url={admin.photo_url} name={admin.name} />
          <div className="sd-ribbon">ผู้อำนวยการ</div>
          <div className="sd-overlay">
            <span className="sd-ov-pos">{admin.position}</span>
            <span className="sd-ov-name">{admin.name}</span>
          </div>
          <div className="sd-reveal">
            <span className="sd-badge sd-subj-admin">ผู้บริหาร</span>
            <span className="sd-reveal-name">{admin.name}</span>
            <span className="sd-reveal-pos">{admin.position}</span>
            <span className="sd-reveal-cta">↗ แตะเพื่อดูประวัติ</span>
          </div>
        </div>
        <div className="p-6 md:p-8 flex flex-col justify-center" style={{ background: 'hsl(var(--card))' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--sd-acc-dk)' }}>
            ผู้บริหารโรงเรียน
          </p>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--sd-dk)' }}>{admin.name}</h2>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--sd-acc-dk)' }}>{admin.position}</p>
          {admin.quote && (
            <blockquote
              className="text-sm leading-relaxed italic mb-4"
              style={{
                borderLeft: '3px solid var(--sd-acc)',
                paddingLeft: 14, paddingTop: 10, paddingBottom: 10, paddingRight: 14,
                background: 'var(--sd-pale)', borderRadius: '0 8px 8px 0',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              {admin.quote}
            </blockquote>
          )}
          {admin.education && (
            <p className="text-sm text-muted-foreground mb-5">{admin.education}</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onOpenModal}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ background: 'var(--sd-dk)' }}
            >
              ดูประวัติ
            </button>
            <button
              onClick={onFlip}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--sd-pale)', color: 'var(--sd-dk)' }}
            >
              ติดต่อ ↻
            </button>
          </div>
        </div>
      </div>
      {/* ── Back ── */}
      <div className="sd-card-back" style={{ minHeight: 260 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--sd-acc)' }}>ผู้อำนวยการ</p>
          <h4 className="text-lg font-bold">{admin.name}</h4>
          <p className="text-sm opacity-80 mt-1">{admin.position}</p>
        </div>
        {admin.education && (
          <p className="text-xs opacity-75 leading-relaxed" style={{ position: 'relative', zIndex: 1 }}>{admin.education}</p>
        )}
        <div className="flex gap-2 flex-wrap mt-auto" style={{ position: 'relative', zIndex: 1 }}>
          <button className="sd-back-btn detail" onClick={onOpenModal}>ดูประวัติเพิ่มเติม</button>
        </div>
      </div>
    </div>
    <button className="sd-flip-btn" onClick={onFlip} title="พลิกการ์ด">
      <RotateCcw size={13} />
    </button>
  </motion.div>
);

// ── Regular Staff Card ─────────────────────────────────────────────────────────
const StaffCard = ({
  person, ribbon, isFlipped, onFlip, onOpenModal, delay,
}: {
  person: Administrator | StaffMember;
  ribbon?: string;
  isFlipped: boolean;
  onFlip: (e: React.MouseEvent) => void;
  onOpenModal: () => void;
  delay: number;
}) => {
  const subj = 'subject' in person ? person.subject : null;
  const edu  = 'education' in person ? person.education : null;
  const exp  = 'experience' in person ? person.experience : null;
  const dept = 'department' in person ? person.department : null;
  const label = subj || person.position;
  const sc = subjClass(subj || person.position);

  return (
    <motion.div
      className={`sd-card${isFlipped ? ' sd-flipped' : ''}`}
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: .38, delay: Math.min(delay * 0.07, 0.5) }}
    >
      <div className="sd-card-inner" style={{ minHeight: 280 }}>
        {/* ── Front ── */}
        <div className="sd-card-front" onClick={onOpenModal} style={{ cursor: 'pointer' }}>
          <div className="sd-photo">
            <PhotoBox url={person.photo_url} name={person.name} />
            {ribbon && <div className="sd-ribbon">{ribbon}</div>}
            <div className="sd-overlay">
              <span className="sd-ov-pos">{person.position}</span>
              <span className="sd-ov-name">{person.name}</span>
            </div>
            <div className="sd-reveal">
              <span className={`sd-badge ${sc}`}>{label}</span>
              <span className="sd-reveal-name">{person.name}</span>
              <span className="sd-reveal-pos">{person.position}</span>
              <span className="sd-reveal-cta">↗ คลิกเพื่อดูรายละเอียด</span>
            </div>
          </div>
          <div className="p-4 pb-5">
            <span className={`sd-badge ${sc} mb-2`}>{label}</span>
            {dept && <p className="text-xs text-muted-foreground mt-2">{dept}</p>}
            {edu  && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{edu}</p>}
            {exp  && <p className="text-xs text-muted-foreground mt-1">ประสบการณ์: {exp}</p>}
          </div>
        </div>
        {/* ── Back ── */}
        <div className="sd-card-back" onClick={(e) => e.stopPropagation()}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--sd-acc)' }}>ข้อมูลครู</p>
            <h4 className="font-bold text-base leading-tight">{person.name}</h4>
            <p className="text-sm opacity-80 mt-1">{person.position}</p>
            <span className={`sd-badge ${sc} mt-2`}>{label}</span>
          </div>
          {edu && <p className="text-xs opacity-80 leading-relaxed" style={{ position: 'relative', zIndex: 1 }}>{edu}</p>}
          {exp && <p className="text-xs opacity-70" style={{ position: 'relative', zIndex: 1 }}>ประสบการณ์: {exp}</p>}
          {dept && <p className="text-xs opacity-70" style={{ position: 'relative', zIndex: 1 }}>หน่วยงาน: {dept}</p>}
          <div className="flex gap-2 mt-auto" style={{ position: 'relative', zIndex: 1 }}>
            <button className="sd-back-btn detail" onClick={onOpenModal}>ดูประวัติ</button>
          </div>
        </div>
      </div>
      {/* Flip button (outside card-inner — stays facing forward) */}
      <button className="sd-flip-btn" onClick={onFlip} title="พลิกการ์ด">
        <RotateCcw size={13} />
      </button>
    </motion.div>
  );
};

// ── Modal ──────────────────────────────────────────────────────────────────────
const StaffModal = ({ person, open, onClose, phone, email }: {
  person: ModalPerson | null;
  open: boolean;
  onClose: () => void;
  phone: string;
  email: string;
}) => {
  if (!person) return null;
  const sc = subjClass(person.subject || person.position);
  const label = person.subject || person.position;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0" style={{ borderRadius: 20 }}>
        <div className="grid" style={{ gridTemplateColumns: '220px 1fr' }}>
          {/* Photo side */}
          <div className="relative" style={{ minHeight: 320, background: 'linear-gradient(160deg, var(--sd-mid), var(--sd-base))' }}>
            {person.photo_url ? (
              <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover absolute inset-0" />
            ) : (
              <div className="absolute inset-0 sd-photo-init" style={{ fontSize: '5rem' }}>
                {getInitials(person.name)}
              </div>
            )}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to bottom, transparent 55%, oklch(12% 0.10 255 / .9) 100%)',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              padding: '16px', color: '#fff',
            }}>
              <span className={`sd-badge ${sc} mb-2`}>{label}</span>
              <p className="font-bold text-base leading-tight">{person.name}</p>
              <p className="text-xs opacity-80 mt-1">{person.position}</p>
            </div>
          </div>
          {/* Info side */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: '80vh' }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--sd-dk)' }}>{person.name}</h2>
            <p className="font-semibold text-sm mb-4" style={{ color: 'var(--sd-acc-dk)' }}>{person.position}</p>

            {person.quote && (
              <blockquote className="text-sm leading-relaxed italic mb-4 pl-3"
                style={{ borderLeft: '3px solid var(--sd-acc)', color: 'hsl(var(--muted-foreground))' }}>
                {person.quote}
              </blockquote>
            )}

            <div className="space-y-3">
              {person.education && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">การศึกษา</p>
                  <p className="text-sm leading-relaxed">{person.education}</p>
                </div>
              )}
              {person.department && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">หน่วยงาน / กลุ่มสาระ</p>
                  <p className="text-sm">{person.department}</p>
                </div>
              )}
              {person.experience && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">ประสบการณ์</p>
                  <p className="text-sm">{person.experience}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t flex gap-2 flex-wrap">
              {phone && (
                <a href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ background: 'oklch(93% 0.04 255)', color: 'var(--sd-dk)' }}>
                  <Phone className="w-4 h-4" /> {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ background: 'oklch(92% 0.05 210)', color: 'oklch(35% 0.12 210)' }}>
                  <Mail className="w-4 h-4" /> อีเมล
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const Staff = () => {
  const { settings } = useSchoolSettings();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [teachingStaff, setTeachingStaff]   = useState<StaffMember[]>([]);
  const [supportStaff, setSupportStaff]     = useState<StaffMember[]>([]);
  const [loading, setLoading]               = useState(true);
  const [searchQ, setSearchQ]               = useState('');
  const [viewMode, setViewMode]             = useState<'grid' | 'list'>('grid');
  const [flippedId, setFlippedId]           = useState<string | null>(null);
  const [modalPerson, setModalPerson]       = useState<ModalPerson | null>(null);
  const [modalOpen, setModalOpen]           = useState(false);
  const [teachingCols, setTeachingCols]     = useState('4');
  const [supportCols, setSupportCols]       = useState('4');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [adminsRes, staffRes, settingsRes] = await Promise.all([
        supabase.from('administrators').select('*').order('order_position'),
        supabase.from('staff').select('*').order('order_position'),
        supabase.from('school_settings')
          .select('key, value')
          .in('key', ['staff_teaching_columns', 'staff_support_columns']),
      ]);
      if (adminsRes.data) setAdministrators(adminsRes.data);
      if (staffRes.data) {
        setTeachingStaff(staffRes.data.filter(s => s.staff_type === 'teaching'));
        setSupportStaff(staffRes.data.filter(s => s.staff_type === 'support'));
      }
      if (settingsRes.data) {
        settingsRes.data.forEach((s: { key: string; value: string }) => {
          if (s.key === 'staff_teaching_columns') setTeachingCols(s.value || '4');
          if (s.key === 'staff_support_columns') setSupportCols(s.value || '4');
        });
      }
    } catch (err) {
      console.error('Error fetching personnel:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const q = searchQ.toLowerCase();
  const fAdmins   = administrators.filter(a => !q || a.name.toLowerCase().includes(q) || a.position.toLowerCase().includes(q));
  const fTeaching = teachingStaff.filter(s  => !q || s.name.toLowerCase().includes(q) || (s.subject || '').toLowerCase().includes(q));
  const fSupport  = supportStaff.filter(s   => !q || s.name.toLowerCase().includes(q) || (s.position || '').toLowerCase().includes(q));
  const totalShown = fAdmins.length + fTeaching.length + fSupport.length;
  const totalAll   = administrators.length + teachingStaff.length + supportStaff.length;

  const flipKey = (type: string, id: string) => `${type}:${id}`;
  const handleFlip = (key: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setFlippedId(prev => prev === key ? null : key);
  };
  const openModal = (p: ModalPerson) => {
    setModalPerson(p);
    setModalOpen(true);
  };
  const adminToModal = (a: Administrator): ModalPerson => ({
    id: a.id, name: a.name, position: a.position,
    photo_url: a.photo_url, education: a.education, quote: a.quote,
  });
  const staffToModal = (s: StaffMember): ModalPerson => ({
    id: s.id, name: s.name, position: s.position,
    photo_url: s.photo_url, education: s.education,
    subject: s.subject, department: s.department, experience: s.experience,
  });

  const sections = [
    { id: 'admins',   title: 'ผู้บริหาร',         count: fAdmins.length,   hidden: fAdmins.length === 0 },
    { id: 'teaching', title: 'ครูผู้สอน',          count: fTeaching.length, hidden: fTeaching.length === 0 },
    { id: 'support',  title: 'บุคลากรสนับสนุน',    count: fSupport.length,  hidden: fSupport.length === 0 },
  ].filter(s => !s.hidden);

  const yearBE = new Date().getFullYear() + 543;

  return (
    <div className="min-h-screen bg-background">
      <StaffDirCSS />
      <SEOHead title="บุคลากร" description="คณะครูและบุคลากรของโรงเรียน" />
      <SiteHeader />

      <main>
        {/* Hero — Compact */}
        <section className="bg-primary py-2 md:py-8">
          <div className="container mx-auto px-4 text-center">
            <span className="hidden sm:inline-block text-xs md:text-sm font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5">
              บุคลากร
            </span>
            <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary-foreground mb-0.5 sm:mb-1.5">
              คณะผู้บริหารและบุคลากร
            </h1>
            <p className="hidden sm:block text-xs md:text-sm text-primary-foreground/75 max-w-2xl mx-auto">
              ทีมผู้บริหาร ครู และบุคลากรที่มีความเชี่ยวชาญ ทุ่มเทพัฒนาการศึกษาและนักเรียนทุกคน
            </p>
          </div>
        </section>

        {/* ── Stats strip ──────────────────────────────────────────── */}
        <div className="bg-card border-b px-2 sm:px-10 py-1.5 sm:py-4">
          <div className="sd-stat-grid grid grid-cols-4 gap-0">
            {[
              { num: totalAll, label: 'ครูและบุคลากร' },
              { num: administrators.length, label: 'ผู้บริหาร' },
              { num: teachingStaff.length, label: 'ครูผู้สอน' },
              { num: supportStaff.length, label: 'บุคลากรสนับสนุน' },
            ].map(({ num, label }, i) => (
              <div key={i} className="sd-stat-sep text-center py-1.5 px-1">
                <motion.div
                  className="text-lg sm:text-2xl font-bold leading-none"
                  style={{ color: 'var(--sd-dk)' }}
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  {num}
                </motion.div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div className="bg-card border-b sticky top-[68px] z-40 px-3 sm:px-6 py-2">
          <div className="flex items-center gap-3 flex-wrap max-w-screen-xl mx-auto">
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 min-w-48 max-w-xs rounded-full border px-4 py-2 bg-muted/40 focus-within:border-primary transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground flex-shrink-0">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือวิชา…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {/* View toggle */}
            <div className="flex bg-muted/60 rounded-full p-1 gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'grid' ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                style={viewMode === 'grid' ? { background: 'var(--sd-dk)' } : {}}
              >
                <LayoutGrid size={13} /> Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'list' ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                style={viewMode === 'list' ? { background: 'var(--sd-dk)' } : {}}
              >
                <List size={13} /> List
              </button>
            </div>
            <span className="text-sm text-muted-foreground ml-auto">
              {q ? `พบ ${totalShown} จาก ${totalAll} คน` : `บุคลากร ${totalAll} คน`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-32 text-center text-muted-foreground">กำลังโหลด…</div>
        ) : (
          <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-[188px_1fr] gap-8 px-4 sm:px-6 py-9 pb-12 items-start">

            {/* ── Jump nav (sidebar) ── */}
            <aside className="hidden lg:block sticky" style={{ top: 140, background: 'hsl(var(--card))', borderRadius: 14, padding: 16, boxShadow: 'var(--sd-shd)' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">หมวดหมู่</p>
              {sections.map(sec => (
                <a key={sec.id} href={`#section-${sec.id}`}
                  className="sd-jump-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <span>{sec.title}</span>
                  <span className="text-xs text-muted-foreground">{sec.count}</span>
                </a>
              ))}
            </aside>

            {/* ── Main content ── */}
            <main className={viewMode === 'list' ? 'sd-list' : ''}>

              {/* ── ผู้บริหาร ── */}
              {fAdmins.length > 0 && (
                <section id="section-admins" className="mb-12">
                  <SectionDivider title="ผู้บริหาร" count={fAdmins.length} icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>
                    </svg>
                  } />
                  <div className="space-y-6">
                    {fAdmins.map((admin, i) => {
                      const key = flipKey('admin', admin.id);
                      const isFirst = i === 0;
                      return isFirst ? (
                        <FeaturedCard
                          key={admin.id}
                          admin={admin}
                          isFlipped={flippedId === key}
                          onFlip={handleFlip(key)}
                          onOpenModal={() => openModal(adminToModal(admin))}
                        />
                      ) : (
                        <StaffCard
                          key={admin.id}
                          person={admin}
                          isFlipped={flippedId === key}
                          onFlip={handleFlip(key)}
                          onOpenModal={() => openModal(adminToModal(admin))}
                          delay={i}
                        />
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── ครูผู้สอน ── */}
              {fTeaching.length > 0 && (
                <section id="section-teaching" className="mb-12">
                  <SectionDivider title="ครูผู้สอน" count={fTeaching.length} icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  } />
                  <div className={`grid gap-5 ${colsMap[teachingCols] ?? colsMap['4']}`}>
                    {fTeaching.map((teacher, i) => {
                      const key = flipKey('staff', teacher.id);
                      return (
                        <StaffCard
                          key={teacher.id}
                          person={teacher}
                          isFlipped={flippedId === key}
                          onFlip={handleFlip(key)}
                          onOpenModal={() => openModal(staffToModal(teacher))}
                          delay={i}
                        />
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── บุคลากรสนับสนุน ── */}
              {fSupport.length > 0 && (
                <section id="section-support" className="mb-4">
                  <SectionDivider title="บุคลากรสนับสนุน" count={fSupport.length} icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 7h-4V5l-2-2h-4L8 5v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                    </svg>
                  } />
                  <div className={`grid gap-5 ${colsMap[supportCols] ?? colsMap['4']}`}>
                    {fSupport.map((staff, i) => {
                      const key = flipKey('staff', staff.id);
                      return (
                        <StaffCard
                          key={staff.id}
                          person={staff}
                          isFlipped={flippedId === key}
                          onFlip={handleFlip(key)}
                          onOpenModal={() => openModal(staffToModal(staff))}
                          delay={i}
                        />
                      );
                    })}
                  </div>
                </section>
              )}

              {totalShown === 0 && !loading && (
                <div className="py-24 text-center text-muted-foreground">
                  <p className="text-lg">ไม่พบบุคลากรที่ค้นหา</p>
                  <button onClick={() => setSearchQ('')} className="mt-3 text-sm underline">ล้างการค้นหา</button>
                </div>
              )}
            </main>
          </div>
        )}

        {/* ── Contact CTA ───────────────────────────────────────────── */}
        <section className="py-16 px-6">
          <div className="max-w-screen-xl mx-auto">
            <div
              className="rounded-3xl p-8 md:p-12"
              style={{ background: 'linear-gradient(135deg, var(--sd-dk), var(--sd-mid))' }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">ติดต่อโรงเรียน</h3>
                  <p className="text-white/75">สอบถามข้อมูลเพิ่มเติมเกี่ยวกับบุคลากรหรือการศึกษา</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {settings.contact_phone && (
                    <a
                      href={`tel:${settings.contact_phone}`}
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-opacity hover:opacity-90"
                      style={{ background: 'var(--sd-acc)', color: 'var(--sd-dk)' }}
                    >
                      <Phone className="w-5 h-5" /> {settings.contact_phone}
                    </a>
                  )}
                  {settings.contact_email && (
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold border border-white/25 text-white transition-colors hover:bg-white/10"
                    >
                      <Mail className="w-5 h-5" /> อีเมล
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* ── Modal ── */}
      <StaffModal
        person={modalPerson}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        phone={settings.contact_phone || ''}
        email={settings.contact_email || ''}
      />
    </div>
  );
};

export default Staff;
