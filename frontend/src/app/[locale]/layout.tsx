'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Locale, localeNames, locales } from '@/i18n/config';
import fr from '@/i18n/messages/fr.json';
import ru from '@/i18n/messages/ru.json';
import en from '@/i18n/messages/en.json';
import { I18nProvider, type Messages } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { TopbarTitleContext } from '@/lib/topbar';

const messages: Record<Locale, Messages> = { fr, ru, en };

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
  const [topbarTitle, setTopbarTitle] = useState('');

  // Sync <html lang> with current locale
  useEffect(() => {
    document.documentElement.lang = currentLocale;
  }, [currentLocale]);

  return (
    <I18nProvider value={{ locale: currentLocale, t }}>
      <AuthProvider>
        <TopbarTitleContext.Provider value={{ title: topbarTitle, setTitle: setTopbarTitle }}>
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
          {/* Desktop Topbar */}
          <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0px' }}>
              <Link href={`/${currentLocale}`} className="topbar-logo">
                Typikon<em>.</em>
              </Link>
              {topbarTitle && (
                <>
                  <span className="topbar-sep">·</span>
                  <span className="topbar-title">
                    {topbarTitle}
                  </span>
                </>
              )}
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
              Typikon<em>.</em>
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
        </TopbarTitleContext.Provider>
      </AuthProvider>
    </I18nProvider>
  );
}
