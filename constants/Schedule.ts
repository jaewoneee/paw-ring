import type { RecurrenceFrequency, ReminderType, ScheduleCategory } from '@/types/schedule';

interface CategoryMeta {
  label: string;
  icon: string;
  color: string;
}

export const CATEGORY_META: Record<ScheduleCategory, CategoryMeta> = {
  walk:     { label: '산책',  icon: 'paw',        color: '#F59E0B' },
  meal:     { label: '식사',  icon: 'cutlery',    color: '#22C55E' },
  hospital: { label: '병원', icon: 'hospital-o', color: '#EF4444' },
  medicine: { label: '약',   icon: 'medkit',     color: '#8B5CF6' },
  bath:     { label: '목욕', icon: 'tint',       color: '#3B82F6' },
  other:    { label: '기타', icon: 'tag',        color: '#6B7280' },
};

export const CATEGORIES: ScheduleCategory[] = [
  'walk', 'meal', 'hospital', 'medicine', 'bath', 'other',
];

export const REMINDER_OPTIONS: { label: string; value: ReminderType }[] = [
  { label: '없음',     value: 'none' },
  { label: '정시',     value: 'on_time' },
  { label: '10분 전',  value: '10min' },
  { label: '30분 전',  value: '30min' },
  { label: '1시간 전', value: '1hour' },
];

export const RECURRENCE_FREQUENCY_OPTIONS: { label: string; value: RecurrenceFrequency }[] = [
  { label: '매일', value: 'daily' },
  { label: '매주', value: 'weekly' },
  { label: '격주', value: 'biweekly' },
  { label: '매월', value: 'monthly' },
];

export const DAY_OF_WEEK_OPTIONS: { label: string; value: string }[] = [
  { label: '월', value: 'MO' },
  { label: '화', value: 'TU' },
  { label: '수', value: 'WE' },
  { label: '목', value: 'TH' },
  { label: '금', value: 'FR' },
  { label: '토', value: 'SA' },
  { label: '일', value: 'SU' },
];

export const RECURRENCE_END_OPTIONS: { label: string; value: 'never' | 'date' }[] = [
  { label: '종료 없음', value: 'never' },
  { label: '날짜 지정', value: 'date' },
];
