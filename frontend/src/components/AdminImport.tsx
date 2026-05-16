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
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>{t.admin.import_data}</label>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          className="block w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium"
          style={{ color: 'var(--muted-foreground)' }}
        />
      </div>

      {preview && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>{t.admin.preview}</h4>
          <pre className="rounded-lg border p-3 text-xs overflow-auto max-h-64" style={{ borderColor: 'var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }}>
            {JSON.stringify(preview, null, 2).slice(0, 2000)}
            {JSON.stringify(preview, null, 2).length > 2000 ? '\n... (truncated)' : ''}
          </pre>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleValidate}
              disabled={importing}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
            >
              {importing ? '...' : t.admin.preview}
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {importing ? '...' : t.admin.import}
            </button>
          </div>
        </div>
      )}

      {validation && (
        <div className="mb-4 rounded-lg border p-3" style={{ borderColor: validation.valid ? 'var(--border)' : 'var(--destructive)' }}>
          <h4 className="text-sm font-medium mb-2" style={{ color: validation.valid ? 'var(--foreground)' : 'var(--destructive)' }}>
            {validation.valid ? '✓ Validation passed' : '✗ Validation failed'}
          </h4>
          {Object.entries(validation.summary).map(([key, summary]) => (
            <div key={key} className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
              <strong>{key}</strong>: {summary.valid}/{summary.total} valid, {summary.errors} errors
            </div>
          ))}
          {Object.entries(validation.errors).map(([key, errors]) => (
            <div key={`err-${key}`} className="mt-2">
              <div className="text-xs font-medium" style={{ color: 'var(--destructive)' }}>{key} errors:</div>
              {errors.map((e, i) => (
                <div key={i} className="text-xs ml-2" style={{ color: 'var(--destructive)' }}>
                  Row {e.index}: {e.errors.join('; ')}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="rounded-lg border p-3 text-sm" style={{ borderColor: result.startsWith(t.admin.import_error) ? 'var(--destructive)' : 'var(--border)', color: 'var(--foreground)' }}>
          {result}
        </div>
      )}
    </div>
  );
}