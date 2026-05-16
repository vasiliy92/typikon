import React from 'react';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { I18nProvider } from '@/components/I18nProvider';
import { AuthProvider } from '@/components/AuthProvider';

async function getMessages(locale: Locale) {
  const { messages } = await import('@/i18n/config');
  return messages[locale];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);

  return (
    <I18nProvider value={{ locale: locale as Locale, t: (key: string) => messages[key] || key }}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </I18nProvider>
  );
}
