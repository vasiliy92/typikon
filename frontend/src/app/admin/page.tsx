'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi } from '@/lib/api';
import { AdminUsers } from '@/components/AdminUsers';
import { AdminCalendar } from '@/components/AdminCalendar';
import { AdminSaints } from '@/components/AdminSaints';
import { AdminBlocks } from '@/components/AdminBlocks';
import { AdminTemplates } from '@/components/AdminTemplates';
import { AdminImport } from '@/components/AdminImport';
import type { AdminTab } from './layout';

interface DashboardStats {
  total_blocks: number;
  total_saints: number;
  total_templates: number;
  total_calendar_entries: number;
}

const TABS: { key: AdminTab; icon: string }[] = [
  { key: 'dashboard', icon: '📊' },
  { key: 'calendar', icon: '📅' },
  { key: 'saints', icon: '✝️' },
  { key: 'blocks', icon: '🧱' },
  { key: 'templates', icon: '📋' },
  { key: 'users', icon: '👥' },
  { key: 'import', icon: '📥' },
];

export default function AdminPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const { data: stats } = useApi<DashboardStats>('/admin/dashboard');

  const a = t.admin;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(({ key, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? '' : ''}`}
            style={{
              borderColor: activeTab === key ? 'var(--primary)' : 'transparent',
              color: activeTab === key ? 'var(--primary)' : 'var(--muted-foreground)',
            }}
          >
            <span className="mr-1">{icon}</span>
            {a[key as keyof typeof a] as string}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && (
        <div>
          <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            {a.dashboard}
          </h2>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: a.total_blocks, value: stats.total_blocks },
                { label: a.total_saints, value: stats.total_saints },
                { label: a.total_templates, value: stats.total_templates },
                { label: a.total_calendar, value: stats.total_calendar_entries },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg border p-4 text-center"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                >
                  <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.common.loading}</p>
          )}
        </div>
      )}
      {activeTab === 'calendar' && <AdminCalendar />}
      {activeTab === 'saints' && <AdminSaints />}
      {activeTab === 'blocks' && <AdminBlocks />}
      {activeTab === 'templates' && <AdminTemplates />}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'import' && <AdminImport />}
    </div>
  );
}