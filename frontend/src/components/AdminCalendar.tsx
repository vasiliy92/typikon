'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { CalendarEntryResponse, PaginatedResponse } from '@/lib/api';

/** Look up an enum value in a translation object, with fallback to the raw key. */
const enumLabel = (obj: Record<string, string>, key: string): string => obj[key] ?? key;

export function AdminCalendar() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, mutate } = useApi<PaginatedResponse<CalendarEntryResponse>>(
    `/admin/calendar?page=${page}&page_size=20`
  );
  const [editing, setEditing] = useState<CalendarEntryResponse | null>(null);
  const [creating, setCreating] = useState(false);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.ceil(total / 20);

  const handleDelete = async (id: number) => {
    if (!confirm(t.app.confirm_delete)) return;
    await apiDelete(`/admin/calendar/${id}`);
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
        <CalendarForm
          entry={editing}
          onSave={async (payload) => {
            if (editing) {
              await apiPut(`/admin/calendar/${editing.id}`, payload);
            } else {
              await apiPost('/admin/calendar', payload);
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
          {items.map((e) => (
            <div key={e.id} className="admin-row">
              <div className="admin-row-main">
                <div className="admin-row-title">{e.title_ru}</div>
                <div className="admin-row-sub">
                  {enumLabel(t.admin.date_types as Record<string, string>, e.date_type)} · {enumLabel(t.feast_ranks as Record<string, string>, e.rank)} · {enumLabel(t.fasting_types as Record<string, string>, e.fasting)}
                </div>
              </div>
              <div className="admin-row-actions">
                <button
                  onClick={() => { setEditing(e); setCreating(false); }}
                  className="admin-btn admin-btn-ghost"
                >
                  {t.admin.edit}
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
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
            ←
          </button>
          <span>{t.admin.page} {page} {t.admin.of} {pages}</span>
          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            className="admin-pagination-btn"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

function CalendarForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: CalendarEntryResponse | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const f = t.admin.fields;
  const [form, setForm] = useState<Record<string, string>>({
    date_type: entry?.date_type ?? 'fixed',
    month: String(entry?.month ?? ''),
    day: String(entry?.day ?? ''),
    pascha_offset: String(entry?.pascha_offset ?? ''),
    title_ru: entry?.title_ru ?? '',
    title_fr: entry?.title_fr ?? '',
    rank: entry?.rank ?? '1',
    fasting: entry?.fasting ?? 'none',
    rubric: entry?.rubric ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (['month', 'day', 'pascha_offset', 'rank'].includes(k)) {
        payload[k] = v ? Number(v) : null;
      } else {
        payload[k] = v || null;
      }
    }
    await onSave(payload);
    setSaving(false);
  };

  const dateTypeOptions = Object.entries(t.admin.date_types).map(([value, label]) => ({ value, label }));
  const rankOptions = Object.entries(t.feast_ranks).map(([value, label]) => ({ value, label }));
  const fastingOptions = Object.entries(t.fasting_types).map(([value, label]) => ({ value, label }));

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-grid admin-form-grid-2">
        <div className="admin-field">
          <label>{f.date_type}</label>
          <select value={form.date_type} onChange={(e) => update('date_type', e.target.value)}>
            {dateTypeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>
        <div className="admin-field">
          <label>{f.rank}</label>
          <select value={form.rank} onChange={(e) => update('rank', e.target.value)}>
            {rankOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>
        <div className="admin-field">
          <label>{f.month}</label>
          <input type="number" value={form.month} onChange={(e) => update('month', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.day}</label>
          <input type="number" value={form.day} onChange={(e) => update('day', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.pascha_offset}</label>
          <input type="number" value={form.pascha_offset} onChange={(e) => update('pascha_offset', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.fasting}</label>
          <select value={form.fasting} onChange={(e) => update('fasting', e.target.value)}>
            {fastingOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div className="admin-field">
          <label>{f.title_ru}</label>
          <input value={form.title_ru} onChange={(e) => update('title_ru', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.title_fr}</label>
          <input value={form.title_fr} onChange={(e) => update('title_fr', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.rubric}</label>
          <input value={form.rubric} onChange={(e) => update('rubric', e.target.value)} />
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