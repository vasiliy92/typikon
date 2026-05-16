import fr from './messages/fr.json';
import ru from './messages/ru.json';
import en from './messages/en.json';

export const locales = ['fr', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  ru: 'Русский',
  en: 'English',
};

export const messages: Record<Locale, Record<string, unknown>> = {
  fr,
  ru,
  en,
};

export const defaultLocale: Locale = 'fr';