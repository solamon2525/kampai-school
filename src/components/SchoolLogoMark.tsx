import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { cn } from '@/lib/utils';

interface SchoolLogoMarkProps {
  /** Classes for the container — include size (w-N h-N) and background */
  className?: string;
  /** Classes for the fallback text shown when no logo URL is configured */
  fallbackClassName?: string;
}

/**
 * Shared school logo mark — shows the configured logo image, or falls back to
 * the "คผ" text mark. Always renders as a rounded-full circle.
 * Import this anywhere a school logo thumbnail is needed instead of inlining
 * the logo/fallback logic in each component.
 */
const SchoolLogoMark = ({ className, fallbackClassName }: SchoolLogoMarkProps) => {
  const { settings } = useSchoolSettings();

  return (
    <div className={cn('rounded-full flex items-center justify-center overflow-hidden flex-shrink-0', className)}>
      {settings.school_logo_url ? (
        <img
          src={settings.school_logo_url}
          alt={settings.school_name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={cn('font-bold', fallbackClassName)}>คผ</span>
      )}
    </div>
  );
};

export default SchoolLogoMark;
