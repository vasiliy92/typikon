'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
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
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t.admin.total}: {total}
        </span>
        <button
          onClick={() => { setCreating(true); setEditing(null); }}
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
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
        <p className="text-sm py-4" style={{ color: 'var(--muted-foreground)' }}>
          {t.app.no_results}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>
                  {e.title_ru}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {e.date_type} · {e.rank} · {e.fasting}
                </div>
              </div>
              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => { setEditing(e); setCreating(false); }}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: 'var(--primary)' }}
                >
                  {t.admin.edit}
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: 'var(--destructive)' }}
                >
                  {t.admin.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded text-sm disabled:opacity-30"
            style={{ background: 'var(--muted-bg)', color: 'var(--foreground)' }}
          >
            ←
          </button>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t.admin.page} {page} {t.admin.of} {pages}
          </span>
          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            className="px-3 py-1 rounded text-sm disabled:opacity-30"
            style={{ background: 'var(--muted-bg)', color: 'var(--foreground)' }}
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

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 mb-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="date_type" form={form} setForm={setForm} />
        <Field label="rank" form={form} setForm={setForm} />
        <Field label="month" form={form} setForm={setForm} />
        <Field label="day" form={form} setForm={setForm} />
        <Field label="pascha_offset" form={form} setForm={setForm} />
        <Field label="fasting" form={form} setForm={setForm} />
      </div>
      <Field label="title_ru" form={form} setForm={setForm} />
      <Field label="title_fr" form={form} setForm={setForm} />
      <Field label="rubric" form={form} setForm={setForm} />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t.admin.cancel}
        </button>
        <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          {t.admin.save}
        </button>
      </div>
    </form>
  );
}

function Field({ label, form, setForm }: { label: string; form: Record<string, string>; setForm: (f: Record<string, string>) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
      <input
        value={form[label] ?? ''}
        onChange={(e) => setForm({ ...form, [label]: e.target.value })}
        className="w-full rounded border px-2 py-1 text-sm"
        style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }}
      />
    </div>
  );
}