'use client';

import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { LoginForm } from '@/components/LoginForm';
import { AdminUsers } from '@/components/AdminUsers';
import { AdminCalendar } from '@/components/AdminCalendar';
import { AdminSaints } from '@/components/AdminSaints';
import { AdminTemplates } from '@/components/AdminTemplates';
import { AdminBlocks } from '@/components/AdminBlocks';
import { AdminImport } from '@/components/AdminImport';
import { useState } from 'react';

export default function AdminPage() {
  const { t } = useI18n();
  const { user, logout, isAuthenticated, isSuperadmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.common.loading}</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const tabs = [
    { id: 'calendar', label: t.admin.calendar },
    { id: 'saints', label: t.admin.saints },
    { id: 'templates', label: t.admin.templates },
    { id: 'blocks', label: t.admin.blocks },
    { id: 'import', label: t.admin.import },
    ...(isSuperadmin ? [{ id: 'users', label: t.admin.users }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="rounded-xl border p-4 mb-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
            {t.admin.title}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--destructive)' }}
            >
              {t.admin.logout}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-white'
                : ''
            }`}
            style={activeTab === tab.id
              ? { background: 'var(--primary)' }
              : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {activeTab === 'calendar' && <AdminCalendar />}
        {activeTab === 'saints' && <AdminSaints />}
        {activeTab === 'templates' && <AdminTemplates />}
        {activeTab === 'blocks' && <AdminBlocks />}
        {activeTab === 'import' && <AdminImport />}
        {activeTab === 'users' && isSuperadmin && <AdminUsers />}
      </div>
    </div>
  );
}