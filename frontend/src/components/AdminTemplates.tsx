'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { TemplateResponse, PaginatedResponse } from '@/lib/api';

/** Look up an enum value in a translation object, with fallback to the raw key. */
const enumLabel = (obj: Record<string, string>, key: string): string => obj[key] ?? key;

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
          className="admin-btn admin-btn-primary"
        >
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
        <p className="admin-section-meta" style={{ padding: '16px 0' }}>
          {t.app.no_results}
        </p>
      ) : (
        <div>
          {items.map((tpl) => (
            <div key={tpl.id} className="admin-row">
              <div className="admin-row-main">
                <div className="admin-row-title">{tpl.name}</div>
                <div className="admin-row-sub">
                  {enumLabel(t.service_types as Record<string, string>, tpl.service_type)} · {tpl.is_special ? `★ ${t.admin.special}` : t.admin.regular} · {tpl.blocks?.length ?? 0} {t.admin.blocks_count}
                </div>
              </div>
              <div className="admin-row-actions">
                <button
                  onClick={() => { setEditing(tpl); setCreating(false); }}
                  className="admin-btn admin-btn-ghost"
                >
                  {t.admin.edit}
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="admin-btn admin-btn-danger"
                >
                  {t.admin.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="admin-pagination">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="admin-pagination-btn">←</button>
          <span>{t.admin.page} {page} {t.admin.of} {pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages} className="admin-pagination-btn">→</button>
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

  const serviceTypeOptions = Object.entries(t.service_types).map(([value, label]) => ({ value, label }));

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-grid admin-form-grid-2">
        <div className="admin-field">
          <label>{f.name}</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="admin-field">
          <label>{f.service_type}</label>
          <select value={form.service_type} onChange={(e) => update('service_type', e.target.value)}>
            {serviceTypeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>
        <div className="admin-field">
          <label>{f.sub_type}</label>
          <input value={form.sub_type} onChange={(e) => update('sub_type', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.is_special}</label>
          <select value={form.is_special} onChange={(e) => update('is_special', e.target.value)}>
            <option value="false">{t.common.no}</option>
            <option value="true">{t.common.yes}</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="admin-field">
          <label>{f.description}</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} />
        </div>
      </div>
      <div className="admin-form-actions">
        <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary">{t.admin.cancel}</button>
        <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">{t.admin.save}</button>
      </div>
    </form>
  );
}