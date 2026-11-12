import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Dumbbell,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { CategoryId, Exercise, OpenLogOptions, UnitType } from '../types';
import { CATEGORY_LIST, groupExercises } from '../data/exercises';
import { useApp } from '../state/AppContext';
import { createId } from '../lib/db';
import { unitRateHint, unitScoreLabel } from '../lib/score';
import { CATEGORY_ICONS } from '../components/categoryIcon';
import { CategoryBadge, Dialog, EmptyState, Segmented, Sheet } from '../components/ui';

type LevelFilter = 'all' | 'foundation' | 'progress' | 'challenge';

function levelLabel(level: number): string {
  if (level <= 2) return '基础';
  if (level === 3) return '进阶';
  return '挑战';
}

const EMPTY_FORM = {
  name: '',
  category: 'push' as CategoryId,
  group: '自定义',
  unitType: 'reps' as UnitType,
  unitScore: 0.15,
  perSide: false,
  level: 2,
  equipment: '无器械',
  cue: '',
};

export function LibraryPage({ onOpenLog }: { onOpenLog: (options?: OpenLogOptions) => void }) {
  const { exercises, addCustomExercise, removeCustomExercise, notify } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      if (category !== 'all' && exercise.category !== category) return false;
      if (levelFilter === 'foundation' && exercise.level > 2) return false;
      if (levelFilter === 'progress' && exercise.level !== 3) return false;
      if (levelFilter === 'challenge' && exercise.level < 4) return false;
      if (!needle) return true;
      return [exercise.name, exercise.group, exercise.equipment, ...exercise.aliases].join(' ').toLowerCase().includes(needle);
    });
  }, [exercises, query, category, levelFilter]);

  const groups = groupExercises(filtered);

  const openCustom = () => {
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setCustomOpen(true);
  };

  const saveCustom = async () => {
    const name = form.name.trim();
    if (!name) {
      setFormError('给动作起一个名字吧。');
      return;
    }
    if (exercises.some((exercise) => exercise.name === name)) {
      setFormError('动作库里已经有同名动作了。');
      return;
    }
    if (!Number.isFinite(form.unitScore) || form.unitScore <= 0) {
      setFormError('单位得分需要大于 0。');
      return;
    }
    const exercise: Exercise = {
      id: createId('custom'),
      name,
      category: form.category,
      group: form.group.trim() || '自定义',
      unitType: form.unitType,
      unitScore: form.unitScore,
      perSide: form.perSide,
      level: form.level,
      aliases: [],
      cue: form.cue.trim(),
      equipment: form.equipment.trim() || '无器械',
      custom: true,
    };
    const ok = await addCustomExercise(exercise);
    if (!ok) {
      setFormError('保存失败，请重试。');
      return;
    }
    setCustomOpen(false);
    setDetail(exercise);
    notify(`已添加「${name}」`);
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    const result = await removeCustomExercise(deleteTarget.id);
    if (!result.ok) {
      notify(result.message ?? '删除失败', 'error');
      return;
    }
    setDeleteTarget(null);
    setDetail(null);
    notify('自定义动作已删除');
  };

  return (
    <div className="page library-page">
      <header className="page-intro">
        <div>
          <p className="eyebrow">MOVEMENT LIBRARY</p>
          <h1>找到适合今天的那一个。</h1>
          <p className="page-subtitle">从退阶到进阶，动作不必一次做到最难。</p>
        </div>
        <button type="button" className="btn btn-secondary intro-action" onClick={openCustom}>
          <Plus size={18} />
          自定义动作
        </button>
      </header>

      <section className="library-toolbar">
        <div className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索动作、部位、器械或别名"
            aria-label="搜索动作库"
          />
        </div>
        <div className="filter-scroll" role="group" aria-label="按类别筛选动作">
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
        <div className="library-filter-row">
          <Segmented
            compact
            options={[
              { value: 'all', label: '全部难度' },
              { value: 'foundation', label: '基础' },
              { value: 'progress', label: '进阶' },
              { value: 'challenge', label: '挑战' },
            ]}
            value={levelFilter}
            onChange={setLevelFilter}
            ariaLabel="按难度筛选"
          />
          <button type="button" className="btn btn-secondary btn-small library-create-mobile" onClick={openCustom}>
            <Plus size={16} />
            自定义动作
          </button>
          <span className="library-count">{filtered.length} 个动作</span>
        </div>
      </section>

      {groups.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="没有匹配的动作"
          description="换一个关键词，或者自己添加一个动作。"
          action={
            <button type="button" className="btn btn-secondary btn-small" onClick={openCustom}>
              <Plus size={16} />
              自定义动作
            </button>
          }
        />
      ) : (
        <div className="library-sections">
          {groups.map((group) => {
            const meta = CATEGORY_LIST.find((item) => item.id === group.category);
            const Icon = CATEGORY_ICONS[group.category];
            if (!meta) return null;
            return (
              <section className="library-group" key={`${group.category}-${group.group}`}>
                <header className="library-group-head">
                  <span className="library-group-icon" style={{ background: meta.soft, color: meta.color }}>
                    <Icon size={17} />
                  </span>
                  <div>
                    <h2>{group.group}</h2>
                    <p>{meta.label} · {meta.description}</p>
                  </div>
                  <span className="library-group-count">{group.items.length}</span>
                </header>
                <div className="library-grid">
                  {group.items.map((exercise) => (
                    <button type="button" className="exercise-card" key={exercise.id} onClick={() => setDetail(exercise)}>
                      <div className="exercise-card-top">
                        <span className="exercise-card-name">{exercise.name}</span>
                        {exercise.custom ? <em className="custom-tag">自定义</em> : null}
                        <ArrowRight size={16} className="exercise-card-arrow" />
                      </div>
                      <p className="exercise-card-cue">{exercise.cue || '按自己的节奏完成，保持动作可控。'}</p>
                      <div className="exercise-card-foot">
                        <span>{unitScoreLabel(exercise)}</span>
                        <span>{exercise.equipment}</span>
                        <span className={`level-pill level-${exercise.level}`}>{levelLabel(exercise.level)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Sheet
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.name ?? '动作详情'}
        subtitle={detail ? `${detail.group} · ${levelLabel(detail.level)}` : undefined}
      >
        {detail ? (
          <div className="exercise-detail">
            <div className="detail-banner">
              <span className="detail-icon" style={{ background: `var(--cat-${detail.category}-soft)` }}>
                {(() => {
                  const Icon = CATEGORY_ICONS[detail.category];
                  return <Icon size={28} />;
                })()}
              </span>
              <div>
                <CategoryBadge category={detail.category} />
                <h3>{detail.name}</h3>
                <p>{detail.equipment}</p>
              </div>
              {detail.custom ? <span className="custom-tag">自定义</span> : null}
            </div>
            <div className="detail-stats">
              <div>
                <span>单位得分</span>
                <strong>{unitScoreLabel(detail)}</strong>
              </div>
              <div>
                <span>计分方式</span>
                <strong>{detail.perSide ? '左右分别计' : detail.unitType === 'seconds' ? '按时间折算' : '按次数折算'}</strong>
              </div>
            </div>
            <div className="detail-copy">
              <h4>动作提示</h4>
              <p>{detail.cue || '保持动作可控，质量优先于数量。'}</p>
            </div>
            <p className="detail-rate-hint">{unitRateHint(detail)}</p>
            {detail.aliases.length > 0 ? (
              <p className="detail-aliases">别名：{detail.aliases.join('、')}</p>
            ) : null}
            <div className="detail-actions">
              <button
                type="button"
                className="btn btn-primary btn-wide"
                onClick={() => {
                  const target = detail;
                  setDetail(null);
                  onOpenLog({ exercise: target });
                }}
              >
                <Plus size={18} />
                记录这个动作
              </button>
              {detail.custom ? (
                <button type="button" className="btn btn-ghost btn-wide danger-text" onClick={() => setDeleteTarget(detail)}>
                  <Trash2 size={16} />
                  删除自定义动作
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet open={customOpen} onClose={() => setCustomOpen(false)} title="添加自定义动作" subtitle="把你自己常练的动作也纳入计分">
        <div className="custom-form">
          <div className="form-field">
            <label htmlFor="custom-name">动作名称</label>
            <input
              id="custom-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="例如：弹力带下拉"
              maxLength={30}
            />
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="custom-category">类别</label>
              <select
                id="custom-category"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as CategoryId }))}
              >
                {CATEGORY_LIST.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="custom-group">分组</label>
              <input
                id="custom-group"
                value={form.group}
                onChange={(event) => setForm((current) => ({ ...current, group: event.target.value }))}
                maxLength={20}
              />
            </div>
          </div>
          <div className="form-field">
            <span>计分方式</span>
            <Segmented
              options={[
                { value: 'reps', label: '按次数' },
                { value: 'seconds', label: '按时间' },
              ]}
              value={form.unitType}
              onChange={(value) => setForm((current) => ({ ...current, unitType: value }))}
              ariaLabel="选择计分方式"
            />
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="custom-score">
                {form.unitType === 'seconds' ? '每 30 秒得分' : '每 10 次得分'}
              </label>
              <input
                id="custom-score"
                type="number"
                min="0.01"
                max="10"
                step="0.01"
                value={form.unitScore}
                onChange={(event) => setForm((current) => ({ ...current, unitScore: Number(event.target.value) }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="custom-level">难度</label>
              <select
                id="custom-level"
                value={form.level}
                onChange={(event) => setForm((current) => ({ ...current, level: Number(event.target.value) }))}
              >
                <option value={1}>1 · 入门</option>
                <option value={2}>2 · 基础</option>
                <option value={3}>3 · 进阶</option>
                <option value={4}>4 · 挑战</option>
                <option value={5}>5 · 高阶</option>
              </select>
            </div>
          </div>
          <label className="check-field">
            <input
              type="checkbox"
              checked={form.perSide}
              onChange={(event) => setForm((current) => ({ ...current, perSide: event.target.checked }))}
            />
            <span>这个动作需要左右侧分别记录</span>
          </label>
          <div className="form-field">
            <label htmlFor="custom-equipment">器械</label>
            <input
              id="custom-equipment"
              value={form.equipment}
              onChange={(event) => setForm((current) => ({ ...current, equipment: event.target.value }))}
              maxLength={30}
            />
          </div>
          <div className="form-field">
            <label htmlFor="custom-cue">动作提示 <span className="optional">可选</span></label>
            <textarea
              id="custom-cue"
              value={form.cue}
              onChange={(event) => setForm((current) => ({ ...current, cue: event.target.value }))}
              rows={2}
              maxLength={100}
              placeholder="提醒自己保持什么姿势…"
            />
          </div>
          {formError ? <p className="form-error" role="alert">{formError}</p> : null}
          <button type="button" className="btn btn-primary btn-wide" onClick={() => void saveCustom()}>
            <Sparkles size={17} />
            添加到动作库
          </button>
        </div>
      </Sheet>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="删除自定义动作？"
        tone="danger"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>取消</button>
            <button type="button" className="btn btn-danger" onClick={() => void confirmRemove()}>
              <Trash2 size={16} />
              删除
            </button>
          </>
        }
      >
        <p>
          {deleteTarget ? <>「{deleteTarget.name}」会从动作库移除。已经有训练记录的动作无法删除。</> : null}
        </p>
      </Dialog>
    </div>
  );
}
