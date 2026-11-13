import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useToast } from '../state/AppContext';

export function ToastHost() {
  const { toast } = useToast();
  if (!toast) return null;
  const Icon = toast.tone === 'error' ? AlertCircle : toast.tone === 'info' ? Info : CheckCircle2;
  return (
    <div className={`toast toast-${toast.tone}`} role="status" aria-live="polite">
      <Icon size={18} />
      <span>{toast.message}</span>
    </div>
  );
}
