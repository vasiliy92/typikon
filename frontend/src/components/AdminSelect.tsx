'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AdminSelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export function AdminSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  style,
  id,
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, handleClickOutside]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className={`admin-select${className ? ' ' + className : ''}`}
      style={style}
      id={id}
    >
      <button
        type="button"
        className={`admin-select-trigger${open ? ' open' : ''}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      >
        <span className={selectedOption ? '' : 'placeholder'}>
          {selectedOption ? selectedOption.label : placeholder || 'Sélectionner...'}
        </span>
        <svg
          className="admin-select-arrow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="admin-select-dropdown open">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`admin-select-option${opt.value === value ? ' active' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
