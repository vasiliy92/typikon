import { createContext, useContext } from 'react';

export type Locale = 'en' | 'fr' | 'ru';

export const LocaleContext = createContext<Locale>('en');
export const MessagesContext = createContext<any>(null);

export function useLocale() { return useContext(LocaleContext); }
export function useMessages() { return useContext(MessagesContext); }