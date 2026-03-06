export type ScheduleCategory = 'walk' | 'meal' | 'hospital' | 'medicine' | 'bath' | 'other';
export type ReminderType = 'none' | 'on_time' | '5min' | '10min' | '15min' | '30min' | '1hour' | '1day' | 'same_day_9am' | '1day_before_9am';
export type CompletionStatus = 'completed' | 'dismissed';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type RecurrenceEndType = 'never' | 'date';

/** Supabase schedules 테이블 스키마 */
export interface Schedule {
  id: string;
  pet_id: string;
  owner_id: string;
  title: string;
  category: ScheduleCategory;
  memo: string | null;
  start_date: string;
  end_date: string | null;
  is_all_day: boolean;
  is_recurring: boolean;
  rrule: string | null;
  recurrence_end_date: string | null;
  reminder: ReminderType;
  is_completable: boolean;
  created_at: string;
  updated_at: string;
}

/** Supabase schedule_completions 테이블 스키마 */
export interface ScheduleCompletion {
  id: string;
  schedule_id: string;
  completion_date: string;
  status: CompletionStatus;
  completed_by: string;
  completed_at: string;
}

/** 스케줄 생성 입력 */
export interface CreateScheduleInput {
  pet_id: string;
  owner_id: string;
  title: string;
  category: ScheduleCategory;
  memo?: string;
  start_date: string;
  end_date?: string;
  is_all_day?: boolean;
  reminder?: ReminderType;
  is_recurring?: boolean;
  rrule?: string;
  recurrence_end_date?: string;
  is_completable?: boolean;
}

/** 캘린더 렌더링용 가상 인스턴스 */
export interface ScheduleInstance {
  schedule: Schedule;
  occurrenceDate: string; // "YYYY-MM-DD"
  isRecurringInstance: boolean;
}

/** Supabase schedule_exceptions 테이블 스키마 */
export interface ScheduleException {
  id: string;
  schedule_id: string;
  exception_date: string; // "YYYY-MM-DD"
  type: 'modified' | 'deleted';
  modified_fields: Partial<Pick<Schedule, 'title' | 'category' | 'memo' | 'start_date' | 'end_date' | 'is_all_day' | 'reminder' | 'is_completable'>> | null;
  created_at: string;
}

/** 스케줄 수정 입력 */
export type UpdateScheduleInput = Partial<
  Pick<Schedule, 'title' | 'category' | 'memo' | 'start_date' | 'end_date' | 'is_all_day' | 'reminder' | 'is_recurring' | 'rrule' | 'recurrence_end_date' | 'is_completable'>
>;
