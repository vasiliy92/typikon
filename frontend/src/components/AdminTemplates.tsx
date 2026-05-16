'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import { AdminSelect } from '@/components/AdminSelect';
import type { TemplateResponse, PaginatedResponse } from '@/lib/api';

const SERVICE_TYPES = [
  'liturgy', 'vespers', 'matins', 'vigil', 'hours',
  'compline', 'midnight_office', 'typica', 'presanctified',
] as const;

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
      <div className="admin-section-header">
        <span className="admin-section-meta">{t.admin.total}: {total}</span>
        <button
          onClick={() => { setCreating(true); setEditing(null); }}
          className="admin-btn admin-btn-add"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t.admin.add}
        </button>
      </div>

      {(creating || editing) && (
        <TemplateForm
          template={editing}
          onSave={async (payload) => {
            if (editing) {
              await apiPut(`/admin/templates/${editing.id}`, payload);
            } else {
              await apiPost('/admin/templates', payload);
            }
            setCreating(false);
            setEditing(null);
            mutate();
          }}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {items.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.8125rem', color: 'var(--muted)', padding: '16px 0' }}>
          {t.app.no_results}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((tpl) => (
            <div key={tpl.id} className="admin-item-card">
              <div className="admin-item-main">
                <div className="admin-item-title">{tpl.name}</div>
                <div className="admin-item-sub">
                  {t.service_types[tpl.service_type as keyof typeof t.service_types] ?? tpl.service_type} · {tpl.is_special ? t.admin.special : t.admin.regular} · {tpl.blocks?.length ?? 0} {t.admin.blocks_count}
                </div>
              </div>
              <div className="admin-item-actions">
                <button onClick={() => { setEditing(tpl); setCreating(false); }} className="admin-btn admin-btn-ghost">
                  {t.admin.edit}
                </button>
                <button onClick={() => handleDelete(tpl.id)} className="admin-btn admin-btn-danger">
                  {t.admin.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="admin-pagination">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="admin-pagination-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span>{t.admin.page} {page} {t.admin.of} {pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages} className="admin-pagination-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function TemplateForm({ template, onSave, onCancel }: { template: TemplateResponse | null; onSave: (payload: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const { t } = useI18n();
  const f = t.admin.fields;

  const [form, setForm] = useState<Record<string, string>>({
    name: template?.name ?? '',
    service_type: template?.service_type ?? 'liturgy',
    sub_type: template?.sub_type ?? '',
    is_special: String(template?.is_special ?? false),
    description: template?.description ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name: form.name,
      service_type: form.service_type,
      sub_type: form.sub_type || null,
      is_special: form.is_special === 'true',
      description: form.description || null,
    });
    setSaving(false);
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-grid admin-form-grid-2">
        <div className="admin-field">
          <label>{f.name}</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="admin-field">
          <label>{f.service_type}</label>
          <AdminSelect
            value={form.service_type}
            onChange={(v) => update('service_type', v)}
            options={SERVICE_TYPES.map((st) => ({
              value: st,
              label: t.service_types[st as keyof typeof t.service_types],
            }))}
          />
        </div>
        <div className="admin-field">
          <label>{f.sub_type}</label>
          <input value={form.sub_type} onChange={(e) => update('sub_type', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.is_special}</label>
          <AdminSelect
            value={form.is_special}
            onChange={(v) => update('is_special', v)}
            options={[
              { value: 'false', label: t.admin.regular },
              { value: 'true', label: t.admin.special },
            ]}
          />
        </div>
      </div>
      <div style={{ marginTop: '12px' }}>
        <div className="admin-field">
          <label>{f.description}</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} />
        </div>
      </div>
      <div className="admin-form-actions">
        <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary">
          {t.admin.cancel}
        </button>
        <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
          {t.admin.save}
        </button>
      </div>
    </form>
  );
}