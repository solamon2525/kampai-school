import {
    Home, Info, Users, GraduationCap, BookOpen, Image, Calendar,
    Newspaper, Phone, Mail, FileText, Recycle, UserCog, Layers,
    Download, Globe, LogIn, Award, Briefcase, Building, Bell,
    Star, Heart, Settings, BarChart3, TrendingUp, type LucideIcon,
} from 'lucide-react';

/**
 * Resolves a lucide icon name (string from menu config) to its component.
 * Defaults to `FileText` if the name is unknown — keeps render safe.
 */
export const MENU_ICON_REGISTRY: Record<string, LucideIcon> = {
    Home, Info, Users, GraduationCap, BookOpen, Image, Calendar,
    Newspaper, Phone, Mail, FileText, Recycle, UserCog, Layers,
    Download, Globe, LogIn, Award, Briefcase, Building, Bell,
    Star, Heart, Settings, BarChart3, TrendingUp,
};

export const resolveMenuIcon = (name: string): LucideIcon => {
    return MENU_ICON_REGISTRY[name] ?? FileText;
};
