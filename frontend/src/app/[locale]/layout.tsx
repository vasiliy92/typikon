'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Locale, localeNames, locales } from '@/i18n/config';
import fr from '@/i18n/messages/fr.json';
import ru from '@/i18n/messages/ru.json';
import { I18nProvider, type Messages } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';

const messages: Record<Locale, Messages> = { fr, ru };

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const currentLocale = (locales.includes(locale as Locale) ? locale : 'fr') as Locale;
  const t = messages[currentLocale];
  const pathname = usePathname();

  return (
    <I18nProvider value={{ locale: currentLocale, t }}>
      <AuthProvider>
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
          {/* Desktop Topbar */}
          <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link href={`/${currentLocale}`} className="topbar-logo">
                Typikon
              </Link>
              <span className="topbar-sep">·</span>
              <span className="topbar-title">
                {t.app.title}
              </span>
            </div>
            <div className="topbar-actions">
              <div className="pill-group">
                {locales.map((loc) => (
                  <Link
                    key={loc}
                    href={pathname.replace(`/${currentLocale}`, `/${loc}`)}
                    className={`pill ${loc === currentLocale ? 'active' : ''}`}
                  >
                    {localeNames[loc]}
                  </Link>
                ))}
              </div>
            </div>
          </header>

          {/* Mobile Topbar */}
          <header className="mobile-topbar">
            <Link href={`/${currentLocale}`} className="topbar-logo">
              Typikon.
            </Link>
            <div className="mobile-topbar-actions">
              <div className="pill-group">
                {locales.map((loc) => (
                  <Link
                    key={loc}
                    href={pathname.replace(`/${currentLocale}`, `/${loc}`)}
                    className={`pill ${loc === currentLocale ? 'active' : ''}`}
                  >
                    {localeNames[loc]}
                  </Link>
                ))}
              </div>
            </div>
          </header>

          {/* Main content — children provide their own layout */}
          {children}
        </div>
      </AuthProvider>
    </I18nProvider>
  );
}