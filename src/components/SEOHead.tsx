import { Helmet } from 'react-helmet-async';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

interface SEOHeadProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
}

export const SEOHead = ({ title, description, image, url }: SEOHeadProps) => {
    const { settings } = useSchoolSettings();
    const siteName = settings.school_name || 'โรงเรียน';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const metaDescription = description || settings.school_description || '';
    const metaImage = image || settings.school_logo_url || '';
    const metaUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    return (
        <Helmet>
            <title>{fullTitle}</title>
            {metaDescription && <meta name="description" content={metaDescription} />}
            <meta property="og:title" content={fullTitle} />
            {metaDescription && <meta property="og:description" content={metaDescription} />}
            {metaImage && <meta property="og:image" content={metaImage} />}
            <meta property="og:url" content={metaUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={siteName} />
        </Helmet>
    );
};
