'use client';

import { createContext, useContext } from 'react';
import { Locale } from '@/i18n/config';
import fr from '@/i18n/messages/fr.json';

export type Messages = typeof fr;

const I18nContext = createContext<{ locale: Locale; t: Messages }>({
  locale: 'fr',
  t: fr,
});

export const I18nProvider = I18nContext.Provider;

export function useI18n() {
  return useContext(I18nContext);
}
