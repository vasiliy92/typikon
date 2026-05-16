'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete, refreshApi, PaginatedResponse, ServiceTemplateResponse } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronRight } from 'lucide-react';

export default function AdminTemplates() {
  const { t, locale } = useI18n();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ServiceTemplateResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading, error } = useApi<PaginatedResponse<ServiceTemplateResponse>>(
    `/api/v1/admin/templates?page=${page}&page_size=25`
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiPost('/api/v1/admin/templates', {
        name: fd.get('name'),
        service_type: fd.get('service_type'),
        description: fd.get('description') || null,
      });
      setCreating(false);
      refreshApi(`/api/v1/admin/templates?page=${page}&page_size=25`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    try {
      await apiPut(`/api/v1/admin/templates/${editing.id}`, {
        name: fd.get('name'),
        service_type: fd.get('service_type'),
        description: fd.get('description') || null,
      });
      setEditing(null);
      refreshApi(`/api/v1/admin/templates?page=${page}&page_size=25`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.app.confirm_delete)) return;
    try {
      await apiDelete(`/api/v1/admin/templates/${id}`);
      refreshApi(`/api/v1/admin/templates?page=${page}&page_size=25`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const SERVICE_TYPES = [
    'vespers', 'matins', 'liturgy', 'hours', 'all_night_vigil',
    'great_compline', 'small_compline', 'midnight_office',
    'typika', 'moleben', 'panikhida', 'akathist',
  ];

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
          <input name="name" placeholder="Template name" className="input-field" required />
          <select name="service_type" className="input-field" required>
            <option value="">Select service type...</option>
            {SERVICE_TYPES.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <textarea name="description" placeholder="Description" rows={2} className="input-field" />
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
          <input name="name" defaultValue={editing.name} className="input-field" required />
          <select name="service_type" defaultValue={editing.service_type} className="input-field" required>
            {SERVICE_TYPES.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <textarea name="description" defaultValue={editing.description || ''} rows={2} className="input-field" />
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
              <th>Name</th>
              <th>Service Type</th>
              <th>Blocks</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((tmpl) => (
              <>
                <tr key={tmpl.id}>
                  <td className="font-mono text-xs">{tmpl.id}</td>
                  <td className="text-sm font-display">{tmpl.name}</td>
                  <td className="text-xs" style={{ color: 'var(--secondary)' }}>{tmpl.service_type}</td>
                  <td className="text-xs">{tmpl.blocks?.length || 0}</td>
                  <td className="flex gap-1">
                    <button
                      onClick={() => setExpandedId(expandedId === tmpl.id ? null : tmpl.id)}
                      className="p-1 rounded hover:bg-[var(--muted)]"
                    >
                      {expandedId === tmpl.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <button onClick={() => setEditing(tmpl)} className="p-1 rounded hover:bg-[var(--muted)]">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(tmpl.id)} className="p-1 rounded hover:bg-[var(--muted)]" style={{ color: 'oklch(0.6 0.2 25)' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
                {expandedId === tmpl.id && tmpl.blocks && tmpl.blocks.length > 0 && (
                  <tr key={`${tmpl.id}-blocks`}>
                    <td colSpan={5} className="p-0">
                      <div className="p-3 space-y-1" style={{ background: 'var(--muted)' }}>
                        <div className="text-xs font-display font-semibold mb-2" style={{ color: 'var(--secondary)' }}>
                          Template Blocks
                        </div>
                        {tmpl.blocks
                          .sort((a, b) => a.block_order - b.block_order)
                          .map((block, idx) => (
                            <div key={idx} className="flex gap-2 text-xs items-center py-1 px-2 rounded" style={{ background: 'var(--background)' }}>
                              <span className="font-mono" style={{ color: 'var(--muted-foreground)' }}>#{block.block_order}</span>
                              <span className="font-display">{block.block_name}</span>
                              {block.is_optional && <span className="text-xs px-1 rounded" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>opt</span>}
                              {block.conditions && Object.keys(block.conditions).length > 0 && (
                                <span className="text-xs px-1 rounded" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>cond</span>
                              )}
                            </div>
                          ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
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