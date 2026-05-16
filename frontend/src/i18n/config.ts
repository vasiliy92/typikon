import fr from './messages/fr.json';
import ru from './messages/ru.json';

export const locales = ['fr', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  ru: 'Русский',
};

export const messages: Record<Locale, Record<string, unknown>> = {
  fr,
  ru,
};

export const defaultLocale: Locale = 'fr';
