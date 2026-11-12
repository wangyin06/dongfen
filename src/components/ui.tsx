import {
  useEffect,
  useId,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Minus, Plus, X, type LucideIcon } from 'lucide-react';
import type { CategoryId } from '../types';
import { CATEGORY_META } from '../data/exercises';

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  headerRight,
  children,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('no-scroll');
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="sheet-layer">
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <section className={`sheet ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="sheet-grab" aria-hidden="true" />
        <header className="sheet-head">
          <div className="sheet-heading">
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="sheet-head-actions">
            {headerRight}
            <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
              <X size={20} />
            </button>
          </div>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  tone = 'default',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  tone?: 'default' | 'danger';
}) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('no-scroll');
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="dialog-layer">
      <div className="dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <section className={`dialog-card ${tone === 'danger' ? 'is-danger' : ''}`} role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="dialog-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </div>
        <h2 id={titleId}>{title}</h2>
        <div className="dialog-content">{children}</div>
        {footer ? <footer className="dialog-actions">{footer}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}

export function CategoryBadge({ category, subtle = false }: { category: CategoryId; subtle?: boolean }) {
  const meta = CATEGORY_META[category];
  return (
    <span className={`category-badge ${subtle ? 'is-subtle' : ''}`} style={{ '--badge-color': meta.color } as CSSProperties}>
      <span className="category-dot" />
      {meta.label}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={26} strokeWidth={1.7} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  compact = false,
}: {
  options: Array<{ value: T; label: string; hint?: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  compact?: boolean;
}) {
  return (
    <div className={`segmented ${compact ? 'is-compact' : ''}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          title={option.hint}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  unit,
  ariaLabel,
  compact = false,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  ariaLabel: string;
  compact?: boolean;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return (
    <div className={`stepper ${compact ? 'is-compact' : ''}`}>
      <button type="button" className="stepper-btn" onClick={() => onChange(clamp(value - step))} aria-label={`减少${ariaLabel}`}>
        <Minus size={18} />
      </button>
      <label className="stepper-value">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          aria-label={ariaLabel}
          onChange={(event) => onChange(clamp(Number(event.target.value) || 0))}
        />
        {unit ? <span>{unit}</span> : null}
      </label>
      <button type="button" className="stepper-btn" onClick={() => onChange(clamp(value + step))} aria-label={`增加${ariaLabel}`}>
        <Plus size={18} />
      </button>
    </div>
  );
}

export function IconAction({
  label,
  icon: Icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button type="button" className={`icon-action ${danger ? 'is-danger' : ''}`} onClick={onClick} aria-label={label} title={label}>
      <Icon size={18} />
    </button>
  );
}
