import type { CSSProperties } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Flame,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react';
import type { OpenLogOptions, WorkoutRecord } from '../types';
import { CATEGORY_LIST } from '../data/exercises';
import { useApp } from '../state/AppContext';
import {
  endOfWeek,
  formatDate,
  formatRelativeDate,
  getWeekDates,
  isFuture,
  startOfWeek,
  todayKey,
  weekdayShort,
} from '../lib/date';
import { formatScore, groupScoreByCategory, groupScoreByDate, streakDays, sumRecords } from '../lib/score';
import { CATEGORY_ICONS } from '../components/categoryIcon';
import { RecordRow } from '../components/RecordRow';
import { EmptyState } from '../components/ui';

export function TodayPage({
  onOpenLog,
  onEditRecord,
  onNavigate,
}: {
  onOpenLog: (options?: OpenLogOptions) => void;
  onEditRecord: (record: WorkoutRecord) => void;
  onNavigate: (page: 'records' | 'stats' | 'library') => void;
}) {
  const { records, settings, exerciseMap } = useApp();
  const today = todayKey();
  const todayRecords = records.filter((record) => record.date === today);
  const todayScore = sumRecords(todayRecords);
  const weekStart = startOfWeek(today, settings.weekStartsOn);
  const weekEnd = endOfWeek(today, settings.weekStartsOn);
  const weekRecords = records.filter((record) => record.date >= weekStart && record.date <= weekEnd);
  const weekScore = sumRecords(weekRecords);
  const goalPercent = Math.min(100, (weekScore / settings.weeklyGoal) * 100);
  const weekDayScores = groupScoreByDate(weekRecords);
  const categoryScores = groupScoreByCategory(weekRecords);
  const weekDates = getWeekDates(today, settings.weekStartsOn);
  const maxDayScore = Math.max(settings.hardDayLimit, ...weekDates.map((date) => weekDayScores.get(date) ?? 0));
  const streak = streakDays(records, today);
  const missingCategories = CATEGORY_LIST.filter((category) => (categoryScores.get(category.id) ?? 0) <= 0);
  const hour = new Date().getHours();
  const greeting = hour < 5 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
  const remaining = Math.max(0, settings.weeklyGoal - weekScore);

  return (
    <div className="page today-page">
      <header className="page-intro today-intro">
        <div>
          <p className="eyebrow">
            <CalendarDays size={14} />
            {formatDate(today, { withYear: true })}
          </p>
          <h1>{greeting}，今天动一动。</h1>
          <p className="page-subtitle">不追求一次做很多，只追求今天也留下了一分。</p>
        </div>
        <button type="button" className="btn btn-secondary intro-action" onClick={() => onOpenLog()}>
          <Plus size={18} />
          记录一次
        </button>
      </header>

      <section className="today-hero">
        <div className="hero-decoration" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-topline">
          <span className="hero-label">
            <Flame size={15} />
            今日训练分
          </span>
          <span className={`hero-streak ${streak > 0 ? 'is-active' : ''}`}>
            {streak > 0 ? `连续 ${streak} 天` : '今天开始'}
          </span>
        </div>
        <div className="hero-main">
          <div className="hero-number">
            <strong>{formatScore(todayScore)}</strong>
            <span>分</span>
          </div>
          <div className="hero-ring" style={{ '--progress': `${goalPercent * 3.6}deg` } as CSSProperties}>
            <div>
              <strong>{Math.round(goalPercent)}%</strong>
              <small>周目标</small>
            </div>
          </div>
        </div>
        <p className="hero-copy">
          {todayScore > 0
            ? `今天已经完成 ${todayRecords.length} 组动作，身体正在记住这份积累。`
            : '还没有记录。哪怕只做一组，今天也会从 0 变成有。'}
        </p>
        <div className="hero-progress">
          <div className="progress-label">
            <span>
              本周 <strong>{formatScore(weekScore)}</strong> / {settings.weeklyGoal.toFixed(1)} 分
            </span>
            <span>{remaining > 0 ? `还差 ${remaining.toFixed(1)} 分` : '目标达成'}</span>
          </div>
          <div className="progress-track hero-track">
            <span style={{ width: `${goalPercent}%` }} />
          </div>
        </div>
        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => onOpenLog()}>
            <Plus size={18} />
            记录一组
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('stats')}>
            看这周
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WEEKLY RHYTHM</p>
            <h2>这周的节奏</h2>
          </div>
          <span className="section-note">目标 {settings.weeklyGoal.toFixed(1)} 分</span>
        </div>
        <div className="week-strip">
          {weekDates.map((date) => {
            const score = weekDayScores.get(date) ?? 0;
            const future = isFuture(date);
            const isCurrent = date === today;
            const height = score > 0 ? Math.max(8, (score / maxDayScore) * 100) : 4;
            return (
              <button
                key={date}
                type="button"
                className={`week-day ${isCurrent ? 'is-today' : ''} ${future ? 'is-future' : ''} ${score > 0 ? 'has-score' : ''}`}
                onClick={() => onOpenLog({ date })}
                disabled={future}
                aria-label={`${formatRelativeDate(date)} ${formatScore(score)} 分`}
              >
                <span className="week-day-label">{weekdayShort(date)}</span>
                <span className="week-bar-track">
                  <span className="week-bar" style={{ height: `${height}%` }} />
                </span>
                <span className="week-day-score">{score > 0 ? score.toFixed(1) : '·'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BALANCE</p>
            <h2>五类覆盖</h2>
          </div>
          <span className="section-note">{5 - missingCategories.length} / 5 已练</span>
        </div>
        <div className="coverage-grid">
          {CATEGORY_LIST.map((category) => {
            const Icon = CATEGORY_ICONS[category.id];
            const score = categoryScores.get(category.id) ?? 0;
            return (
              <div key={category.id} className={`coverage-item ${score > 0 ? 'is-covered' : ''}`}>
                <span className="coverage-icon" style={{ background: category.soft, color: category.color }}>
                  <Icon size={18} />
                </span>
                <span className="coverage-copy">
                  <strong>{category.label}</strong>
                  <small>{score > 0 ? `${score.toFixed(1)} 分` : '待安排'}</small>
                </span>
                {score > 0 ? <Check size={15} className="coverage-check" /> : null}
              </div>
            );
          })}
        </div>
        {missingCategories.length > 0 ? (
          <div className="balance-tip">
            <span className="tip-icon">
              <Target size={17} />
            </span>
            <p>
              这周还没练到 <strong>{missingCategories.map((category) => category.label).join('、')}</strong>，下次可以顺手补一个。
            </p>
            <button type="button" className="text-btn" onClick={() => onNavigate('library')}>
              找动作 <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div className="balance-tip is-done">
            <span className="tip-icon">
              <Sparkles size={17} />
            </span>
            <p>推、拉、腿、核心、握力都照顾到了。这周很完整。</p>
          </div>
        )}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TODAY'S LOG</p>
            <h2>今天的记录</h2>
          </div>
          <button type="button" className="text-btn" onClick={() => onNavigate('records')}>
            全部记录 <ArrowRight size={15} />
          </button>
        </div>
        {todayRecords.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="今天还空着"
            description="从 10 个深蹲、30 秒平板，或者一组俯卧撑开始。"
            action={
              <button type="button" className="btn btn-primary btn-small" onClick={() => onOpenLog()}>
                <Plus size={16} />
                记下第一组
              </button>
            }
          />
        ) : (
          <div className="record-card">
            {todayRecords.map((record) => (
              <RecordRow
                key={record.id}
                record={record}
                onEdit={() => onEditRecord(record)}
                onRepeat={() => onOpenLog({ exercise: exerciseMap.get(record.exerciseId), date: record.date })}
              />
            ))}
            <button type="button" className="add-more-row" onClick={() => onOpenLog()}>
              <Plus size={16} />
              再加一组
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
