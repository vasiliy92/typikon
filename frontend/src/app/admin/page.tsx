'use client';

import { useEffect, useState } from 'react';
import { useMessages } from './context';

interface DashboardStats {
  total_blocks: number;
  total_saints: number;
  total_templates: number;
  total_calendar_entries: number;
}

export default function AdminDashboard() {
  const messages = useMessages();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const t = (key: string) => {
    const keys = key.split('.');
    let val: any = messages;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) val = val[k];
      else return key;
    }
    return typeof val === 'string' ? val : key;
  };

  useEffect(() => {
    fetch('/api/admin/dashboard', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.dashboard')}</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('admin.nav.blocks'), value: stats.total_blocks },
            { label: t('admin.nav.saints'), value: stats.total_saints },
            { label: t('admin.nav.templates'), value: stats.total_templates },
            { label: t('admin.nav.calendar'), value: stats.total_calendar_entries },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="text-2xl font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">{t('admin.no_data')}</p>
      )}
    </div>
  );
}