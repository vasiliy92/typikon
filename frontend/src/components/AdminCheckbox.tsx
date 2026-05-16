'use client';

interface AdminCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AdminCheckbox({
  checked,
  onChange,
  label,
  disabled,
  className,
  style,
}: AdminCheckboxProps) {
  return (
    <label
      className={`admin-checkbox${disabled ? ' disabled' : ''}${className ? ' ' + className : ''}`}
      style={style}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="admin-checkbox-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {label}
    </label>
  );
}
