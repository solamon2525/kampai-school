import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-1.5', className)}>
          <Languages className="w-4 h-4" />
          <span className="text-xs font-medium">{current === 'en' ? 'EN' : 'TH'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => i18n.changeLanguage('th')} className={current === 'th' ? 'bg-accent' : ''}>
          🇹🇭 {t('language.th')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => i18n.changeLanguage('en')} className={current === 'en' ? 'bg-accent' : ''}>
          🇬🇧 {t('language.en')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
