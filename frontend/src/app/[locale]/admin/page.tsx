'use client';

import { useState } from 'react';
import { useI18n } from './layout';
import { BookOpen, Calendar, Users, FileText, Upload } from 'lucide-react';
import clsx from 'clsx';
import AdminBlocks from '@/components/AdminBlocks';
import AdminCalendar from '@/components/AdminCalendar';
import AdminSaints from '@/components/AdminSaints';
import AdminTemplates from '@/components/AdminTemplates';
import AdminImport from '@/components/AdminImport';

type Tab = 'blocks' | 'calendar' | 'saints' | 'templates' | 'import';

export default function AdminPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('blocks');

  const tabs: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: 'blocks', label: t.admin.blocks, icon: BookOpen },
    { key: 'calendar', label: t.admin.calendar_entries, icon: Calendar },
    { key: 'saints', label: t.admin.saints, icon: Users },
    { key: 'templates', label: t.admin.templates, icon: FileText },
    { key: 'import', label: t.admin.import_data, icon: Upload },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-slide-up">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          {t.admin.title}
        </h1>
      </div>

      {/* Tab bar */}
      <div className="animate-fade-slide-up animate-delay-1 flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                activeTab === tab.key
                  ? 'text-white'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
              style={activeTab === tab.key ? { background: 'var(--primary)' } : { background: 'var(--muted)' }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="animate-fade-slide-up animate-delay-2">
        {activeTab === 'blocks' && <AdminBlocks />}
        {activeTab === 'calendar' && <AdminCalendar />}
        {activeTab === 'saints' && <AdminSaints />}
        {activeTab === 'templates' && <AdminTemplates />}
        {activeTab === 'import' && <AdminImport />}
      </div>

      <div className="h-16 md:hidden" />
    </div>
  );
}