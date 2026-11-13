import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Minus, Plus, X, type LucideIcon } from 'lucide-react';
import type { CategoryId } from '../types';
import { CATEGORY_META } from '../data/exercises';

type ModalLayer = {
  id: string;
  restoreFocus: HTMLElement | null;
};

const modalStack: ModalLayer[] = [];
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true',
  );
}

function isTopLayer(id: string): boolean {
  return modalStack[modalStack.length - 1]?.id === id;
}

function useModalLayer(open: boolean, panelRef: RefObject<HTMLElement | null>, onEscape: () => void) {
  const layerId = useId();
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modalStack.push({ id: layerId, restoreFocus });
    if (modalStack.length === 1) {
      document.body.classList.add('no-scroll');
      const root = document.getElementById('root');
      root?.setAttribute('inert', '');
      root?.setAttribute('aria-hidden', 'true');
    }

    const focusPanel = () => {
      panel.focus({ preventScroll: true });
      if (document.activeElement !== panel) {
        const first = focusableElements(panel)[0];
        first?.focus({ preventScroll: true });
      }
    };
    const frame = window.requestAnimationFrame(focusPanel);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopLayer(layerId)) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        escapeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = focusableElements(panel);
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown, true);
      const index = modalStack.findIndex((layer) => layer.id === layerId);
      const layer = index >= 0 ? modalStack.splice(index, 1)[0] : null;
      if (modalStack.length === 0) {
        document.body.classList.remove('no-scroll');
        const root = document.getElementById('root');
        root?.removeAttribute('inert');
        root?.removeAttribute('aria-hidden');
      }
      if (layer?.restoreFocus?.isConnected) {
        window.requestAnimationFrame(() => layer.restoreFocus?.focus({ preventScroll: true }));
      }
    };
  }, [open, layerId, panelRef]);
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  headerRight,
  children,
  className = '',
  closeGuard,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  closeGuard?: () => boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeGuardRef = useRef(closeGuard);
  closeGuardRef.current = closeGuard;
  const requestClose = () => {
    if (closeGuardRef.current?.()) return;
    onClose();
  };

  useModalLayer(open, panelRef, requestClose);

  if (!open) return null;

  return createPortal(
    <div className="sheet-layer">
      <div className="sheet-backdrop" onClick={requestClose} aria-hidden="true" />
      <section
        ref={panelRef}
        className={`sheet ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="sheet-grab" aria-hidden="true" />
        <header className="sheet-head">
          <div className="sheet-heading">
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="sheet-head-actions">
            {headerRight}
            <button type="button" className="icon-btn" onClick={requestClose} aria-label="关闭">
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
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useModalLayer(open, panelRef, () => onCloseRef.current());

  if (!open) return null;

  return createPortal(
    <div className="dialog-layer">
      <div className="dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <section
        ref={panelRef}
        className={`dialog-card ${tone === 'danger' ? 'is-danger' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
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
  integer = false,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  ariaLabel: string;
  compact?: boolean;
  integer?: boolean;
}) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);

  const normalize = (raw: string) => {
    if (!raw.trim()) return value;
    let next = Number(raw);
    if (!Number.isFinite(next)) next = value;
    if (integer) next = Math.round(next);
    return Math.min(max, Math.max(min, next));
  };

  const commit = () => {
    const next = normalize(text);
    setEditing(false);
    setText(String(next));
    if (next !== value) onChange(next);
  };

  const stepTo = (next: number) => {
    const normalized = Math.min(max, Math.max(min, integer ? Math.round(next) : next));
    setEditing(false);
    setText(String(normalized));
    onChange(normalized);
  };

  return (
    <div className={`stepper ${compact ? 'is-compact' : ''}`}>
      <button type="button" className="stepper-btn" onClick={() => stepTo(value - step)} aria-label={`减少${ariaLabel}`}>
        <Minus size={18} />
      </button>
      <label className="stepper-value">
        <input
          type="number"
          inputMode={integer ? 'numeric' : 'decimal'}
          value={text}
          min={min}
          max={max}
          step={integer ? 1 : step}
          aria-label={ariaLabel}
          onFocus={() => setEditing(true)}
          onChange={(event) => setText(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
        {unit ? <span>{unit}</span> : null}
      </label>
      <button type="button" className="stepper-btn" onClick={() => stepTo(value + step)} aria-label={`增加${ariaLabel}`}>
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
