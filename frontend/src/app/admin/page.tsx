'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { apiGet } from '@/lib/api';
import { AdminCalendar } from '@/components/AdminCalendar';
import { AdminSaints } from '@/components/AdminSaints';
import { AdminBlocks } from '@/components/AdminBlocks';
import { AdminTemplates } from '@/components/AdminTemplates';
import { AdminUsers } from '@/components/AdminUsers';
import { AdminImport } from '@/components/AdminImport';

type Tab = 'dashboard' | 'calendar' | 'saints' | 'blocks' | 'templates' | 'users' | 'import';

interface DashboardStats {
  total_blocks: number;
  total_saints: number;
  total_templates: number;
  total_calendar_entries: number;
}

function Dashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DashboardStats>('/api/admin/dashboard')
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.875rem' }}>…</p>;
  }

  if (!stats) {
    return null;
  }

  const cards = [
    { label: t.admin.blocks, value: stats.total_blocks, desc: t.admin.blocksDesc },
    { label: t.admin.saints, value: stats.total_saints, desc: t.admin.saintsDesc },
    { label: t.admin.templates, value: stats.total_templates, desc: t.admin.templatesDesc },
    { label: t.admin.calendar, value: stats.total_calendar_entries, desc: t.admin.calendarDesc },
  ];

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">{t.admin.title}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {cards.map((card) => (
          <div key={card.label} className="admin-card">
            <p style={{ fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '4px' }}>
              {card.label}
            </p>
            <p style={{ fontFamily: 'var(--font-heading), Georgia, serif', fontSize: '2rem', fontWeight: 400, color: 'var(--fg)', lineHeight: 1.1 }}>
              {card.value}
            </p>
            <p style={{ fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS: { key: Tab; i18nKey: string }[] = [
  { key: 'dashboard', i18nKey: 'title' },
  { key: 'calendar', i18nKey: 'calendar' },
  { key: 'saints', i18nKey: 'saints' },
  { key: 'blocks', i18nKey: 'blocks' },
  { key: 'templates', i18nKey: 'templates' },
  { key: 'users', i18nKey: 'users' },
  { key: 'import', i18nKey: 'import_data' },
];

export default function AdminPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div>
      {/* Tab bar */}
      <div className="admin-tabs" style={{ marginBottom: '24px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {String((t.admin as Record<string, unknown>)[tab.i18nKey] || tab.i18nKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'calendar' && <AdminCalendar />}
      {activeTab === 'saints' && <AdminSaints />}
      {activeTab === 'blocks' && <AdminBlocks />}
      {activeTab === 'templates' && <AdminTemplates />}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'import' && <AdminImport />}
    </div>
  );
}
