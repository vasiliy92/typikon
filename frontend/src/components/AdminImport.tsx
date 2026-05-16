'use client';

import { useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { apiPost } from '@/lib/api';

interface ValidationSummary {
  total: number;
  valid: number;
  errors: number;
}

interface ValidationResult {
  valid: boolean;
  summary: Record<string, ValidationSummary>;
  errors: Record<string, { index: number; errors: string[] }[]>;
  warnings: Record<string, { index: number; errors: string[] }[]>;
}

export function AdminImport() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setResult('');
    setValidation(null);
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      setPreview(json);
    } catch {
      setPreview(null);
      setResult(t.admin.invalid_json);
    }
  };

  const handleValidate = async () => {
    if (!preview) return;
    setImporting(true);
    setResult('');
    try {
      const resp = await apiPost<ValidationResult>('/admin/import/validate', preview);
      setValidation(resp);
    } catch (err: unknown) {
      setResult(`${t.admin.import_error}: ${err instanceof Error ? err.message : 'Validation failed'}`);
    }
    setImporting(false);
  };

  const handleImport = async () => {
    if (!file || !preview) return;
    setImporting(true);
    setResult('');
    try {
      const resp = await apiPost('/admin/import/batch', preview);
      setResult(`${t.admin.import_success}: ${JSON.stringify(resp)}`);
      setValidation(null);
    } catch (err: unknown) {
      setResult(`${t.admin.import_error}: ${err instanceof Error ? err.message : 'Import failed'}`);
    }
    setImporting(false);
  };

  return (
    <div>
      <div className="admin-section-header">
        <span className="admin-section-title">{t.admin.import_data}</span>
      </div>

      <div
        className="admin-drop-zone"
        onClick={() => fileRef.current?.click()}
      >
        <div className="admin-drop-zone-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ display: 'inline-block' }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="admin-drop-zone-text">
          {file ? file.name : t.admin.import_data}
        </div>
        <div className="admin-drop-zone-hint">.json</div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          style={{ display: 'none' }}
        />
      </div>

      {preview && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontFamily: 'var(--font-heading), Georgia, serif', fontSize: '0.875rem', fontWeight: 500, color: 'var(--fg)', marginBottom: '8px' }}>
            {t.admin.preview}
          </h4>
          <div className="admin-preview">
            {JSON.stringify(preview, null, 2).slice(0, 2000)}
            {JSON.stringify(preview, null, 2).length > 2000 ? '\n... (truncated)' : ''}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleValidate}
              disabled={importing}
              className="admin-btn admin-btn-secondary"
            >
              {importing ? '...' : t.admin.preview}
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="admin-btn admin-btn-primary"
            >
              {importing ? '...' : t.admin.import}
            </button>
          </div>
        </div>
      )}

      {validation && (
        <div
          className="admin-result"
          style={{
            marginTop: '16px',
            borderColor: validation.valid ? 'var(--rule)' : 'var(--destructive)',
            color: validation.valid ? 'var(--fg)' : 'var(--destructive)',
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: '8px' }}>
            {validation.valid ? 'Validation passed' : 'Validation failed'}
          </div>
          {Object.entries(validation.summary).map(([key, summary]) => (
            <div key={key} style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>
              <strong>{key}</strong>: {summary.valid}/{summary.total} valid, {summary.errors} errors
            </div>
          ))}
          {Object.entries(validation.errors).map(([key, errors]) => (
            <div key={`err-${key}`} style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--destructive)' }}>{key} errors:</div>
              {errors.map((e, i) => (
                <div key={i} style={{ fontSize: '0.75rem', marginLeft: '8px', color: 'var(--destructive)' }}>
                  Row {e.index}: {e.errors.join('; ')}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {result && !validation && (
        <div
          className="admin-result"
          style={{
            marginTop: '16px',
            borderColor: result.startsWith(t.admin.import_error) ? 'var(--destructive)' : 'var(--rule)',
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}