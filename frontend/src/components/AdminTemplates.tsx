'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { TemplateResponse, PaginatedResponse } from '@/lib/api';

export function AdminTemplates() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, mutate } = useApi<PaginatedResponse<TemplateResponse>>(
    `/admin/templates?page=${page}&page_size=20`
  );
  const [editing, setEditing] = useState<TemplateResponse | null>(null);
  const [creating, setCreating] = useState(false);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.ceil(total / 20);

  const handleDelete = async (id: number) => {
    if (!confirm(t.app.confirm_delete)) return;
    await apiDelete(`/admin/templates/${id}`);
    mutate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.admin.total}: {total}</span>
        <button onClick={() => { setCreating(true); setEditing(null); }} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>{t.admin.add}</button>
      </div>

      {(creating || editing) && (
        <TemplateForm template={editing} onSave={async (payload) => { if (editing) { await apiPut(`/admin/templates/${editing.id}`, payload); } else { await apiPost('/admin/templates', payload); } setCreating(false); setEditing(null); mutate(); }} onCancel={() => { setCreating(false); setEditing(null); }} />
      )}

      {items.length === 0 ? (
        <p className="text-sm py-4" style={{ color: 'var(--muted-foreground)' }}>{t.app.no_results}</p>
      ) : (
        <div className="space-y-2">
          {items.map((tpl) => (
            <div key={tpl.id} className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>{tpl.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{tpl.service_type} · {tpl.is_special ? '★ special' : 'regular'} · {tpl.blocks?.length ?? 0} blocks</div>
              </div>
              <div className="flex gap-2 ml-2">
                <button onClick={() => { setEditing(tpl); setCreating(false); }} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--primary)' }}>{t.admin.edit}</button>
                <button onClick={() => handleDelete(tpl.id)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--destructive)' }}>{t.admin.delete}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 rounded text-sm disabled:opacity-30" style={{ background: 'var(--muted-bg)', color: 'var(--foreground)' }}>←</button>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.admin.page} {page} {t.admin.of} {pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages} className="px-3 py-1 rounded text-sm disabled:opacity-30" style={{ background: 'var(--muted-bg)', color: 'var(--foreground)' }}>→</button>
        </div>
      )}
    </div>
  );
}

function TemplateForm({ template, onSave, onCancel }: { template: TemplateResponse | null; onSave: (payload: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState<Record<string, string>>({ name: template?.name ?? '', service_type: template?.service_type ?? 'liturgy', sub_type: template?.sub_type ?? '', is_special: String(template?.is_special ?? false), description: template?.description ?? '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await onSave({ name: form.name, service_type: form.service_type, sub_type: form.sub_type || null, is_special: form.is_special === 'true', description: form.description || null });
    setSaving(false);
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 mb-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>name</label><input value={form.name} onChange={(e) => update('name', e.target.value)} required className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }} /></div>
        <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>service_type</label><select value={form.service_type} onChange={(e) => update('service_type', e.target.value)} className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }}>{['liturgy', 'vespers', 'matins', 'vigil', 'hours', 'compline', 'midnight_office', 'typica', 'presanctified'].map((st) => (<option key={st} value={st}>{st}</option>))}</select></div>
        <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>sub_type</label><input value={form.sub_type} onChange={(e) => update('sub_type', e.target.value)} className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }} /></div>
        <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>is_special</label><select value={form.is_special} onChange={(e) => update('is_special', e.target.value)} className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }}><option value="false">No</option><option value="true">Yes</option></select></div>
      </div>
      <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>description</label><textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }} /></div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.admin.cancel}</button>
        <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>{t.admin.save}</button>
      </div>
    </form>
  );
}