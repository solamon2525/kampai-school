import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import type { PageBlock } from '@/components/admin/page-builder/types';

interface Props {
    dbKey: string;
}

/**
 * Renders custom page blocks stored in school_settings.
 * Used at the bottom of About.tsx, Contact.tsx, etc.
 * If no blocks are configured, renders nothing (zero visual footprint).
 */
export const PageBlockRenderer = ({ dbKey }: Props) => {
    const [blocks, setBlocks] = useState<PageBlock[]>([]);

    useEffect(() => {
        supabase
            .from('school_settings')
            .select('value')
            .eq('key', dbKey)
            .maybeSingle()
            .then(({ data }) => {
                if (data?.value) {
                    try {
                        setBlocks(JSON.parse(data.value));
                    } catch { /* ignore */ }
                }
            });
    }, [dbKey]);

    if (blocks.length === 0) return null;

    return (
        <section className="py-12 px-4 max-w-5xl mx-auto space-y-12">
            {blocks.map((block) => (
                <BlockDisplay key={block.id} block={block} />
            ))}
        </section>
    );
};

function BlockDisplay({ block }: { block: PageBlock }) {
    const { props } = block;

    if (block.type === 'text') {
        return (
            <div className="prose prose-lg max-w-none">
                {props.title && (
                    <h2 className="text-2xl font-bold text-foreground mb-4">{props.title}</h2>
                )}
                {props.content && (
                    <div
                        className="text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(props.content.replace(/\n/g, '<br/>')),
                        }}
                    />
                )}
            </div>
        );
    }

    if (block.type === 'image') {
        return (
            <figure className="text-center">
                {props.image_url && (
                    <img
                        src={props.image_url}
                        alt={props.caption || ''}
                        className="w-full max-h-96 object-cover rounded-xl shadow-sm"
                    />
                )}
                {props.caption && (
                    <figcaption className="mt-2 text-sm text-muted-foreground">{props.caption}</figcaption>
                )}
            </figure>
        );
    }

    if (block.type === 'banner') {
        return (
            <div className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
                {props.title && <h2 className="text-3xl font-bold mb-3">{props.title}</h2>}
                {props.subtitle && <p className="text-primary-foreground/80 text-lg mb-6">{props.subtitle}</p>}
                {props.cta_text && props.cta_url && (
                    <a
                        href={props.cta_url}
                        className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-2.5 rounded-full hover:bg-white/90 transition-colors"
                    >
                        {props.cta_text}
                    </a>
                )}
            </div>
        );
    }

    if (block.type === 'stats') {
        const stats = props.stats || [];
        if (stats.length === 0) return null;
        return (
            <div className={`grid gap-6 ${stats.length <= 2 ? 'grid-cols-2' : stats.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {stats.map((stat, i) => (
                    <div key={i} className="text-center bg-card rounded-xl p-6 border border-border">
                        <p className="text-4xl font-bold text-primary">{stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>
        );
    }

    if (block.type === 'map') {
        if (!props.embed_url) return null;
        return (
            <div>
                {props.map_title && (
                    <h2 className="text-2xl font-bold text-foreground mb-4">{props.map_title}</h2>
                )}
                <div className="rounded-xl overflow-hidden border border-border">
                    <iframe
                        src={props.embed_url}
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={props.map_title || 'แผนที่'}
                    />
                </div>
            </div>
        );
    }

    return null;
}
