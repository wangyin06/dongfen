import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useApp } from '../state/AppContext';

export function ToastHost() {
  const { toast } = useApp();
  if (!toast) return null;
  const Icon = toast.tone === 'error' ? AlertCircle : toast.tone === 'info' ? Info : CheckCircle2;
  return (
    <div className={`toast toast-${toast.tone}`} role="status" aria-live="polite">
      <Icon size={18} />
      <span>{toast.message}</span>
    </div>
  );
}
