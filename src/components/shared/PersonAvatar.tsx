import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/avatars';
import { cn } from '@/lib/utils';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<Size, string> = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
};

interface PersonAvatarProps {
    name: string;
    photoUrl?: string | null;
    size?: Size;
    className?: string;
}

/**
 * PersonAvatar — single API for displaying a person (teacher / admin / student)
 * with their photo. Required wherever a name appears in the UI (DESIGN.md Rule 14.13).
 *
 * Falls back to initials when `photoUrl` is null/missing.
 */
export const PersonAvatar = ({ name, photoUrl, size = 'sm', className }: PersonAvatarProps) => (
    <Avatar className={cn(SIZE_CLASS[size], className)} aria-label={name}>
        {photoUrl ? <AvatarImage src={photoUrl} alt={name} /> : null}
        <AvatarFallback className="font-semibold text-muted-foreground">
            {getInitials(name)}
        </AvatarFallback>
    </Avatar>
);
