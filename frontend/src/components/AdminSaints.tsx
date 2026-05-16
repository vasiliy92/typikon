'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import { AdminSelect } from '@/components/AdminSelect';
import type { SaintResponse, PaginatedResponse } from '@/lib/api';

export function AdminSaints() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, mutate } = useApi<PaginatedResponse<SaintResponse>>(
    `/admin/saints?page=${page}&page_size=20`
  );
  const [editing, setEditing] = useState<SaintResponse | null>(null);
  const [creating, setCreating] = useState(false);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.ceil(total / 20);

  const handleDelete = async (id: number) => {
    if (!confirm(t.app.confirm_delete)) return;
    await apiDelete(`/admin/saints/${id}`);
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
        <SaintForm
          saint={editing}
          onSave={async (payload) => {
            if (editing) {
              await apiPut(`/admin/saints/${editing.id}`, payload);
            } else {
              await apiPost('/admin/saints', payload);
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
          {items.map((s) => (
            <div key={s.id} className="admin-item-card">
              <div className="admin-item-main">
                <div className="admin-item-title">{s.name_ru}</div>
                <div className="admin-item-sub">
                  {s.name_fr ?? ''} · {s.categories?.join(', ')}
                </div>
              </div>
              <div className="admin-item-actions">
                <button
                  onClick={() => { setEditing(s); setCreating(false); }}
                  className="admin-btn admin-btn-ghost"
                >
                  {t.admin.edit}
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
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
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="admin-pagination-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span>{t.admin.page} {page} {t.admin.of} {pages}</span>
          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            className="admin-pagination-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function SaintForm({
  saint,
  onSave,
  onCancel,
}: {
  saint: SaintResponse | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const f = t.admin.fields;

  const [form, setForm] = useState<Record<string, string>>({
    name_ru: saint?.name_ru ?? '',
    name_fr: saint?.name_fr ?? '',
    categories: saint?.categories?.join(',') ?? '',
    feast_month: String(saint?.feast_month ?? ''),
    feast_day: String(saint?.feast_day ?? ''),
    troparion_ru: saint?.troparion_ru ?? '',
    troparion_fr: saint?.troparion_fr ?? '',
    troparion_tone: saint?.troparion_tone ?? '',
    kontakion_ru: saint?.kontakion_ru ?? '',
    kontakion_fr: saint?.kontakion_fr ?? '',
    kontakion_tone: saint?.kontakion_tone ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (['feast_month', 'feast_day'].includes(k)) {
        payload[k] = v ? Number(v) : null;
      } else if (k === 'categories') {
        payload[k] = v ? v.split(',').map((s: string) => s.trim()) : [];
      } else {
        payload[k] = v || null;
      }
    }
    await onSave(payload);
    setSaving(false);
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-grid admin-form-grid-2">
        <div className="admin-field">
          <label>{f.name_ru}</label>
          <input value={form.name_ru} onChange={(e) => update('name_ru', e.target.value)} required />
        </div>
        <div className="admin-field">
          <label>{f.name_fr}</label>
          <input value={form.name_fr} onChange={(e) => update('name_fr', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.categories}</label>
          <input value={form.categories} onChange={(e) => update('categories', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.feast_month}</label>
          <input type="number" min="1" max="12" value={form.feast_month} onChange={(e) => update('feast_month', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.feast_day}</label>
          <input type="number" min="1" max="31" value={form.feast_day} onChange={(e) => update('feast_day', e.target.value)} />
        </div>
      </div>

      <details className="admin-details" style={{ marginTop: '12px' }}>
        <summary>{f.troparion}</summary>
        <div className="admin-form-grid admin-form-grid-2" style={{ marginTop: '8px' }}>
          <div className="admin-field">
            <label>{f.troparion_ru}</label>
            <textarea value={form.troparion_ru} onChange={(e) => update('troparion_ru', e.target.value)} rows={3} />
          </div>
          <div className="admin-field">
            <label>{f.troparion_fr}</label>
            <textarea value={form.troparion_fr} onChange={(e) => update('troparion_fr', e.target.value)} rows={3} />
          </div>
          <div className="admin-field">
            <label>{f.troparion_tone}</label>
            <input value={form.troparion_tone} onChange={(e) => update('troparion_tone', e.target.value)} />
          </div>
        </div>
      </details>

      <details className="admin-details" style={{ marginTop: '8px' }}>
        <summary>{f.kontakion}</summary>
        <div className="admin-form-grid admin-form-grid-2" style={{ marginTop: '8px' }}>
          <div className="admin-field">
            <label>{f.kontakion_ru}</label>
            <textarea value={form.kontakion_ru} onChange={(e) => update('kontakion_ru', e.target.value)} rows={3} />
          </div>
          <div className="admin-field">
            <label>{f.kontakion_fr}</label>
            <textarea value={form.kontakion_fr} onChange={(e) => update('kontakion_fr', e.target.value)} rows={3} />
          </div>
          <div className="admin-field">
            <label>{f.kontakion_tone}</label>
            <input value={form.kontakion_tone} onChange={(e) => update('kontakion_tone', e.target.value)} />
          </div>
        </div>
      </details>

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