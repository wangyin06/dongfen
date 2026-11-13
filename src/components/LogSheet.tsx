import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock3,
  RotateCcw,
  Search,
  Timer,
} from 'lucide-react';
import type { CategoryId, Exercise, Quality, RecordDraft, WorkoutRecord } from '../types';
import { CATEGORY_LIST } from '../data/exercises';
import {
  draftScore,
  formatScore,
  QUALITY_OPTIONS,
  recordScore,
  sumRecords,
  unitName,
  unitRateHint,
  unitScoreLabel,
} from '../lib/score';
import { createId } from '../lib/db';
import { formatRelativeDate, todayKey } from '../lib/date';
import { validateWorkoutRecord } from '../lib/validation';
import { useApp } from '../state/AppContext';
import { CategoryBadge, Dialog, Sheet, Stepper } from './ui';
import { CATEGORY_ICONS } from './categoryIcon';

type PickerCategory = CategoryId | 'all';

export interface LogSheetProps {
  open: boolean;
  onClose: () => void;
  editRecord?: WorkoutRecord | null;
  initialExercise?: Exercise | null;
  initialDate?: string;
}

function defaultAmount(exercise: Exercise): number {
  return exercise.unitType === 'seconds' ? 30 : 10;
}

function clockText(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function exerciseFromRecord(record: WorkoutRecord): Exercise {
  return {
    id: record.exerciseId,
    name: record.exerciseName,
    category: record.category,
    group: record.group,
    unitType: record.unitType,
    unitScore: record.unitScore,
    perSide: record.perSide,
    level: 2,
    aliases: [],
    cue: '',
    equipment: '',
    custom: record.exerciseId.startsWith('custom_'),
  };
}

export function LogSheet({ open, onClose, editRecord = null, initialExercise = null, initialDate }: LogSheetProps) {
  const { exercises, exerciseMap, records, settings, saveWorkout, notify } = useApp();
  const [step, setStep] = useState<'pick' | 'amount'>('pick');
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PickerCategory>('all');
  const [date, setDate] = useState(todayKey());
  const [amount, setAmount] = useState(10);
  const [left, setLeft] = useState(10);
  const [right, setRight] = useState(10);
  const [syncSides, setSyncSides] = useState(true);
  const [quality, setQuality] = useState<Quality>(settings.defaultQuality);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerSide, setTimerSide] = useState<'left' | 'right'>('left');
  const [dirty, setDirty] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const timerStartedAt = useRef<number | null>(null);
  const dateId = useId();
  const noteId = useId();

  useEffect(() => {
    if (!open) {
      timerStartedAt.current = null;
      setTimerRunning(false);
      setElapsed(0);
      setDirty(false);
      setConfirmCloseOpen(false);
      return;
    }
    setError('');
    setSearch('');
    setCategory('all');
    setSyncSides(true);
    timerStartedAt.current = null;
    setTimerRunning(false);
    setElapsed(0);
    setTimerSide('left');
    setDirty(false);
    setConfirmCloseOpen(false);
    const target = editRecord ? exerciseMap.get(editRecord.exerciseId) ?? exerciseFromRecord(editRecord) : initialExercise;
    if (target) {
      const targetAmount = editRecord?.amount ?? defaultAmount(target);
      setSelected(target);
      setStep('amount');
      setDate(editRecord?.date ?? initialDate ?? todayKey());
      setAmount(targetAmount);
      setLeft(editRecord?.leftAmount ?? targetAmount);
      setRight(editRecord?.rightAmount ?? targetAmount);
      setQuality(editRecord?.quality ?? settings.defaultQuality);
      setNote(editRecord?.note ?? '');
    } else {
      setSelected(null);
      setStep('pick');
      setDate(initialDate ?? todayKey());
      setAmount(10);
      setLeft(10);
      setRight(10);
      setQuality(settings.defaultQuality);
      setNote('');
    }
  }, [open, editRecord, initialExercise, initialDate, exerciseMap, settings.defaultQuality]);

  useEffect(() => {
    if (!timerRunning) return;
    const syncElapsed = () => {
      const startedAt = timerStartedAt.current;
      if (startedAt === null) return;
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    syncElapsed();
    const timer = window.setInterval(syncElapsed, 250);
    window.addEventListener('focus', syncElapsed);
    document.addEventListener('visibilitychange', syncElapsed);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', syncElapsed);
      document.removeEventListener('visibilitychange', syncElapsed);
    };
  }, [timerRunning]);

  const recentExercises = useMemo(() => {
    const seen = new Set<string>();
    const result: Exercise[] = [];
    for (const record of records) {
      if (seen.has(record.exerciseId)) continue;
      seen.add(record.exerciseId);
      const exercise = exerciseMap.get(record.exerciseId);
      if (exercise) result.push(exercise);
      if (result.length >= 6) break;
    }
    return result;
  }, [records, exerciseMap]);

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exercises.filter((exercise) => {
      if (category !== 'all' && exercise.category !== category) return false;
      if (!query) return true;
      const haystack = [exercise.name, exercise.group, exercise.equipment, ...exercise.aliases].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [exercises, search, category]);

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, Map<string, Exercise[]>>();
    for (const exercise of filteredExercises) {
      const groupMap = map.get(exercise.category) ?? new Map<string, Exercise[]>();
      const list = groupMap.get(exercise.group) ?? [];
      list.push(exercise);
      groupMap.set(exercise.group, list);
      map.set(exercise.category, groupMap);
    }
    return map;
  }, [filteredExercises]);

  const draft: RecordDraft | null = selected
    ? {
        date,
        exercise: selected,
        quality,
        amount: selected.perSide ? undefined : amount,
        leftAmount: selected.perSide ? left : undefined,
        rightAmount: selected.perSide ? right : undefined,
        note,
      }
    : null;
  const score = draft ? draftScore(draft) : 0;

  const chooseExercise = (exercise: Exercise) => {
    const nextAmount = defaultAmount(exercise);
    setSelected(exercise);
    setStep('amount');
    setAmount(nextAmount);
    setLeft(nextAmount);
    setRight(nextAmount);
    setQuality(settings.defaultQuality);
    setNote('');
    setError('');
    setDirty(true);
    timerStartedAt.current = null;
    setElapsed(0);
    setTimerRunning(false);
    setTimerSide('left');
  };

  const startTimer = () => {
    timerStartedAt.current = Date.now();
    setElapsed(0);
    setTimerRunning(true);
  };

  const resetTimer = () => {
    timerStartedAt.current = null;
    setElapsed(0);
  };

  const stopTimer = () => {
    if (!selected) return;
    const startedAt = timerStartedAt.current;
    const seconds = Math.max(1, startedAt === null ? elapsed : Math.floor((Date.now() - startedAt) / 1000));
    timerStartedAt.current = null;
    setElapsed(seconds);
    setTimerRunning(false);
    setDirty(true);
    if (!selected.perSide) {
      setAmount(seconds);
      return;
    }
    if (syncSides) {
      setLeft(seconds);
      setRight(seconds);
    } else if (timerSide === 'left') {
      setLeft(seconds);
    } else {
      setRight(seconds);
    }
  };

  const requestClose = () => {
    if (saving) return;
    if (dirty) {
      setConfirmCloseOpen(true);
      return;
    }
    onClose();
  };

  const discardAndClose = () => {
    timerStartedAt.current = null;
    setTimerRunning(false);
    setDirty(false);
    setConfirmCloseOpen(false);
    onClose();
  };

  const handleSave = async (andContinue = false) => {
    if (!selected) return;
    if (selected.perSide ? left + right <= 0 : amount <= 0) {
      setError(selected.unitType === 'seconds' ? '请先记录有效秒数。' : '请先记录有效次数。');
      return;
    }
    setSaving(true);
    setError('');
    const now = new Date().toISOString();
    const record: WorkoutRecord = {
      id: editRecord?.id ?? createId(),
      date,
      exerciseId: selected.id,
      exerciseName: selected.name,
      category: selected.category,
      group: selected.group,
      unitType: selected.unitType,
      unitScore: selected.unitScore,
      perSide: selected.perSide,
      quality,
      amount: selected.perSide ? undefined : amount,
      leftAmount: selected.perSide ? left : undefined,
      rightAmount: selected.perSide ? right : undefined,
      note: note.trim() || undefined,
      createdAt: editRecord?.createdAt ?? now,
      updatedAt: now,
    };
    const validationError = validateWorkoutRecord(record);
    if (validationError) {
      setSaving(false);
      setError(validationError);
      return;
    }
    const ok = await saveWorkout(record);
    setSaving(false);
    if (!ok) return;
    setDirty(false);
    setConfirmCloseOpen(false);
    timerStartedAt.current = null;
    setTimerRunning(false);

    const savedScore = recordScore(record);
    const dayRecords = records.filter((item) => item.date === record.date && item.id !== record.id);
    const dayTotal = sumRecords(dayRecords) + savedScore;
    const dayLabel = record.date === todayKey() ? '今日' : formatRelativeDate(record.date);
    notify(
      editRecord
        ? `记录已更新 · ${dayLabel} ${formatScore(dayTotal)} 分`
        : `+${formatScore(savedScore)} 分 · ${dayLabel} ${formatScore(dayTotal)} 分`,
    );
    if (andContinue) {
      setSelected(null);
      setStep('pick');
      setSearch('');
      setCategory('all');
      setNote('');
      setAmount(10);
      setLeft(10);
      setRight(10);
      setQuality(settings.defaultQuality);
      setElapsed(0);
      setTimerRunning(false);
      timerStartedAt.current = null;
      setTimerSide('left');
      setError('');
      setDirty(false);
    } else {
      onClose();
    }
  };

  const changeLeft = (value: number) => {
    setLeft(value);
    if (syncSides) setRight(value);
    setDirty(true);
  };
  const changeRight = (value: number) => {
    setRight(value);
    if (syncSides) setLeft(value);
    setDirty(true);
  };
  const changeAmount = (value: number) => {
    setAmount(value);
    setDirty(true);
  };
  const changeDate = (value: string) => {
    setDate(value || todayKey());
    setDirty(true);
  };
  const changeQuality = (value: Quality) => {
    setQuality(value);
    setDirty(true);
  };
  const changeNote = (value: string) => {
    setNote(value);
    setDirty(true);
  };

  return (
    <>
    <Sheet
      open={open}
      onClose={requestClose}
      title={editRecord ? '编辑记录' : '记录一次'}
      subtitle={step === 'amount' && selected ? selected.group : '把训练变成看得见的积累'}
      className="log-sheet"
      headerRight={
        step === 'amount' && !editRecord ? (
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              setSelected(null);
              setStep('pick');
            }}
          >
            <ArrowLeft size={15} />
            换动作
          </button>
        ) : null
      }
    >
      {step === 'pick' || !selected ? (
        <div className="picker">
          <div className="search-field">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索动作、部位或器械"
              aria-label="搜索动作"
            />
          </div>
          <div className="filter-scroll" role="group" aria-label="按类别筛选">
            <button
              type="button"
              className={`filter-chip ${category === 'all' ? 'is-active' : ''}`}
              onClick={() => setCategory('all')}
            >
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

          {!search.trim() && category === 'all' && recentExercises.length > 0 ? (
            <section className="picker-section">
              <div className="section-heading">
                <h3>最近练过</h3>
                <span>再来一组</span>
              </div>
              <div className="recent-grid">
                {recentExercises.map((exercise) => {
                  const Icon = CATEGORY_ICONS[exercise.category];
                  return (
                    <button key={exercise.id} type="button" className="recent-card" onClick={() => chooseExercise(exercise)}>
                      <span className="recent-icon" style={{ background: `var(--cat-${exercise.category}-soft)` }}>
                        <Icon size={18} />
                      </span>
                      <span className="recent-name">{exercise.name}</span>
                      <span className="recent-score">{unitScoreLabel(exercise)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="picker-section">
            <div className="section-heading">
              <h3>{search.trim() ? '搜索结果' : '全部动作'}</h3>
              <span>{filteredExercises.length} 个</span>
            </div>
            {filteredExercises.length === 0 ? (
              <div className="picker-empty">没有找到匹配的动作，换个关键词试试。</div>
            ) : (
              <div className="exercise-groups">
                {Array.from(grouped.entries()).map(([categoryId, groupMap]) => {
                  const meta = CATEGORY_LIST.find((item) => item.id === categoryId);
                  const Icon = CATEGORY_ICONS[categoryId];
                  if (!meta) return null;
                  return (
                    <div key={categoryId} className="exercise-group">
                      <div className="exercise-group-title">
                        <span className="group-icon" style={{ background: meta.soft, color: meta.color }}>
                          <Icon size={14} />
                        </span>
                        <span>{meta.label}</span>
                        <small>{meta.description}</small>
                      </div>
                      {Array.from(groupMap.entries()).map(([groupName, items]) => (
                        <div key={groupName} className="exercise-subgroup">
                          <div className="exercise-subgroup-title">{groupName}</div>
                          <div className="exercise-list">
                            {items.map((exercise) => (
                              <button key={exercise.id} type="button" className="exercise-row" onClick={() => chooseExercise(exercise)}>
                                <span className="exercise-row-main">
                                  <span className="exercise-name">
                                    {exercise.name}
                                    {exercise.custom ? <em>自定义</em> : null}
                                  </span>
                                  <span className="exercise-meta">
                                    {exercise.equipment} · L{exercise.level}
                                  </span>
                                </span>
                                <span className="exercise-rate">{unitScoreLabel(exercise)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="log-form">
          <div className="selected-exercise">
            <span className="selected-exercise-icon" style={{ background: `var(--cat-${selected.category}-soft)` }}>
              {(() => {
                const Icon = CATEGORY_ICONS[selected.category];
                return <Icon size={22} />;
              })()}
            </span>
            <div>
              <div className="selected-exercise-title">
                <h3>{selected.name}</h3>
                <CategoryBadge category={selected.category} subtle />
              </div>
              <p>
                {selected.group} · {unitScoreLabel(selected)}
              </p>
            </div>
          </div>

          <div className="score-preview">
            <div>
              <span className="eyebrow">本次得分</span>
              <strong>
                +{formatScore(score)}
                <small>分</small>
              </strong>
            </div>
            <p>{unitRateHint(selected)}</p>
          </div>

          <div className="form-field">
            <label htmlFor={dateId}>训练日期</label>
            <input
              id={dateId}
              type="date"
              className="date-input"
              value={date}
              max={todayKey()}
              onChange={(event) => changeDate(event.target.value)}
            />
          </div>

          {selected.perSide ? (
            <div className="amount-block">
              <div className="amount-heading">
                <span>左右侧分别记录</span>
                <label className="sync-toggle">
                  <input
                    type="checkbox"
                    checked={syncSides}
                    onChange={(event) => {
                      setSyncSides(event.target.checked);
                      if (event.target.checked) setRight(left);
                      setDirty(true);
                    }}
                  />
                  <span>同步两侧</span>
                </label>
              </div>
              <div className="side-grid">
                <div className="side-field">
                  <span className="side-label">左侧</span>
                  <Stepper
                    value={left}
                    onChange={changeLeft}
                    step={selected.unitType === 'seconds' ? 5 : 1}
                    min={0}
                    max={999}
                    unit={unitName(selected.unitType)}
                    ariaLabel={`左侧${selected.name}`}
                    compact
                    integer={selected.unitType === 'reps'}
                  />
                </div>
                <div className="side-field">
                  <span className="side-label">右侧</span>
                  <Stepper
                    value={right}
                    onChange={changeRight}
                    step={selected.unitType === 'seconds' ? 5 : 1}
                    min={0}
                    max={999}
                    unit={unitName(selected.unitType)}
                    ariaLabel={`右侧${selected.name}`}
                    compact
                    integer={selected.unitType === 'reps'}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="amount-block">
              <div className="amount-heading">
                <span>完成数量</span>
                <small>按 {selected.unitType === 'seconds' ? '30 秒' : '10 次'}为单位</small>
              </div>
              <Stepper
                value={amount}
                onChange={changeAmount}
                step={selected.unitType === 'seconds' ? 5 : 1}
                min={0}
                max={9999}
                unit={unitName(selected.unitType)}
                ariaLabel={selected.name}
                integer={selected.unitType === 'reps'}
              />
              <div className="quick-chips">
                {(selected.unitType === 'seconds' ? [30, 45, 60, 90, 120] : [10, 15, 20, 30, 50]).map((value) => (
                  <button key={value} type="button" onClick={() => changeAmount(value)} className={amount === value ? 'is-active' : ''}>
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selected.unitType === 'seconds' ? (
            <div className={`timer-card ${timerRunning ? 'is-running' : ''}`}>
              <div>
                <span className="eyebrow">
                  <Clock3 size={14} /> 计时器
                </span>
                <strong>{clockText(elapsed)}</strong>
              </div>
              <div className="timer-actions">
                {selected.perSide && !syncSides ? (
                  <div className="timer-side" role="group" aria-label="计时填入哪一侧">
                    <button
                      type="button"
                      className={timerSide === 'left' ? 'is-active' : ''}
                      onClick={() => setTimerSide('left')}
                      aria-pressed={timerSide === 'left'}
                    >
                      左
                    </button>
                    <button
                      type="button"
                      className={timerSide === 'right' ? 'is-active' : ''}
                      onClick={() => setTimerSide('right')}
                      aria-pressed={timerSide === 'right'}
                    >
                      右
                    </button>
                  </div>
                ) : null}
                {timerRunning ? (
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={stopTimer}
                  >
                    停止并填入
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    onClick={startTimer}
                  >
                    <Timer size={16} />
                    开始计时
                  </button>
                )}
                {elapsed > 0 && !timerRunning ? (
                  <button type="button" className="icon-action" onClick={resetTimer} aria-label="重置计时">
                    <RotateCcw size={16} />
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="form-field">
            <span>完成质量</span>
            <div className="quality-options">
              {QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`quality-option ${quality === option.value ? 'is-active' : ''}`}
                  onClick={() => changeQuality(option.value)}
                  aria-pressed={quality === option.value}
                >
                  <span className="quality-check">{quality === option.value ? <Check size={13} /> : null}</span>
                  <strong>{option.short}</strong>
                  <small>×{option.value.toFixed(1)}</small>
                </button>
              ))}
            </div>
            <p className="field-hint">{QUALITY_OPTIONS.find((option) => option.value === quality)?.hint}</p>
          </div>

          <div className="form-field">
            <label htmlFor={noteId}>
              备注 <span className="optional">可选</span>
            </label>
            <textarea
              id={noteId}
              value={note}
              onChange={(event) => changeNote(event.target.value)}
              maxLength={160}
              rows={2}
              placeholder="今天的状态、感受或调整…"
            />
          </div>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="log-actions">
            <button type="button" className="btn btn-primary btn-wide" onClick={() => void handleSave(false)} disabled={saving}>
              {saving ? '保存中…' : editRecord ? '保存修改' : '保存记录'}
            </button>
            {!editRecord ? (
              <button type="button" className="btn btn-ghost btn-wide" onClick={() => void handleSave(true)} disabled={saving}>
                保存并继续记录
              </button>
            ) : null}
          </div>
        </div>
      )}
    </Sheet>
    <Dialog
      open={confirmCloseOpen}
      onClose={() => setConfirmCloseOpen(false)}
      title="放弃这次记录？"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => setConfirmCloseOpen(false)}>
            继续编辑
          </button>
          <button type="button" className="btn btn-danger" onClick={discardAndClose}>
            放弃修改
          </button>
        </>
      }
    >
      <p>当前填写的内容还没有保存，关闭后会丢失。</p>
    </Dialog>
    </>
  );
}
