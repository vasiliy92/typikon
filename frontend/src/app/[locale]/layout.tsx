'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TopbarTitleContext } from '@/lib/topbar';
import '@/../public/styles/globals.css';

const LOCALES = [
  { code: 'fr', label: 'FR' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [topbarTitle, setTopbarTitle] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') setDark(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', String(dark));
  }, [dark]);

  return (
    <TopbarTitleContext.Provider value={{ title: topbarTitle, setTitle: setTopbarTitle }}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
            <Link href={`/${locale}`} className="text-xl font-bold tracking-tight">
              {t('app.title')}
            </Link>
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex gap-1 text-sm">
                {LOCALES.map((l) => (
                  <Link
                    key={l.code}
                    href={`/${l.code}${pathname.replace(/^\/[a-z]{2}/, '')}`}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      locale === l.code
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                    }`
                  }
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDark(!dark)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {dark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </TopbarTitleContext.Provider>
  );
}
