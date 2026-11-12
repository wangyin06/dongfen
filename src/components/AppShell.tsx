import type { ReactNode } from 'react';
import {
  BarChart3,
  Dumbbell,
  ListChecks,
  Plus,
  Settings,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import type { PageId } from '../types';
import { useApp } from '../state/AppContext';
import { endOfWeek, startOfWeek, todayKey } from '../lib/date';
import { formatScore, streakDays, sumRecords } from '../lib/score';

export const NAV_ITEMS: Array<{ id: PageId; label: string; icon: LucideIcon; hint: string }> = [
  { id: 'today', label: '今日', icon: Sun, hint: '今天练什么' },
  { id: 'records', label: '记录', icon: ListChecks, hint: '每一次训练' },
  { id: 'stats', label: '统计', icon: BarChart3, hint: '看见积累' },
  { id: 'library', label: '动作', icon: Dumbbell, hint: '动作库' },
  { id: 'settings', label: '设置', icon: Settings, hint: '目标与数据' },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'is-compact' : ''}`}>
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="brand-copy">
        <strong>动分</strong>
        {!compact ? <small>MOVE / SCORE</small> : null}
      </span>
    </div>
  );
}

export function AppShell({
  page,
  onNavigate,
  onOpenLog,
  children,
}: {
  page: PageId;
  onNavigate: (page: PageId) => void;
  onOpenLog: () => void;
  children: ReactNode;
}) {
  const { records, settings } = useApp();
  const today = todayKey();
  const weekStart = startOfWeek(today, settings.weekStartsOn);
  const weekEnd = endOfWeek(today, settings.weekStartsOn);
  const weekScore = sumRecords(records.filter((record) => record.date >= weekStart && record.date <= weekEnd));
  const streak = streakDays(records, today);
  const goalPercent = Math.min(100, (weekScore / settings.weeklyGoal) * 100);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <button type="button" className="sidebar-cta" onClick={onOpenLog}>
          <span className="sidebar-cta-icon">
            <Plus size={18} />
          </span>
          <span>
            <strong>记录一次</strong>
            <small>把今天写进曲线</small>
          </span>
        </button>
        <nav className="side-nav" aria-label="主导航">
          <span className="side-nav-label">训练空间</span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`side-nav-item ${page === item.id ? 'is-active' : ''}`}
                onClick={() => onNavigate(item.id)}
                aria-current={page === item.id ? 'page' : undefined}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-week-card">
            <div className="side-week-head">
              <span>本周进度</span>
              <strong>{formatScore(weekScore)}</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${goalPercent}%` }} />
            </div>
            <small>目标 {settings.weeklyGoal.toFixed(1)} 分 · 还差 {Math.max(0, settings.weeklyGoal - weekScore).toFixed(1)} 分</small>
          </div>
          <p className="side-footnote">每一分，都是身体记住的事。</p>
        </div>
      </aside>

      <div className="app-frame">
        <header className="mobile-topbar">
          <Brand compact />
          <div className="topbar-meta">
            {streak > 0 ? (
              <span className="streak-pill">
                <i />
                连续 {streak} 天
              </span>
            ) : (
              <span className="topbar-date">今天，从一组开始</span>
            )}
          </div>
        </header>
        <main className="app-main">
          <div className="page-wrap" key={page}>
            {children}
          </div>
        </main>
      </div>

      <nav className="bottom-nav" aria-label="主导航">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav-item ${page === item.id ? 'is-active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <Icon size={21} strokeWidth={page === item.id ? 2.3 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button type="button" className="fab" onClick={onOpenLog} aria-label="记录一次训练">
        <Plus size={23} />
        <span>记录</span>
      </button>
    </div>
  );
}
