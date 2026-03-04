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

/** 시간이 정해진 이벤트용 알림 옵션 */
export const TIMED_REMINDER_OPTIONS: { label: string; value: ReminderType }[] = [
  { label: '없음',       value: 'none' },
  { label: '시작 시간',  value: 'on_time' },
  { label: '5분 전',     value: '5min' },
  { label: '10분 전',    value: '10min' },
  { label: '15분 전',    value: '15min' },
  { label: '30분 전',    value: '30min' },
  { label: '1시간 전',   value: '1hour' },
  { label: '1일 전',     value: '1day' },
];

/** 종일 이벤트용 알림 옵션 */
export const ALL_DAY_REMINDER_OPTIONS: { label: string; value: ReminderType }[] = [
  { label: '없음',              value: 'none' },
  { label: '당일 오전 9시',     value: 'same_day_9am' },
  { label: '1일 전 오전 9시',   value: '1day_before_9am' },
];

/** 모든 알림 옵션 (상세 화면 레이블 조회용) */
export const REMINDER_OPTIONS: { label: string; value: ReminderType }[] = [
  ...TIMED_REMINDER_OPTIONS,
  ...ALL_DAY_REMINDER_OPTIONS.filter((o) => o.value !== 'none'),
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

export const CATEGORY_CARD_COLORS: Record<ScheduleCategory, { light: string; dark: string }> = {
  walk:     { light: '#FCE7AE', dark: '#4A3D1A' },
  meal:     { light: '#C6F0C6', dark: '#1A3D1A' },
  hospital: { light: '#E8A8B8', dark: '#4A2A34' },
  medicine: { light: '#C09BBC', dark: '#3D2A4A' },
  bath:     { light: '#A8D8EA', dark: '#1A3D4A' },
  other:    { light: '#F9BEB0', dark: '#4A2E26' },
};

export const CATEGORY_TEXT_COLORS: Record<ScheduleCategory, { light: string; dark: string }> = {
  walk:     { light: '#5C4B17', dark: '#FCE7AE' },
  meal:     { light: '#1A5C1A', dark: '#C6F0C6' },
  hospital: { light: '#6B2840', dark: '#E8A8B8' },
  medicine: { light: '#5C2D6B', dark: '#C09BBC' },
  bath:     { light: '#1A4A5C', dark: '#A8D8EA' },
  other:    { light: '#6B3528', dark: '#F9BEB0' },
};
