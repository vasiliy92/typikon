'use client';

import { useI18n } from '@/lib/i18n';
import { useApi } from '@/lib/api';
import { useAdminTab } from '@/lib/admin-tab';
import { AdminUsers } from '@/components/AdminUsers';
import { AdminCalendar } from '@/components/AdminCalendar';
import { AdminSaints } from '@/components/AdminSaints';
import { AdminBlocks } from '@/components/AdminBlocks';
import { AdminTemplates } from '@/components/AdminTemplates';
import { AdminImport } from '@/components/AdminImport';

interface DashboardStats {
  total_blocks: number;
  total_saints: number;
  total_templates: number;
  total_calendar_entries: number;
}

function Dashboard() {
  const { t } = useI18n();
  const { data: stats } = useApi<DashboardStats>('/admin/dashboard');
  const a = t.admin;

  if (!stats) {
    return (
      <p style={{ fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.8125rem', color: 'var(--muted)' }}>
        {t.common.loading}
      </p>
    );
  }

  return (
    <div className="admin-stats-grid">
      {[
        { label: a.total_blocks, value: stats.total_blocks },
        { label: a.total_saints, value: stats.total_saints },
        { label: a.total_templates, value: stats.total_templates },
        { label: a.total_calendar, value: stats.total_calendar_entries },
      ].map(({ label, value }) => (
        <div key={label} className="admin-stat-card">
          <div className="admin-stat-value">{value}</div>
          <div className="admin-stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { activeTab } = useAdminTab();

  return (
    <div>
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
