{'use client';

import { useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { apiPost, refreshApi } from '@/lib/api';
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImportResult {
  total_created: number;
  total_errors: number;
  details: Record<string, { created: number; errors: number }>;
}

export default function AdminImport() {
  const { t } = useI18n();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('calendar');
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const IMPORT_TYPES = [
    { value: 'calendar', label: 'Calendar Entries' },
    { value: 'saints', label: 'Saints' },
    { value: 'blocks', label: 'Service Blocks' },
    { value: 'templates', label: 'Service Templates' },
    { value: 'lections', label: 'Lections' },
    { value: 'lection_assignments', label: 'Lection Assignments' },
    { value: 'markov_rules', label: 'Markov Rules' },
    { value: 'kathisma_rules', label: 'Kathisma Rules' },
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setPreview(JSON.stringify(parsed, null, 2).slice(0, 2000));
      setError(null);
    } catch (err: any) {
      setError('Invalid JSON file: ' + err.message);
      setPreview(null);
    }
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await apiPost<ImportResult>(`/api/v1/admin/import/${selectedType}`, data);
      setResult(res);
      refreshApi(`/api/v1/admin/${selectedType}?page=1&page_size=25`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handlePasteImport = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      const data = JSON.parse(clipText);
      setPreview(JSON.stringify(data, null, 2).slice(0, 2000));
      setImporting(true);
      setError(null);
      setResult(null);

      const res = await apiPost<ImportResult>(`/api/v1/admin/import/${selectedType}`, data);
      setResult(res);
      refreshApi(`/api/v1/admin/${selectedType}?page=1&page_size=25`);
    } catch (err: any) {
      setError('Clipboard read failed or invalid JSON: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="service-block space-y-4">
        <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--primary)' }}>
          {t.admin.import_data || 'Import Data'}
        </h3>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Import liturgical data from JSON files. Each import type has its own expected schema.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-display font-medium block mb-1">Import Type</label>
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPreview(null); setResult(null); setError(null); }}
              className="input-field"
            >
              {IMPORT_TYPES.map(it => (
                <option key={it.value} value={it.value}>{it.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-display font-medium block mb-1">JSON File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="input-field text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleImport}
            disabled={importing || !preview}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? 'Importing...' : t.app.import || 'Import'}
          </button>
          <button
            onClick={handlePasteImport}
            disabled={importing}
            className="btn-outline inline-flex items-center gap-2 text-sm"
          >
            <FileJson size={14} />
            Paste from Clipboard
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg flex items-start gap-2 text-sm" style={{ background: 'oklch(0.95 0.05 25)', color: 'oklch(0.5 0.2 25)' }}>
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="p-3 rounded-lg flex items-start gap-2 text-sm" style={{ background: 'oklch(0.95 0.05 145)', color: 'oklch(0.4 0.15 145)' }}>
          <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-display font-semibold">
              Import complete: {result.total_created} created, {result.total_errors} errors
            </div>
            {Object.entries(result.details).length > 0 && (
              <div className="mt-1 space-y-0.5 text-xs">
                {Object.entries(result.details).map(([key, val]) => (
                  <div key={key}>
                    {key}: {val.created} created, {val.errors} errors
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {preview && (
        <div className="service-block">
          <h4 className="text-sm font-display font-semibold mb-2" style={{ color: 'var(--secondary)' }}>Preview</h4>
          <pre className="text-xs overflow-x-auto p-2 rounded" style={{ background: 'var(--muted)', maxHeight: '300px' }}>
            {preview}
          </pre>
        </div>
      )}

      <div className="service-block">
        <h4 className="text-sm font-display font-semibold mb-2" style={{ color: 'var(--secondary)' }}>Expected JSON Schemas</h4>
        <div className="space-y-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <div>
            <code className="font-mono" style={{ color: 'var(--primary)' }}>calendar</code> — Array of{' '}
            <code>{`{ date_type, month, day, pascha_offset, title_csy, title_fr, title_en, rank, tone, fasting }`}</code>
          </div>
          <div>
            <code className="font-mono" style={{ color: 'var(--primary)' }}>saints</code> — Array of{' '}
            <code>{`{ name_csy, name_fr, name_en, categories[], feast_month, feast_day, troparion_csy, ... }`}</code>
          </div>
          <div>
            <code className="font-mono" style={{ color: 'var(--primary)' }}>blocks</code> — Array of{' '}
            <code>{`{ name, block_type, content_csy, content_fr, content_en, rubric_csy, ... }`}</code>
          </div>
          <div>
            <code className="font-mono" style={{ color: 'var(--primary)' }}>templates</code> — Array of{' '}
            <code>{`{ name, service_type, description, blocks: [{ block_id, block_order, is_optional, conditions }] }`}</code>
          </div>
          <div>
            <code className="font-mono" style={{ color: 'var(--primary)' }}>lections</code> — Array of{' '}
            <code>{`{ book, zachalo, title_csy, title_fr, text_csy, text_fr }`}</code>
          </div>
          <div>
            <code className="font-mono" style={{ color: 'var(--primary)' }}>lection_assignments</code> — Array of{' '}
            <code>{`{ lection_id, moveable_key, fixed_month, fixed_day, service_type, rank_min }`}</code>
          </div>
          <div>
            <code className="font-mono" style={{ color: 'var(--primary)' }}>markov_rules</code> — Array of{' '}
            <code>{`{ rule_name, conditions: {}, overrides: {} }`}</code>
          </div>
          <div>
            <code className="font-mono" style={{ color: 'var(--primary)' }}>kathisma_rules</code> — Array of{' '}
            <code>{`{ day_of_week, period, kathisma_numbers[] }`}</code>
          </div>
        </div>
      </div>
    </div>
  );
}