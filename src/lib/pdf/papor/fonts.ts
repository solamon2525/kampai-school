import { Font } from '@react-pdf/renderer';

let registered = false;

/**
 * Register Sarabun font for React-PDF. Idempotent — safe to call multiple times.
 * Fonts must be in public/fonts/ (copied from @fontsource/sarabun at install time).
 */
export function ensurePaporFontsRegistered() {
  if (registered) return;
  Font.register({
    family: 'Sarabun',
    fonts: [
      { src: '/fonts/Sarabun-Regular.woff', fontWeight: 'normal' },
      { src: '/fonts/Sarabun-Bold.woff', fontWeight: 'bold' },
    ],
  });
  // Prevent React-PDF from hyphenating Thai words
  Font.registerHyphenationCallback((word: string) => [word]);
  registered = true;
}
