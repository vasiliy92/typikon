'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function formatDateFR(year: number, month: number, day: number): string {
  return `${day} ${MONTHS_FR[month].toLowerCase()} ${year}`;
}

function parseDateString(dateStr: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, month: m - 1, day: d };
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ---------- Calendar Grid ----------

interface CalendarGridProps {
  year: number;
  month: number;
  selectedDate: { year: number; month: number; day: number } | null;
  onSelect: (year: number, month: number, day: number) => void;
  todayYear: number;
  todayMonth: number;
  todayDate: number;
}

function CalendarGrid({ year, month, selectedDate, onSelect, todayYear, todayMonth, todayDate }: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const cells: { day: number; outside: boolean; outsideMonth: number; outsideYear: number }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    let pm = month - 1;
    let py = year;
    if (pm < 0) { pm = 11; py--; }
    cells.push({ day: d, outside: true, outsideMonth: pm, outsideYear: py });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, outside: false, outsideMonth: month, outsideYear: year });
  }

  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let i = 1; i <= remaining; i++) {
    let nm = month + 1;
    let ny = year;
    if (nm > 11) { nm = 0; ny++; }
    cells.push({ day: i, outside: true, outsideMonth: nm, outsideYear: ny });
  }

  return (
    <div className="cal-days">
      {cells.map((cell, idx) => {
        const isToday = !cell.outside && cell.outsideYear === todayYear && cell.outsideMonth === todayMonth && cell.day === todayDate;
        const isSelected = selectedDate && selectedDate.year === cell.outsideYear && selectedDate.month === cell.outsideMonth && selectedDate.day === cell.day;
        let cls = 'cal-day';
        if (cell.outside) cls += ' outside';
        if (isToday) cls += ' today';
        if (isSelected) cls += ' selected';
        return (
          <button
            key={idx}
            type="button"
            className={cls}
            onClick={() => onSelect(cell.outsideYear, cell.outsideMonth, cell.day)}
          >
            {cell.day}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Month/Year Picker ----------

interface MonthYearPickerProps {
  year: number;
  currentMonth: number;
  onSelect: (year: number, month: number) => void;
  onNavigateYear: (delta: number) => void;
}

function MonthYearPicker({ year, currentMonth, onSelect, onNavigateYear }: MonthYearPickerProps) {
  return (
    <>
      <div className="cal-year-nav">
        <button type="button" className="cal-nav-btn" onClick={() => onNavigateYear(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="cal-year-label">{year}</span>
        <button type="button" className="cal-nav-btn" onClick={() => onNavigateYear(1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
      <div className="cal-month-grid">
        {MONTHS_SHORT.map((m, i) => (
          <button
            key={i}
            type="button"
            className={`cal-month-option${i === currentMonth ? ' active' : ''}`}
            onClick={() => onSelect(year, i)}
          >
            {m}
          </button>
        ))}
      </div>
    </>
  );
}

// ---------- Inline Calendar (for main page) ----------

interface AdminInlineCalendarProps {
  value?: string | null;
  onChange?: (date: string | null) => void;
  defaultYear?: number;
  defaultMonth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AdminInlineCalendar({
  value,
  onChange,
  defaultYear,
  defaultMonth,
  className,
  style,
}: AdminInlineCalendarProps) {
  const now = new Date();
  const parsed = parseDateString(value);

  const [viewYear, setViewYear] = useState(parsed?.year ?? defaultYear ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? defaultMonth ?? now.getMonth());
  const [selectedDate, setSelectedDate] = useState(parsed);
  const [mode, setMode] = useState<'calendar' | 'monthpicker'>('calendar');

  const handleSelect = (year: number, month: number, day: number) => {
    setSelectedDate({ year, month, day });
    setViewYear(year);
    setViewMonth(month);
    onChange?.(toDateString(year, month, day));
  };

  const navigateMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
    setMode('calendar');
  };

  const navigateYear = (delta: number) => {
    setViewYear((prev) => prev + delta);
  };

  const selectMonthFromPicker = (year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
    setMode('calendar');
  };

  const goToToday = () => {
    const ty = now.getFullYear();
    const tm = now.getMonth();
    const td = now.getDate();
    setViewYear(ty);
    setViewMonth(tm);
    setSelectedDate({ year: ty, month: tm, day: td });
    onChange?.(toDateString(ty, tm, td));
  };

  return (
    <div className={`inline-calendar${className ? ' ' + className : ''}`} style={style}>
      {mode === 'calendar' ? (
        <>
          <div className="cal-header">
            <button type="button" className="cal-nav-btn" onClick={() => navigateMonth(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="cal-month-year" onClick={() => setMode('monthpicker')}>
              {MONTHS_FR[viewMonth]} {viewYear}
            </span>
            <button type="button" className="cal-nav-btn" onClick={() => navigateMonth(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
          <div className="cal-weekdays">
            {WEEKDAYS.map((d) => <div key={d} className="cal-weekday">{d}</div>)}
          </div>
          <CalendarGrid
            year={viewYear}
            month={viewMonth}
            selectedDate={selectedDate}
            onSelect={handleSelect}
            todayYear={now.getFullYear()}
            todayMonth={now.getMonth()}
            todayDate={now.getDate()}
          />
          <div className="cal-footer">
            <button type="button" className="cal-today-btn" onClick={goToToday}>
              Aujourd&apos;hui
            </button>
            <span />
          </div>
        </>
      ) : (
        <MonthYearPicker
          year={viewYear}
          currentMonth={viewMonth}
          onSelect={selectMonthFromPicker}
          onNavigateYear={navigateYear}
        />
      )}
    </div>
  );
}

// ---------- Dropdown Date Picker (for admin forms) ----------

interface AdminDatePickerProps {
  value: string | null | undefined;
  onChange: (date: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export function AdminDatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  style,
  id,
}: AdminDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'calendar' | 'monthpicker'>('calendar');
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const parsed = parseDateString(value);

  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? now.getMonth());
  const [selectedDate, setSelectedDate] = useState(parsed);

  // Sync external value changes
  useEffect(() => {
    const p = parseDateString(value);
    setSelectedDate(p);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [value]);

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

  const handleSelect = (year: number, month: number, day: number) => {
    setSelectedDate({ year, month, day });
    setViewYear(year);
    setViewMonth(month);
    onChange(toDateString(year, month, day));
    setOpen(false);
  };

  const navigateMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
    setMode('calendar');
  };

  const navigateYear = (delta: number) => {
    setViewYear((prev) => prev + delta);
  };

  const selectMonthFromPicker = (year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
    setMode('calendar');
  };

  const goToToday = () => {
    const ty = now.getFullYear();
    const tm = now.getMonth();
    const td = now.getDate();
    setViewYear(ty);
    setViewMonth(tm);
    setSelectedDate({ year: ty, month: tm, day: td });
    onChange(toDateString(ty, tm, td));
    setOpen(false);
  };

  const clearDate = () => {
    setSelectedDate(null);
    onChange(null);
    setOpen(false);
  };

  const triggerText = selectedDate
    ? formatDateFR(selectedDate.year, selectedDate.month, selectedDate.day)
    : (placeholder || 'Sélectionner une date...');

  return (
    <div
      ref={containerRef}
      className={`datepicker${className ? ' ' + className : ''}`}
      style={style}
      id={id}
    >
      <button
        type="button"
        className={`datepicker-trigger${open ? ' open' : ''}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
      >
        <svg
          style={{ width: 14, height: 14, color: 'var(--muted)', flexShrink: 0 }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className={selectedDate ? 'trigger-text' : 'trigger-text placeholder'}>
          {triggerText}
        </span>
      </button>
      {open && (
        <div className="datepicker-calendar open">
          {mode === 'calendar' ? (
            <>
              <div className="cal-header">
                <button type="button" className="cal-nav-btn" onClick={() => navigateMonth(-1)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <span className="cal-month-year" onClick={() => setMode('monthpicker')}>
                  {MONTHS_FR[viewMonth]} {viewYear}
                </span>
                <button type="button" className="cal-nav-btn" onClick={() => navigateMonth(1)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
              <div className="cal-weekdays">
                {WEEKDAYS.map((d) => <div key={d} className="cal-weekday">{d}</div>)}
              </div>
              <CalendarGrid
                year={viewYear}
                month={viewMonth}
                selectedDate={selectedDate}
                onSelect={handleSelect}
                todayYear={now.getFullYear()}
                todayMonth={now.getMonth()}
                todayDate={now.getDate()}
              />
              <div className="cal-footer">
                <button type="button" className="cal-today-btn" onClick={goToToday}>
                  Aujourd&apos;hui
                </button>
                <button type="button" className="cal-clear-btn" onClick={clearDate}>
                  Effacer
                </button>
              </div>
            </>
          ) : (
            <MonthYearPicker
              year={viewYear}
              currentMonth={viewMonth}
              onSelect={selectMonthFromPicker}
              onNavigateYear={navigateYear}
            />
          )}
        </div>
      )}
    </div>
  );
}
