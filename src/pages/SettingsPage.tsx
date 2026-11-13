import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Info,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react';
import type { AppSettings, Quality } from '../types';
import { useApp } from '../state/AppContext';
import {
  backupFilename,
  backupToJson,
  csvFilename,
  downloadTextFile,
  parseBackupJson,
  readTextFile,
  recordsToCsv,
  type BackupValidationResult,
} from '../lib/backup';
import { exportAllData } from '../lib/db';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Dialog, Segmented } from '../components/ui';

const APP_VERSION = __APP_VERSION__;
const LAST_EXPORT_KEY = 'dongfen.last-export-at';

function readLastExportAt(): string | undefined {
  try {
    return window.localStorage.getItem(LAST_EXPORT_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function rememberLastExportAt(value: string): void {
  try {
    window.localStorage.setItem(LAST_EXPORT_KEY, value);
  } catch {
    // 隐私模式可能禁用 localStorage，界面仍保留本次会话的导出时间。
  }
}

function forgetLastExportAt(): void {
  try {
    window.localStorage.removeItem(LAST_EXPORT_KEY);
  } catch {
    // 隐私模式下没有可清理的持久化值。
  }
}

function formatExportTime(value?: string): string {
  if (!value) return '还没有导出过';
  const date = new Date(value);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function SettingsPage() {
  const { records, customExercises, settings, updateSettings, importData, clearEverything, notify } = useApp();
  const { canInstall, installed, install } = useInstallPrompt();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [lastExportAt, setLastExportAt] = useState<string | undefined>(() => readLastExportAt() ?? settings.lastExportAt);
  const [saving, setSaving] = useState(false);
  const [importPending, setImportPending] = useState<BackupValidationResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importing, setImporting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearWord, setClearWord] = useState('');
  const [clearing, setClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    setLastExportAt((current) => {
      if (!settings.lastExportAt) return current;
      if (!current || settings.lastExportAt > current) return settings.lastExportAt;
      return current;
    });
  }, [settings.lastExportAt]);

  const dirty =
    draft.weeklyGoal !== settings.weeklyGoal ||
    draft.hardDayLimit !== settings.hardDayLimit ||
    draft.easyDayLimit !== settings.easyDayLimit ||
    draft.weekStartsOn !== settings.weekStartsOn ||
    draft.defaultQuality !== settings.defaultQuality;

  const saveSettings = async () => {
    setSaving(true);
    const ok = await updateSettings(draft);
    setSaving(false);
    if (ok) notify('训练目标已保存');
  };

  const exportJson = async () => {
    const now = new Date().toISOString();
    try {
      const data = await exportAllData();
      const result = await downloadTextFile(
        backupFilename(),
        backupToJson({ ...data, exportedAt: now, settings: { ...data.settings, lastExportAt: now } }),
        'application/json',
      );
      if (result === 'cancelled') {
        notify('已取消导出', 'info');
        return;
      }
      if (result === 'failed') {
        notify('导出失败，请重试', 'error');
        return;
      }
      setLastExportAt(now);
      rememberLastExportAt(now);
      notify(result === 'saved' ? 'JSON 备份已保存' : 'JSON 备份已开始下载');
    } catch (error) {
      console.error(error);
      notify('导出失败，请重试', 'error');
    }
  };

  const exportCsv = async () => {
    if (records.length === 0) {
      notify('还没有记录可以导出', 'info');
      return;
    }
    const result = await downloadTextFile(csvFilename(), recordsToCsv(records), 'text/csv;charset=utf-8');
    if (result === 'cancelled') {
      notify('已取消导出', 'info');
      return;
    }
    if (result === 'failed') {
      notify('导出失败，请重试', 'error');
      return;
    }
    notify(result === 'saved' ? 'CSV 已保存，可用表格软件打开' : 'CSV 已开始下载，可用表格软件打开');
  };

  const pickImportFile = () => fileInputRef.current?.click();

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await readTextFile(file);
      const result = parseBackupJson(text);
      if (!result.data) {
        notify(result.error ?? '备份文件无法识别', 'error');
        return;
      }
      setImportPending(result);
      setImportMode('merge');
    } catch (error) {
      console.error(error);
      notify('读取文件失败，请重试', 'error');
    }
  };

  const confirmImport = async () => {
    if (!importPending?.data) return;
    setImporting(true);
    const ok = await importData(importPending.data, importMode);
    setImporting(false);
    if (ok) {
      notify(importMode === 'replace' ? '备份已覆盖导入' : '备份已合并导入');
      setImportPending(null);
    }
  };

  const confirmClear = async () => {
    if (clearWord !== '清空') return;
    setClearing(true);
    const ok = await clearEverything();
    setClearing(false);
    if (ok) {
      forgetLastExportAt();
      setLastExportAt(undefined);
      notify('所有本地数据已清空');
      setClearOpen(false);
      setClearWord('');
    }
  };

  return (
    <div className="page settings-page">
      <header className="page-intro">
        <div>
          <p className="eyebrow">YOUR SPACE</p>
          <h1>把规则调成自己的。</h1>
          <p className="page-subtitle">目标不是标准答案，是能长期坚持的那条线。</p>
        </div>
      </header>

      <section className="settings-section">
        <div className="settings-section-head">
          <div>
            <p className="eyebrow">TRAINING TARGET</p>
            <h2>训练目标</h2>
          </div>
          <button type="button" className="btn btn-primary btn-small" onClick={() => void saveSettings()} disabled={!dirty || saving}>
            {saving ? '保存中…' : '保存设置'}
          </button>
        </div>
        <div className="settings-card">
          <div className="settings-field-grid">
            <label className="settings-field">
              <span>每周目标</span>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  value={draft.weeklyGoal}
                  onChange={(event) => setDraft((current) => ({ ...current, weeklyGoal: Number(event.target.value) }))}
                />
                <em>分</em>
              </div>
              <small>建议 12–14 分，约等于每周 12–14 条旧循环。</small>
            </label>
            <label className="settings-field">
              <span>高强度日上限</span>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="0.5"
                  value={draft.hardDayLimit}
                  onChange={(event) => setDraft((current) => ({ ...current, hardDayLimit: Number(event.target.value) }))}
                />
                <em>分</em>
              </div>
              <small>超过这条线时，统计图会用强调色标记。</small>
            </label>
            <label className="settings-field">
              <span>轻松日上限</span>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={draft.easyDayLimit}
                  onChange={(event) => setDraft((current) => ({ ...current, easyDayLimit: Number(event.target.value) }))}
                />
                <em>分</em>
              </div>
              <small>留给恢复日的一个温和边界。</small>
            </label>
          </div>

          <div className="settings-row">
            <div>
              <strong>一周从哪天开始</strong>
              <p>影响周目标、周统计和五类覆盖的起止日期。</p>
            </div>
            <Segmented
              compact
              options={[
                { value: 'mon', label: '周一' },
                { value: 'sun', label: '周日' },
              ]}
              value={draft.weekStartsOn === 1 ? 'mon' : 'sun'}
              onChange={(value) => setDraft((current) => ({ ...current, weekStartsOn: value === 'mon' ? 1 : 0 }))}
              ariaLabel="选择一周起始日"
            />
          </div>

          <div className="settings-row">
            <div>
              <strong>默认完成质量</strong>
              <p>新记录会默认选中这个质量系数，仍可在记录时调整。</p>
            </div>
            <Segmented
              compact
              options={[
                { value: '1', label: '标准' },
                { value: '0.8', label: '轻微' },
                { value: '0.5', label: '明显' },
              ]}
              value={String(draft.defaultQuality)}
              onChange={(value) => setDraft((current) => ({ ...current, defaultQuality: Number(value) as Quality }))}
              ariaLabel="选择默认质量"
            />
          </div>

          <div className="settings-note">
            <Info size={16} />
            <p>计分规则：次数动作按 10 次为单位，时间动作按 30 秒为单位；左右侧动作分别计算后相加。</p>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-head">
          <div>
            <p className="eyebrow">YOUR DATA</p>
            <h2>数据与备份</h2>
          </div>
          <span className="settings-data-count">
            <Database size={14} />
            {records.length} 条记录 · {customExercises.length} 个自定义动作
          </span>
        </div>
        <div className="settings-card">
          <div className="backup-status">
            <span className="backup-icon"><ShieldCheck size={20} /></span>
            <div>
              <strong>数据只保存在这台设备</strong>
              <p>没有账号、没有云端。换设备或清理浏览器前，记得先导出备份。</p>
            </div>
            <span className="backup-time">上次导出：{formatExportTime(lastExportAt)}</span>
          </div>
          <div className="data-actions">
            <button type="button" className="data-action" onClick={() => void exportJson()}>
              <span className="data-action-icon"><FileJson size={20} /></span>
              <span>
                <strong>导出 JSON 备份</strong>
                <small>完整保留记录、设置和自定义动作</small>
              </span>
              <Download size={17} />
            </button>
            <button type="button" className="data-action" onClick={exportCsv}>
              <span className="data-action-icon"><FileSpreadsheet size={20} /></span>
              <span>
                <strong>导出 CSV 表格</strong>
                <small>适合用 Excel 查看或做自己的分析</small>
              </span>
              <Download size={17} />
            </button>
            <button type="button" className="data-action" onClick={pickImportFile}>
              <span className="data-action-icon"><Upload size={20} /></span>
              <span>
                <strong>从 JSON 导入</strong>
                <small>支持合并，也可以完全覆盖当前数据</small>
              </span>
              <Upload size={17} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              void onImportFile(file);
            }}
          />
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-head">
          <div>
            <p className="eyebrow">ON YOUR PHONE</p>
            <h2>安装与离线</h2>
          </div>
          <span className={`status-pill ${installed ? 'is-ok' : ''}`}>
            {installed ? <Check size={13} /> : <Smartphone size={13} />}
            {installed ? '已安装' : '可离线使用'}
          </span>
        </div>
        <div className="settings-card install-card">
          <div className="install-copy">
            <span className="install-icon"><Smartphone size={24} /></span>
            <div>
              <strong>把「动分」放到主屏幕</strong>
              <p>像 App 一样打开，训练时不用找浏览器。首次打开后，所有页面和动作库都能离线使用。</p>
            </div>
          </div>
          {installed ? (
            <span className="installed-label"><Check size={16} /> 已在独立窗口运行</span>
          ) : canInstall ? (
            <button type="button" className="btn btn-primary" onClick={() => void install()}>
              <Download size={17} />
              安装到主屏幕
            </button>
          ) : (
            <details className="install-help">
              <summary>查看安装方法</summary>
              <p>在 Chrome / Edge 中打开浏览器菜单，选择「安装应用」或「添加到主屏幕」；iPhone 请用 Safari 的分享按钮选择「添加到主屏幕」。</p>
            </details>
          )}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-head">
          <div>
            <p className="eyebrow">ABOUT THE SCORE</p>
            <h2>分数怎么来的</h2>
          </div>
        </div>
        <div className="formula-card">
          <div className="formula-top">
            <span className="formula-icon">∑</span>
            <div>
              <strong>得分 =（实际数量 ÷ 基础单位）× 单位得分 × 质量系数</strong>
              <p>次数基础单位 10 次，时间基础单位 30 秒；左右侧动作先分别计算，再相加。</p>
            </div>
          </div>
          <div className="formula-example">
            <span>例子</span>
            <p>标准俯卧撑 20 次 × 0.30 分/10 次 × 质量 1.0 = <strong>0.60 分</strong></p>
          </div>
          <p className="formula-footnote">旧版 1 分 ≈ 一条循环：10 跪姿俯卧撑 + 10 坐姿屈膝 + 10 深蹲 + 10 靠墙天使 + 10 提踵 + 左右各 10 握力器。</p>
        </div>
      </section>

      <section className="settings-section danger-section">
        <div className="settings-section-head">
          <div>
            <p className="eyebrow">RESET</p>
            <h2>清空数据</h2>
          </div>
        </div>
        <div className="settings-card danger-card">
          <div>
            <strong>重新开始</strong>
            <p>会删除所有训练记录、自定义动作和设置。这个操作无法撤销，建议先导出 JSON 备份。</p>
          </div>
          <button type="button" className="btn btn-danger" onClick={() => setClearOpen(true)}>
            <Trash2 size={16} />
            清空所有数据
          </button>
        </div>
      </section>

      <footer className="settings-footer">
        <span>动分 · MOVE / SCORE</span>
        <span>v{APP_VERSION} · 本地优先</span>
      </footer>

      <Dialog
        open={Boolean(importPending)}
        onClose={() => setImportPending(null)}
        title="导入备份"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setImportPending(null)} disabled={importing}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void confirmImport()} disabled={importing}>
              <RefreshCw size={16} />
              {importing ? '导入中…' : importMode === 'replace' ? '覆盖导入' : '合并导入'}
            </button>
          </>
        }
      >
        {importPending?.data ? (
          <div className="import-summary">
            <p>
              找到 <strong>{importPending.summary?.records ?? 0}</strong> 条记录、
              <strong>{importPending.summary?.customExercises ?? 0}</strong> 个自定义动作。
            </p>
            {importPending.summary?.dateFrom ? (
              <p className="import-range">日期范围：{importPending.summary.dateFrom} 至 {importPending.summary.dateTo}</p>
            ) : null}
            <div className="import-mode">
              <label className={importMode === 'merge' ? 'is-selected' : ''}>
                <input type="radio" name="import-mode" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} />
                <span>
                  <strong>合并导入</strong>
                  <small>保留现有数据，同 ID 的记录会被备份覆盖。</small>
                </span>
              </label>
              <label className={importMode === 'replace' ? 'is-selected is-danger' : ''}>
                <input type="radio" name="import-mode" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} />
                <span>
                  <strong>覆盖导入</strong>
                  <small>先清空当前所有数据，再导入这份备份。</small>
                </span>
              </label>
            </div>
            {importMode === 'replace' ? <p className="form-error">覆盖导入会删除当前记录，请确认这份备份是最新的。</p> : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={clearOpen}
        onClose={() => {
          setClearOpen(false);
          setClearWord('');
        }}
        title="确定要清空吗？"
        tone="danger"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setClearOpen(false);
                setClearWord('');
              }}
              disabled={clearing}
            >
              取消
            </button>
            <button type="button" className="btn btn-danger" onClick={() => void confirmClear()} disabled={clearWord !== '清空' || clearing}>
              <Trash2 size={16} />
              {clearing ? '清空中…' : '永久清空'}
            </button>
          </>
        }
      >
        <p>这会删除全部 {records.length} 条记录、{customExercises.length} 个自定义动作和所有设置，且无法恢复。</p>
        <label className="clear-confirm">
          <span>请输入「清空」确认：</span>
          <input value={clearWord} onChange={(event) => setClearWord(event.target.value)} placeholder="清空" autoComplete="off" />
        </label>
      </Dialog>
    </div>
  );
}
