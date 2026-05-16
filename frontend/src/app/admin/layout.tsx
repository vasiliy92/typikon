'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Moon, Sun, Church, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { Locale, localeNames, locales } from '@/i18n/config';
import fr from '@/i18n/messages/fr.json';
import ru from '@/i18n/messages/ru.json';
import en from '@/i18n/messages/en.json';
import { I18nProvider, type Messages } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';

const messages: Record<Locale, Messages> = { fr, ru, en };

const ADMIN_LANG_KEY = 'typikon-admin-lang';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dark, setDark] = useState(false);
  const [locale, setLocale] = useState<Locale>('fr');

  useEffect(() => {
    // Restore language preference
    const savedLang = localStorage.getItem(ADMIN_LANG_KEY);
    if (savedLang && locales.includes(savedLang as Locale)) {
      setLocale(savedLang as Locale);
    }

    // Restore theme
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
        <div className="min-h-screen" style={{ background: 'var(--background)' }}>
          {/* Header */}
          <header
            className="sticky top-0 z-50 backdrop-blur-md border-b"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/${locale}`}
                  className="flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--foreground)]"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <ArrowLeft size={16} />
                  {t.app.title}
                </Link>
                <span style={{ color: 'var(--border)' }}>|</span>
                <span
                  className="font-display font-semibold text-lg"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t.admin.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Language switcher */}
                <div
                  className="flex items-center rounded-lg overflow-hidden border"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => switchLocale(loc)}
                      className={clsx(
                        'px-2.5 py-1 text-xs font-medium transition-all',
                        loc === locale
                          ? ''
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                      )}
                      style={loc === locale ? { background: 'var(--primary)', color: 'var(--primary-foreground)' } : {}}
                    >
                      {localeNames[loc]}
                    </button>
                  ))}
                </div>

                {/* Dark mode toggle */}
                <button
                  onClick={toggleDark}
                  className="p-2 rounded-lg transition-all hover:bg-[var(--muted-bg)]"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </div>
      </AuthProvider>
    </I18nProvider>
  );
}