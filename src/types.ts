export type CategoryId = 'push' | 'pull' | 'legs' | 'core' | 'grip';
export type UnitType = 'reps' | 'seconds';
export type Quality = 1 | 0.8 | 0.5;
export type PageId = 'today' | 'records' | 'stats' | 'library' | 'settings';

export interface Exercise {
  id: string;
  name: string;
  category: CategoryId;
  group: string;
  unitType: UnitType;
  /** 每 10 次、每侧 10 次或每 30 秒的固定得分 */
  unitScore: number;
  perSide: boolean;
  level: number;
  aliases: string[];
  cue: string;
  equipment: string;
  custom?: boolean;
}

export interface WorkoutRecord {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  category: CategoryId;
  group: string;
  unitType: UnitType;
  unitScore: number;
  perSide: boolean;
  quality: Quality;
  amount?: number;
  leftAmount?: number;
  rightAmount?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  weeklyGoal: number;
  hardDayLimit: number;
  easyDayLimit: number;
  weekStartsOn: 0 | 1;
  defaultQuality: Quality;
  lastExportAt?: string;
}

export interface BackupData {
  app: 'dongfen';
  schemaVersion: 1;
  exportedAt: string;
  settings: AppSettings;
  customExercises: Exercise[];
  records: WorkoutRecord[];
}

export interface RecordDraft {
  date: string;
  exercise: Exercise;
  quality: Quality;
  amount?: number;
  leftAmount?: number;
  rightAmount?: number;
  note?: string;
}

export interface OpenLogOptions {
  exercise?: Exercise;
  date?: string;
  record?: WorkoutRecord;
}

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  english: string;
  description: string;
  color: string;
  soft: string;
}
