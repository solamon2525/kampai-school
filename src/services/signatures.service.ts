/**
 * signatures.service.ts
 * Generic e-Signature ผูกกับ entity_type + entity_id ใด ๆ
 * Bucket: signatures (public read, authenticated insert)
 */
import { supabase } from '@/integrations/supabase/client';

export type SignatureRole = 'approver' | 'signer' | 'witness';

export type SignatureRow = {
    id: string;
    entity_type: string;
    entity_id: string;
    role: SignatureRole;
    signer_user_id: string | null;
    signer_name: string;
    signer_position: string | null;
    signature_url: string;
    signed_at: string;
};

const blobToFile = (blob: Blob, ext = 'png'): File =>
    new File([blob], `${crypto.randomUUID()}.${ext}`, { type: blob.type || 'image/png' });

export const signaturesService = {
    /** upload PNG → insert signatures row → return URL+id */
    upload: async (params: {
        blob: Blob;
        entityType: string;
        entityId: string;
        role: SignatureRole;
        signerName: string;
        signerPosition?: string | null;
    }): Promise<{ data: { id: string; url: string } | null; error: Error | null }> => {
        const { blob, entityType, entityId, role, signerName, signerPosition = null } = params;

        const file = blobToFile(blob);
        const path = `${entityType}/${entityId}/${file.name}`;
        const { error: uploadErr } = await supabase.storage
            .from('signatures')
            .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadErr) return { data: null, error: uploadErr };

        const { data: pub } = supabase.storage.from('signatures').getPublicUrl(path);
        const url = pub.publicUrl;

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id ?? null;

        const { data, error } = await supabase
            .from('signatures' as never)
            .insert({
                entity_type: entityType,
                entity_id: entityId,
                role,
                signer_user_id: userId,
                signer_name: signerName,
                signer_position: signerPosition,
                signature_url: url,
            } as never)
            .select('id, signature_url')
            .single();
        if (error || !data) return { data: null, error: error ?? new Error('insert failed') };

        const row = data as { id: string; signature_url: string };
        return { data: { id: row.id, url: row.signature_url }, error: null };
    },

    list: async (entityType: string, entityId: string) => {
        const { data, error } = await supabase
            .from('signatures' as never)
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('signed_at', { ascending: false });
        return { data: data as SignatureRow[] | null, error };
    },

    remove: async (id: string) => supabase.from('signatures' as never).delete().eq('id', id),
};
