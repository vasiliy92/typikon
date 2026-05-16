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
        <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.8125rem' }}>
          {t.common.loading}
        </span>
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
    <div>
      {/* User info bar */}
      <div className="admin-section-header" style={{ marginBottom: 20 }}>
        <div className="admin-user-info">
          <span className="admin-user-email">{user?.email}</span>
        </div>
        <button onClick={logout} className="admin-logout-btn">
          {t.admin.logout}
        </button>
      </div>

      {/* Tab bar */}
      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content card */}
      <div className="admin-card">
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