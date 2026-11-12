import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppSettings, BackupData, Exercise, WorkoutRecord } from '../types';
import { mergeExercises } from '../data/exercises';
import { validateWorkoutRecord } from '../lib/validation';
import {
  DEFAULT_SETTINGS,
  clearAllData as clearDatabase,
  deleteCustomExercise,
  deleteRecord,
  getAllRecords,
  getCustomExercises,
  getSettings,
  mergeAllData,
  putCustomExercise,
  putRecord,
  replaceAllData,
  saveSettings as persistSettings,
} from '../lib/db';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

interface AppContextValue {
  loading: boolean;
  error: string | null;
  records: WorkoutRecord[];
  settings: AppSettings;
  customExercises: Exercise[];
  exercises: Exercise[];
  exerciseMap: Map<string, Exercise>;
  toast: ToastMessage | null;
  notify: (message: string, tone?: ToastTone) => void;
  saveWorkout: (record: WorkoutRecord) => Promise<boolean>;
  removeWorkout: (id: string) => Promise<boolean>;
  updateSettings: (settings: AppSettings) => Promise<boolean>;
  addCustomExercise: (exercise: Exercise) => Promise<boolean>;
  removeCustomExercise: (id: string) => Promise<{ ok: boolean; message?: string }>;
  importData: (data: BackupData, mode: 'merge' | 'replace') => Promise<boolean>;
  clearEverything: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function sortRecords(records: WorkoutRecord[]): WorkoutRecord[] {
  return [...records].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    return byDate !== 0 ? byDate : b.createdAt.localeCompare(a.createdAt);
  });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const load = useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    try {
      const [nextRecords, nextSettings, nextCustom] = await Promise.all([
        getAllRecords(),
        getSettings(),
        getCustomExercises(),
      ]);
      setRecords(nextRecords);
      setSettings(nextSettings);
      setCustomExercises(nextCustom);
      setError(null);
    } catch (loadError) {
      console.error(loadError);
      setError('本地数据库打开失败。请确认浏览器允许本站保存数据，或换用 Chrome / Safari 再试。');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  const exercises = useMemo(() => mergeExercises(customExercises), [customExercises]);
  const exerciseMap = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);

  const saveWorkout = useCallback(async (record: WorkoutRecord) => {
    const validationError = validateWorkoutRecord(record);
    if (validationError) {
      setToast({ id: Date.now(), message: validationError, tone: 'error' });
      return false;
    }
    try {
      await putRecord(record);
      setRecords((current) => sortRecords([...current.filter((item) => item.id !== record.id), record]));
      return true;
    } catch (saveError) {
      console.error(saveError);
      setToast({ id: Date.now(), message: '记录保存失败，请重试。', tone: 'error' });
      return false;
    }
  }, []);

  const removeWorkout = useCallback(async (id: string) => {
    try {
      await deleteRecord(id);
      setRecords((current) => current.filter((item) => item.id !== id));
      return true;
    } catch (removeError) {
      console.error(removeError);
      setToast({ id: Date.now(), message: '删除失败，请重试。', tone: 'error' });
      return false;
    }
  }, []);

  const updateSettings = useCallback(async (next: AppSettings) => {
    try {
      const saved = await persistSettings(next);
      setSettings(saved);
      return true;
    } catch (settingsError) {
      console.error(settingsError);
      setToast({ id: Date.now(), message: '设置保存失败，请重试。', tone: 'error' });
      return false;
    }
  }, []);

  const addCustomExercise = useCallback(async (exercise: Exercise) => {
    try {
      await putCustomExercise(exercise);
      setCustomExercises((current) => [...current, exercise]);
      return true;
    } catch (addError) {
      console.error(addError);
      setToast({ id: Date.now(), message: '自定义动作保存失败，请重试。', tone: 'error' });
      return false;
    }
  }, []);

  const removeCustomExercise = useCallback(
    async (id: string) => {
      if (records.some((record) => record.exerciseId === id)) {
        return { ok: false, message: '这个动作已经有训练记录，不能删除。' };
      }
      try {
        await deleteCustomExercise(id);
        setCustomExercises((current) => current.filter((item) => item.id !== id));
        return { ok: true };
      } catch (removeError) {
        console.error(removeError);
        return { ok: false, message: '删除失败，请重试。' };
      }
    },
    [records],
  );

  const importData = useCallback(
    async (data: BackupData, mode: 'merge' | 'replace') => {
      try {
        if (mode === 'replace') await replaceAllData(data);
        else await mergeAllData(data);
        await load(false);
        return true;
      } catch (importError) {
        console.error(importError);
        setToast({ id: Date.now(), message: '导入失败，原有数据没有被修改。', tone: 'error' });
        return false;
      }
    },
    [load],
  );

  const clearEverything = useCallback(async () => {
    try {
      await clearDatabase();
      setRecords([]);
      setCustomExercises([]);
      setSettings(DEFAULT_SETTINGS);
      return true;
    } catch (clearError) {
      console.error(clearError);
      setToast({ id: Date.now(), message: '清空失败，请重试。', tone: 'error' });
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    await load(false);
  }, [load]);

  const value: AppContextValue = {
    loading,
    error,
    records,
    settings,
    customExercises,
    exercises,
    exerciseMap,
    toast,
    notify,
    saveWorkout,
    removeWorkout,
    updateSettings,
    addCustomExercise,
    removeCustomExercise,
    importData,
    clearEverything,
    refresh,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
