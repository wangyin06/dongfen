import { useMemo, useState } from 'react';
import {
  CalendarPlus,
  ClipboardList,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import type { CategoryId, OpenLogOptions, WorkoutRecord } from '../types';
import { CATEGORY_LIST } from '../data/exercises';
import { useApp } from '../state/AppContext';
import {
  formatDate,
  formatRelativeDate,
  todayKey,
} from '../lib/date';
import { formatScore, groupRecordsByDate, sumRecords } from '../lib/score';
import { CATEGORY_ICONS } from '../components/categoryIcon';
import { RecordRow } from '../components/RecordRow';
import { Dialog, EmptyState } from '../components/ui';

export function RecordsPage({
  onOpenLog,
  onEditRecord,
}: {
  onOpenLog: (options?: OpenLogOptions) => void;
  onEditRecord: (record: WorkoutRecord) => void;
}) {
  const { records, removeWorkout, notify } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<WorkoutRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (category !== 'all' && record.category !== category) return false;
      if (!needle) return true;
      return [record.exerciseName, record.group, record.note ?? ''].join(' ').toLowerCase().includes(needle);
    });
  }, [records, query, category]);

  const groups = groupRecordsByDate(filtered);
  const totalScore = sumRecords(records);
  const filterActive = Boolean(query.trim()) || category !== 'all';

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await removeWorkout(deleteTarget.id);
    setDeleting(false);
    if (ok) {
      notify('记录已删除');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page records-page">
      <header className="page-intro">
        <div>
          <p className="eyebrow">TRAINING LOG</p>
          <h1>每一次，都算数。</h1>
          <p className="page-subtitle">回看不是比较，是确认自己确实走过。</p>
        </div>
        <button type="button" className="btn btn-secondary intro-action" onClick={() => onOpenLog()}>
          <Plus size={18} />
          记录一次
        </button>
      </header>

      <div className="summary-strip">
        <div className="summary-item">
          <span>累计训练分</span>
          <strong>{formatScore(totalScore)}</strong>
        </div>
        <div className="summary-item">
          <span>记录条数</span>
          <strong>{records.length}</strong>
        </div>
        <div className="summary-item">
          <span>训练天数</span>
          <strong>{new Set(records.map((record) => record.date)).size}</strong>
        </div>
      </div>

      <section className="records-toolbar">
        <div className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索动作或备注"
            aria-label="搜索训练记录"
          />
        </div>
        <div className="filter-scroll" role="group" aria-label="按类别筛选记录">
          <button
            type="button"
            className={`filter-chip ${category === 'all' ? 'is-active' : ''}`}
            onClick={() => setCategory('all')}
          >
            <SlidersHorizontal size={14} />
            全部
          </button>
          {CATEGORY_LIST.map((item) => {
            const Icon = CATEGORY_ICONS[item.id];
            return (
              <button
                key={item.id}
                type="button"
                className={`filter-chip ${category === item.id ? 'is-active' : ''}`}
                onClick={() => setCategory(item.id)}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {records.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="还没有训练记录"
          description="记下第一组动作，这里就会开始长出你的训练轨迹。"
          action={
            <button type="button" className="btn btn-primary btn-small" onClick={() => onOpenLog()}>
              <Plus size={16} />
              记录第一组
            </button>
          }
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Search}
          title="没有匹配的记录"
          description="换一个关键词，或者把筛选条件放宽。"
          action={
            filterActive ? (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                }}
              >
                清除筛选
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="date-groups">
          {groups.map((group) => (
            <section className="date-group" key={group.date}>
              <header className="date-group-head">
                <div className="date-group-title">
                  <strong>{formatRelativeDate(group.date)}</strong>
                  <span>{formatDate(group.date, { withWeekday: true })}</span>
                  {group.date === todayKey() ? <em>今天</em> : null}
                </div>
                <div className="date-group-side">
                  <span>{group.records.length} 组</span>
                  <strong>{formatScore(group.score)} 分</strong>
                  <button type="button" className="icon-action" onClick={() => onOpenLog({ date: group.date })} aria-label={`补记${formatDate(group.date)}的训练`} title="补记">
                    <CalendarPlus size={17} />
                  </button>
                </div>
              </header>
              <div className="record-card">
                {group.records.map((record) => (
                  <RecordRow
                    key={record.id}
                    record={record}
                    onEdit={() => onEditRecord(record)}
                    onDelete={() => setDeleteTarget(record)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="删除这条记录？"
        tone="danger"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              先留着
            </button>
            <button type="button" className="btn btn-danger" onClick={() => void confirmDelete()} disabled={deleting}>
              <Trash2 size={16} />
              {deleting ? '删除中…' : '确认删除'}
            </button>
          </>
        }
      >
        <p>
          {deleteTarget ? (
            <>
              将删除 <strong>{deleteTarget.exerciseName}</strong> 在 {formatDate(deleteTarget.date)} 的记录，删除后无法恢复。
            </>
          ) : null}
        </p>
      </Dialog>
    </div>
  );
}
