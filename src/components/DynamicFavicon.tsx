import { useEffect } from 'react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const DynamicFavicon = () => {
  const { settings } = useSchoolSettings();

  useEffect(() => {
    if (!settings.school_logo_url) return;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = settings.school_logo_url;
  }, [settings.school_logo_url]);

  return null;
};

export default DynamicFavicon;
