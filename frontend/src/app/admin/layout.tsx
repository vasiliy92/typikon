'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Moon, Sun, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { Locale, localeNames, locales } from '@/i18n/config';
import fr from '@/i18n/messages/fr.json';
import ru from '@/i18n/messages/ru.json';
import { I18nProvider, type Messages } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';

const messages: Record<Locale, Messages> = { fr, ru };

const ADMIN_LANG_KEY = 'typikon-admin-lang';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dark, setDark] = useState(false);
  const [locale, setLocale] = useState<Locale>('fr');

  useEffect(() => {
    const savedLang = localStorage.getItem(ADMIN_LANG_KEY);
    if (savedLang && locales.includes(savedLang as Locale)) {
      setLocale(savedLang as Locale);
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('typikon-theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('typikon-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const switchLocale = (loc: Locale) => {
    setLocale(loc);
    localStorage.setItem(ADMIN_LANG_KEY, loc);
  };

  const t = messages[locale];

  return (
    <I18nProvider value={{ locale, t }}>
      <AuthProvider>
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
          {/* Header */}
          <header className="admin-topbar">
            <div className="admin-topbar-left">
              <Link href={`/${locale}`} className="admin-topbar-back">
                <ArrowLeft size={14} />
                {t.app.title}
              </Link>
              <span className="admin-topbar-sep">·</span>
              <span className="admin-topbar-title">
                {t.admin.title}
              </span>
            </div>

            <div className="admin-topbar-right">
              {/* Language switcher — pill-group style */}
              <div className="pill-group">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    className={clsx('pill', loc === locale && 'active')}
                  >
                    {localeNames[loc]}
                  </button>
                ))}
              </div>

              {/* Dark mode toggle */}
              <button onClick={toggleDark} className="admin-icon-btn">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="admin-content">{children}</main>
        </div>
      </AuthProvider>
    </I18nProvider>
  );
}