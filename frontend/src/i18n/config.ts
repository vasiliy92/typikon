export const locales = ['fr', 'csy', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  csy: 'Церковнославѧ́нскїй',
  ru: 'Русский',
};
