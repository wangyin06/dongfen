import { Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { WorkoutRecord } from '../types';
import { CATEGORY_META } from '../data/exercises';
import { formatScore, qualityShort, recordAmountText, recordScore } from '../lib/score';
import { formatTime } from '../lib/date';
import { CATEGORY_ICONS } from './categoryIcon';

export function RecordRow({
  record,
  onEdit,
  onDelete,
  onRepeat,
  compact = false,
}: {
  record: WorkoutRecord;
  onEdit?: () => void;
  onDelete?: () => void;
  onRepeat?: () => void;
  compact?: boolean;
}) {
  const Icon = CATEGORY_ICONS[record.category];
  const meta = CATEGORY_META[record.category];
  return (
    <div className={`record-row ${compact ? 'is-compact' : ''}`}>
      <span className="record-icon" style={{ background: meta.soft, color: meta.color }}>
        <Icon size={18} />
      </span>
      <div className="record-main">
        <div className="record-title-line">
          <strong>{record.exerciseName}</strong>
          {record.quality < 1 ? <span className="quality-tag">{qualityShort(record.quality)}</span> : null}
          {record.note ? <span className="note-dot" title={record.note}>·</span> : null}
        </div>
        <div className="record-meta">
          <span>{recordAmountText(record)}</span>
          <span className="meta-separator">/</span>
          <span>{meta.label}</span>
          {!compact ? (
            <>
              <span className="meta-separator">/</span>
              <span>{formatTime(record.createdAt)}</span>
            </>
          ) : null}
        </div>
        {record.note ? <p className="record-note">{record.note}</p> : null}
      </div>
      <div className="record-score">+{formatScore(recordScore(record))}</div>
      <div className="record-actions">
        {onRepeat ? (
          <button type="button" className="icon-action" onClick={onRepeat} aria-label={`再记一次${record.exerciseName}`} title="再记一次">
            <RotateCcw size={16} />
          </button>
        ) : null}
        {onEdit ? (
          <button type="button" className="icon-action" onClick={onEdit} aria-label={`编辑${record.exerciseName}`} title="编辑">
            <Pencil size={16} />
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" className="icon-action is-danger" onClick={onDelete} aria-label={`删除${record.exerciseName}`} title="删除">
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
