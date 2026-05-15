'use client';

import { useState } from 'react';
import { useI18n } from '../[locale]/layout';
import { useApi, apiPost, apiPut, apiDelete, refreshApi, PaginatedResponse, CalendarEntryResponse } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

export default function AdminCalendar() {
  const { t, locale } = useI18n();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CalendarEntryResponse | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useApi<PaginatedResponse<CalendarEntryResponse>>(
    `/api/v1/admin/calendar?page=${page}&page_size=25`
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dateType = fd.get('date_type') as string;
    try {
      await apiPost('/api/v1/admin/calendar', {
        date_type: dateType,
        month: dateType === 'fixed' ? Number(fd.get('month')) : null,
        day: dateType === 'fixed' ? Number(fd.get('day')) : null,
        pascha_offset: dateType === 'movable' ? Number(fd.get('pascha_offset')) : null,
        title_csy: fd.get('title_csy'),
        title_fr: fd.get('title_fr') || null,
        title_en: fd.get('title_en') || null,
        rank: fd.get('rank') || '1',
        tone: fd.get('tone') ? Number(fd.get('tone')) : null,
        fasting: fd.get('fasting') || 'none',
      });
      setCreating(false);
      refreshApi(`/api/v1/admin/calendar?page=${page}&page_size=25`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    try {
      await apiPut(`/api/v1/admin/calendar/${editing.id}`, {
        title_csy: fd.get('title_csy'),
        title_fr: fd.get('title_fr') || null,
        title_en: fd.get('title_en') || null,
        rank: fd.get('rank') || editing.rank,
        tone: fd.get('tone') ? Number(fd.get('tone')) : null,
        fasting: fd.get('fasting') || editing.fasting,
      });
      setEditing(null);
      refreshApi(`/api/v1/admin/calendar?page=${page}&page_size=25`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.app.confirm_delete)) return;
    try {
      await apiDelete(`/api/v1/admin/calendar/${id}`);
      refreshApi(`/api/v1/admin/calendar?page=${page}&page_size=25`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.app.loading}</div>;
  if (error) return <div className="text-sm" style={{ color: 'oklch(0.6 0.2 25)' }}>{error.message}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <button onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-1 text-sm">
          <Plus size={14} /> {t.app.create}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="service-block space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{t.app.create}</h3>
            <button type="button" onClick={() => setCreating(false)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select name="date_type" className="input-field" required>
              <option value="fixed">Fixed</option>
              <option value="movable">Movable</option>
            </select>
            <select name="rank" className="input-field">
              {Object.entries(t.feast_ranks).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input name="month" type="number" min="1" max="12" placeholder="Month (fixed)" className="input-field" />
            <input name="day" type="number" min="1" max="31" placeholder="Day (fixed)" className="input-field" />
            <input name="pascha_offset" type="number" placeholder="Days from Pascha (movable)" className="input-field" />
            <input name="tone" type="number" min="1" max="8" placeholder="Tone" className="input-field" />
            <select name="fasting" className="input-field">
              {Object.entries(t.fasting_types).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <input name="title_csy" placeholder="Title (Church Slavonic)" className="input-field" required />
          <input name="title_fr" placeholder="Titre (Français)" className="input-field" />
          <input name="title_en" placeholder="Title (English)" className="input-field" />
          <button type="submit" className="btn-primary text-sm inline-flex items-center gap-1">
            <Check size={14} /> {t.app.save}
          </button>
        </form>
      )}

      {editing && (
        <form onSubmit={handleUpdate} className="service-block space-y-3 border-l-4" style={{ borderLeftColor: 'var(--secondary)' }}>
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{t.app.edit} #{editing.id}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select name="rank" defaultValue={editing.rank} className="input-field">
              {Object.entries(t.feast_ranks).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input name="tone" type="number" min="1" max="8" defaultValue={editing.tone || ''} placeholder="Tone" className="input-field" />
          </div>
          <input name="title_csy" defaultValue={editing.title_csy} className="input-field" required />
          <input name="title_fr" defaultValue={editing.title_fr || ''} className="input-field" />
          <input name="title_en" defaultValue={editing.title_en || ''} className="input-field" />
          <button type="submit" className="btn-primary text-sm inline-flex items-center gap-1">
            <Check size={14} /> {t.app.save}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Date</th>
              <th>Title</th>
              <th>Rank</th>
              <th>Tone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((entry) => (
              <tr key={entry.id}>
                <td className="font-mono text-xs">{entry.id}</td>
                <td className="text-xs">{entry.date_type}</td>
                <td className="text-xs">
                  {entry.date_type === 'fixed'
                    ? `${entry.month}/${entry.day}`
                    : `P${entry.pascha_offset! >= 0 ? '+' : ''}${entry.pascha_offset}`}
                </td>
                <td className="text-sm max-w-[250px] truncate">
                  {locale === 'csy' ? entry.title_csy : (entry.title_fr || entry.title_csy)}
                </td>
                <td><span className={`feast-rank-badge feast-rank-${entry.rank}`}>{entry.rank}</span></td>
                <td>{entry.tone || '—'}</td>
                <td className="flex gap-1">
                  <button onClick={() => setEditing(entry)} className="p-1 rounded hover:bg-[var(--muted)]">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(entry.id)} className="p-1 rounded hover:bg-[var(--muted)]" style={{ color: 'oklch(0.6 0.2 25)' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-outline text-xs">←</button>
          <span>{t.admin.page} {data.page} {t.admin.of} {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="btn-outline text-xs">→</button>
          <span>({data.total} {t.admin.total})</span>
        </div>
      )}
    </div>
  );
}