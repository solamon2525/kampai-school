import { supabase } from '@/integrations/supabase/client';

/**
 * Extracts the file path from a Supabase Storage public URL
 * @param url - The full public URL of the image
 * @param bucket - The storage bucket name (default: 'images')
 * @returns The file path within the bucket, or null if not a valid storage URL
 */
export const extractStoragePath = (url: string | null | undefined, bucket: string = 'images'): string | null => {
    if (!url) return null;

    // Handle Supabase storage URLs
    // Format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const storagePattern = `/storage/v1/object/public/${bucket}/`;
    const index = url.indexOf(storagePattern);

    if (index !== -1) {
        return url.substring(index + storagePattern.length);
    }

    return null;
};

/**
 * Deletes an image from Supabase Storage
 * @param url - The full public URL of the image to delete
 * @param bucket - The storage bucket name (default: 'images')
 * @returns true if deleted successfully, false otherwise
 */
export const deleteStorageImage = async (url: string | null | undefined, bucket: string = 'images'): Promise<boolean> => {
    const filePath = extractStoragePath(url, bucket);

    if (!filePath) {
        console.log('Not a valid storage URL, skipping deletion:', url);
        return false;
    }

    try {
        const { error } = await supabase.storage.from(bucket).remove([filePath]);

        if (error) {
            console.error('Error deleting file from storage:', error);
            return false;
        }

        console.log('Successfully deleted file from storage:', filePath);
        return true;
    } catch (error) {
        console.error('Error deleting file from storage:', error);
        return false;
    }
};

/**
 * Deletes multiple images from Supabase Storage
 * @param urls - Array of image URLs to delete
 * @param bucket - The storage bucket name (default: 'images')
 * @returns Number of successfully deleted files
 */
export const deleteMultipleStorageImages = async (urls: (string | null | undefined)[], bucket: string = 'images'): Promise<number> => {
    const filePaths = urls
        .map(url => extractStoragePath(url, bucket))
        .filter((path): path is string => path !== null);

    if (filePaths.length === 0) {
        return 0;
    }

    try {
        const { error } = await supabase.storage.from(bucket).remove(filePaths);

        if (error) {
            console.error('Error deleting files from storage:', error);
            return 0;
        }

        console.log('Successfully deleted files from storage:', filePaths);
        return filePaths.length;
    } catch (error) {
        console.error('Error deleting files from storage:', error);
        return 0;
    }
};
