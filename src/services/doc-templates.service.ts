/**
 * doc-templates.service.ts
 * Doc Templates — 12 แบบฟอร์มสำเร็จรูป
 */
import { supabase } from '@/integrations/supabase/client';

export type TemplateFieldType = 'text' | 'textarea' | 'date' | 'number';

export type TemplateField = {
    key: string;
    label: string;
    type: TemplateFieldType;
    required?: boolean;
    placeholder?: string;
};

export type DocTemplateDefinition = {
    id: string;
    key: string;
    name: string;
    description: string | null;
    emoji: string | null;
    fields: TemplateField[];
    body_template: string;
    sort_order: number;
};

export type DocTemplateGeneration = {
    id: string;
    definition_id: string;
    payload: Record<string, unknown>;
    rendered_html: string | null;
    generated_at: string;
};

/** Render `{{var}}` + simple `{{#var}}...{{/var}}` blocks */
export const renderTemplate = (
    template: string,
    payload: Record<string, string | number | undefined | null>,
): string => {
    // conditional block
    let out = template.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_m, k: string, body: string) => {
        const v = payload[k];
        return v ? body : '';
    });
    // simple substitution
    out = out.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => {
        const v = payload[k];
        return v === undefined || v === null ? '' : String(v);
    });
    return out;
};

export const docTemplatesService = {
    list: async () => {
        const { data, error } = await supabase
            .from('doc_template_definitions' as never)
            .select('*')
            .order('sort_order', { ascending: true });
        return { data: data as DocTemplateDefinition[] | null, error };
    },

    get: async (id: string) => {
        const { data, error } = await supabase
            .from('doc_template_definitions' as never)
            .select('*')
            .eq('id', id)
            .single();
        return { data: data as DocTemplateDefinition | null, error };
    },

    logGeneration: async (definitionId: string, payload: Record<string, unknown>, renderedHtml: string) => {
        const { data: user } = await supabase.auth.getUser();
        return supabase.from('doc_template_generations' as never).insert({
            definition_id: definitionId,
            generated_by: user.user?.id ?? null,
            payload,
            rendered_html: renderedHtml,
        } as never);
    },
};
