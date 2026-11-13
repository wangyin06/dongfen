import { useMemo, useState, type CSSProperties } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  Flame,
  Plus,
  Target,
  Trophy,
} from 'lucide-react';
import type { OpenLogOptions } from '../types';
import { CATEGORY_LIST } from '../data/exercises';
import { useApp } from '../state/AppContext';
import {
  daysBetween,
  endOfWeek,
  formatDate,
  getLastNDays,
  getMonthDates,
  getPeriodRange,
  startOfWeek,
  todayKey,
  weekdayShort,
  type StatsPeriod,
} from '../lib/date';
import {
  formatScore,
  groupScoreByCategory,
  groupScoreByDate,
  streakDays,
  sumRecords,
  topExercises,
} from '../lib/score';
import { CATEGORY_ICONS } from '../components/categoryIcon';
import { EmptyState, Segmented } from '../components/ui';

export function StatsPage({ onOpenLog }: { onOpenLog: (options?: OpenLogOptions) => void }) {
  const { records, settings } = useApp();
  const today = todayKey();
  const [period, setPeriod] = useState<StatsPeriod>('week');

  const range = getPeriodRange(period, today, settings.weekStartsOn);
  const periodRecords = records.filter((record) => record.date >= range.start && record.date <= range.end);
  const totalScore = sumRecords(periodRecords);
  const activeDays = new Set(periodRecords.map((record) => record.date)).size;
  const periodOngoing = range.end > today;
  const effectiveEnd = periodOngoing ? today : range.end;
  const daysCount = Math.max(1, daysBetween(range.start, effectiveEnd) + 1);
  const avgScore = totalScore / daysCount;
  const categoryScores = groupScoreByCategory(periodRecords);
  const top = topExercises(periodRecords, 5);
  const streak = streakDays(records, today);

  const weekStart = startOfWeek(today, settings.weekStartsOn);
  const weekEnd = endOfWeek(today, settings.weekStartsOn);
  const weekScore = sumRecords(records.filter((record) => record.date >= weekStart && record.date <= weekEnd));
  const weekGoalPercent = Math.min(100, (weekScore / settings.weeklyGoal) * 100);

  const chartDates = useMemo(() => {
    if (period === 'week') return getLastNDays(range.end, 7);
    if (period === 'month') return getMonthDates(range.end);
    return getLastNDays(range.end, 30);
  }, [period, range.end]);
  const chartScores = groupScoreByDate(periodRecords);
  const rawMaxChart = Math.max(4, settings.hardDayLimit * 1.25, ...chartDates.map((date) => chartScores.get(date) ?? 0));
  const maxChart = Math.ceil(rawMaxChart * 2) / 2;
  const bestDay = Math.max(0, ...chartDates.map((date) => chartScores.get(date) ?? 0));
  const thresholdRatio = Math.min(1, settings.hardDayLimit / maxChart);
  const labelEvery = period === 'week' ? 1 : period === 'month' ? 5 : 5;

  return (
    <div className="page stats-page">
      <header className="page-intro">
        <div>
          <p className="eyebrow">THE LONG VIEW</p>
          <h1>看见积累的形状。</h1>
          <p className="page-subtitle">数字不是压力，是身体给你的回信。</p>
        </div>
        <button type="button" className="btn btn-secondary intro-action" onClick={() => onOpenLog()}>
          <Plus size={18} />
          记录一次
        </button>
      </header>

      <div className="stats-toolbar">
        <Segmented
          options={[
            { value: 'week', label: '本周' },
            { value: 'month', label: '本月' },
            { value: '30d', label: '近 30 天' },
          ]}
          value={period}
          onChange={setPeriod}
          ariaLabel="选择统计周期"
        />
        <span className="range-label">
          <CalendarRange size={15} />
          {range.label}
        </span>
      </div>

      <section className="stats-overview">
        <div className="stats-hero-card">
          <div className="stats-hero-head">
            <span className="eyebrow">
              <BarChart3 size={14} />
              {period === 'week' ? '本周总分' : period === 'month' ? '本月总分' : '近 30 天总分'}
            </span>
            <span className="stats-days">
              <Flame size={14} />
              活跃 {activeDays} 天
            </span>
          </div>
          <div className="stats-total">
            <strong>{formatScore(totalScore)}</strong>
            <span>分</span>
          </div>
          <div className="stats-mini-grid">
            <div>
              <span>{periodOngoing ? '日均（截至今天）' : '日均'}</span>
              <strong>{formatScore(avgScore)}</strong>
            </div>
            <div>
              <span>训练组数</span>
              <strong>{periodRecords.length}</strong>
            </div>
            <div>
              <span>单日最高</span>
              <strong>{formatScore(bestDay)}</strong>
            </div>
          </div>
        </div>

        <div className="goal-card">
          <div className="goal-card-top">
            <span className="goal-icon">
              <Target size={20} />
            </span>
            <div>
              <span className="eyebrow">WEEKLY TARGET</span>
              <h2>本周目标</h2>
            </div>
            <strong className="goal-percent">{Math.round(weekGoalPercent)}%</strong>
          </div>
          <div className="goal-numbers">
            <strong>{formatScore(weekScore)}</strong>
            <span>/ {settings.weeklyGoal.toFixed(1)} 分</span>
          </div>
          <div className="progress-track goal-track">
            <span style={{ width: `${weekGoalPercent}%` }} />
          </div>
          <p>
            {weekScore >= settings.weeklyGoal
              ? '本周目标已经完成。剩下的每一次，都是额外积累。'
              : `还差 ${(settings.weeklyGoal - weekScore).toFixed(1)} 分。按自己的节奏来，不用一次补完。`}
          </p>
          <div className="goal-footer">
            <span>连续训练</span>
            <strong>
              <Flame size={14} />
              {streak} 天
            </strong>
          </div>
        </div>
      </section>

      <section className="section-block chart-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DAILY PULSE</p>
            <h2>每日得分</h2>
          </div>
          <span className="section-note">虚线为高强度日上限 {settings.hardDayLimit.toFixed(1)} 分，柱子超过该线即为高强度日</span>
        </div>
        <div className="chart-card">
          <div className="chart-area">
            <div className="chart-grid" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="chart-bars">
              <span
                className="chart-threshold"
                style={{ '--threshold': thresholdRatio } as CSSProperties}
                aria-hidden="true"
              />
              {chartDates.map((date, index) => {
                const score = chartScores.get(date) ?? 0;
                const height = score > 0 ? Math.max(4, (score / maxChart) * 100) : 2;
                const showLabel = index % labelEvery === 0 || index === chartDates.length - 1;
                return (
                  <div
                    className={`chart-column ${date === today ? 'is-today' : ''}`}
                    key={date}
                    role="img"
                    tabIndex={0}
                    aria-label={`${formatDate(date)}，${score > 0 ? `${formatScore(score)} 分` : '没有训练记录'}`}
                  >
                    <span className="chart-tooltip" aria-hidden="true">{score > 0 ? formatScore(score) : ''}</span>
                    <div className="chart-bar-track">
                      <span className={`chart-bar ${score > settings.hardDayLimit ? 'is-hard' : ''}`} style={{ height: `${height}%` }} />
                    </div>
                    <span className="chart-label">{showLabel ? (period === 'week' ? weekdayShort(date) : date.slice(8)) : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot" /> 每日得分</span>
            <span><i className="legend-dot is-hard" /> 超过上限</span>
          </div>
        </div>
      </section>

      <div className="stats-two-col">
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BALANCE</p>
              <h2>类别分布</h2>
            </div>
          </div>
          <div className="category-bars">
            {CATEGORY_LIST.map((category) => {
              const Icon = CATEGORY_ICONS[category.id];
              const score = categoryScores.get(category.id) ?? 0;
              const percent = totalScore > 0 ? (score / totalScore) * 100 : 0;
              return (
                <div className="category-bar-row" key={category.id}>
                  <span className="category-bar-icon" style={{ background: category.soft, color: category.color }}>
                    <Icon size={15} />
                  </span>
                  <span className="category-bar-label">{category.label}</span>
                  <span className="category-bar-track">
                    <span style={{ width: `${percent}%`, background: category.color }} />
                  </span>
                  <strong>{formatScore(score)}</strong>
                </div>
              );
            })}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MOST PRACTICED</p>
              <h2>练得最多</h2>
            </div>
            <Trophy size={18} className="section-icon" />
          </div>
          {top.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="还没有排行"
              description="这个周期还没有训练记录，先去动一动。"
              action={
                <button type="button" className="btn btn-primary btn-small" onClick={() => onOpenLog()}>
                  <Plus size={16} />
                  记录一次
                </button>
              }
            />
          ) : (
            <div className="top-list">
              {top.map((item, index) => (
                <div className="top-row" key={item.exerciseId}>
                  <span className={`top-rank ${index === 0 ? 'is-first' : ''}`}>{index + 1}</span>
                  <div className="top-main">
                    <strong>{item.name}</strong>
                    <span>{item.count} 组</span>
                  </div>
                  <span className="top-score">{formatScore(item.score)}</span>
                  <ArrowUpRight size={15} className="top-arrow" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
