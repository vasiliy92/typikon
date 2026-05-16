'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import { AdminSelect } from '@/components/AdminSelect';
import { AdminDatePicker } from '@/components/AdminDatePicker';
import type { CalendarEntryResponse, PaginatedResponse } from '@/lib/api';

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
        <p style={{ fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.8125rem', color: 'var(--muted)', padding: '16px 0' }}>
          {t.app.no_results}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((e) => (
            <div key={e.id} className="admin-item-card">
              <div className="admin-item-main">
                <div className="admin-item-title">{e.title_ru}</div>
                <div className="admin-item-sub">
                  {t.admin.date_types[e.date_type as keyof typeof t.admin.date_types] ?? e.date_type} · {t.admin.fields.rank} {e.rank} · {t.fasting_types[e.fasting as keyof typeof t.fasting_types] ?? e.fasting}
                </div>
              </div>
              <div className="admin-item-actions">
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

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-grid admin-form-grid-2">
        <div className="admin-field">
          <label>{f.date_type}</label>
          <AdminSelect
            value={form.date_type}
            onChange={(v) => update('date_type', v)}
            options={[
              { value: 'fixed', label: t.admin.date_types.fixed },
              { value: 'movable', label: t.admin.date_types.movable },
            ]}
          />
        </div>
        <div className="admin-field">
          <label>{f.rank}</label>
          <AdminSelect
            value={form.rank}
            onChange={(v) => update('rank', v)}
            options={[1, 2, 3, 4, 5, 6].map((r) => ({
              value: String(r),
              label: `${r} — ${t.feast_ranks[String(r) as keyof typeof t.feast_ranks] ?? String(r)}`,
            }))}
          />
        </div>
        <div className="admin-field">
          <label>{f.fasting}</label>
          <AdminSelect
            value={form.fasting}
            onChange={(v) => update('fasting', v)}
            options={(['none', 'strict', 'wednesday_friday', 'great_lent', 'nativity_fast', 'apostles_fast', 'dormition_fast', 'cheesefare'] as const).map((ft) => ({
              value: ft,
              label: t.fasting_types[ft],
            }))}
          />
        </div>
        <div className="admin-field">
          <label>{f.pascha_offset}</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="-?[0-9]*"
            value={form.pascha_offset}
            onChange={(e) => update('pascha_offset', e.target.value.replace(/[^0-9-]/g, ''))}
            placeholder="0"
          />
        </div>
      </div>

      {form.date_type === 'fixed' && (
        <div className="admin-form-grid admin-form-grid-2" style={{ marginTop: '12px' }}>
          <div className="admin-field">
            <label>{f.month}</label>
            <AdminSelect
              value={form.month}
              onChange={(v) => update('month', v)}
              options={[
                { value: '', label: '\u2014' },
                ...t.months.map((m: string, i: number) => ({ value: String(i + 1), label: m })),
              ]}
            />
          </div>
          <div className="admin-field">
            <label>{f.day}</label>
            <AdminSelect
              value={form.day}
              onChange={(v) => update('day', v)}
              options={[
                { value: '', label: '\u2014' },
                ...Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
              ]}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: '12px' }}>
        <div className="admin-field">
          <label>{f.title_ru}</label>
          <input value={form.title_ru} onChange={(e) => update('title_ru', e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: '8px' }}>
        <div className="admin-field">
          <label>{f.title_fr}</label>
          <input value={form.title_fr} onChange={(e) => update('title_fr', e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: '8px' }}>
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
