import { Helmet } from 'react-helmet-async';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

interface SEOHeadProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    /** Suppress global EducationalOrganization JSON-LD (e.g. for pages where it conflicts with a more specific schema like NewsArticle) */
    noOrgSchema?: boolean;
}

const SITE_ORIGIN = 'https://kampai-school.vercel.app';

const absoluteUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${SITE_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const SEOHead = ({ title, description, image, url, noOrgSchema }: SEOHeadProps) => {
    const { settings } = useSchoolSettings();
    const siteName = settings.school_name || 'โรงเรียน';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const metaDescription = description || settings.school_description || '';
    const ogImage = absoluteUrl(image || settings.school_logo_url || '/og-image.png');
    const metaUrl = url || (typeof window !== 'undefined' ? window.location.href : SITE_ORIGIN);

    const orgSchema = noOrgSchema
        ? null
        : {
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              '@id': `${SITE_ORIGIN}/#school`,
              name: siteName,
              description: settings.school_description || undefined,
              url: SITE_ORIGIN,
              logo: absoluteUrl(settings.school_logo_url || '/og-image.png'),
              image: ogImage,
              address: settings.contact_address
                  ? {
                        '@type': 'PostalAddress',
                        streetAddress: settings.contact_address,
                        addressCountry: 'TH',
                    }
                  : undefined,
              telephone: settings.contact_phone || undefined,
              email: settings.contact_email || undefined,
              slogan: settings.school_motto || settings.school_tagline || undefined,
              sameAs:
                  settings.social_links && settings.social_links.length > 0
                      ? settings.social_links.map((l) => l.url).filter(Boolean)
                      : undefined,
          };

    return (
        <Helmet>
            <title>{fullTitle}</title>
            {metaDescription && <meta name="description" content={metaDescription} />}
            <meta property="og:title" content={fullTitle} />
            {metaDescription && <meta property="og:description" content={metaDescription} />}
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={metaUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={siteName} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            {metaDescription && <meta name="twitter:description" content={metaDescription} />}
            <meta name="twitter:image" content={ogImage} />
            {orgSchema && (
                <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
            )}
        </Helmet>
    );
};
