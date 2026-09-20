export type RecordType = 'expense' | 'income'
export interface RecordItem { id?: number; type: RecordType; amount: number; categoryId: number; date: string; remark: string; createdAt: number; updatedAt: number }
/** `parentId` is omitted for a top-level category. Bills always retain the selected category id. */
export interface Category { id?: number; name: string; type: RecordType; icon: string; sort: number; parentId?: number; createdAt: number }
export interface AppSetting { key: string; value: string }
export interface DailyExpense { date: string; amount: number }
export interface BackupFile { schemaVersion: number; appVersion: string; exportTime: string; records: RecordItem[]; categories: Category[]; settings: AppSetting[] }
export interface MonthSummary { expense: number; income: number; balance: number }
