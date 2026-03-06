import type {
  RecurrenceFrequency,
  ReminderType,
} from '@/types/schedule';

interface CategoryMeta {
  label: string;
  icon: string;
  color: string;
}

/** @deprecated DB 카테고리로 전환 중. useCategoryContext().getCategoryMeta() 사용 권장 */
export const CATEGORY_META: Record<string, CategoryMeta> = {
  walk: { label: '산책', icon: 'paw', color: '#F59E0B' },
  meal: { label: '식사', icon: 'cutlery', color: '#22C55E' },
  hospital: { label: '병원', icon: 'hospital-o', color: '#EF4444' },
  medicine: { label: '약', icon: 'medkit', color: '#8B5CF6' },
  bath: { label: '목욕', icon: 'tint', color: '#3B82F6' },
  other: { label: '기타', icon: 'tag', color: '#6B7280' },
};

export const FALLBACK_CATEGORY_META: CategoryMeta = {
  label: '기타',
  icon: 'tag',
  color: '#6B7280',
};

/** 시간이 정해진 이벤트용 알림 옵션 */
export const TIMED_REMINDER_OPTIONS: { label: string; value: ReminderType }[] =
  [
    { label: '없음', value: 'none' },
    { label: '시작 시간', value: 'on_time' },
    { label: '5분 전', value: '5min' },
    { label: '10분 전', value: '10min' },
    { label: '15분 전', value: '15min' },
    { label: '30분 전', value: '30min' },
    { label: '1시간 전', value: '1hour' },
    { label: '1일 전', value: '1day' },
  ];

/** 종일 이벤트용 알림 옵션 */
export const ALL_DAY_REMINDER_OPTIONS: {
  label: string;
  value: ReminderType;
}[] = [
  { label: '없음', value: 'none' },
  { label: '당일 오전 9시', value: 'same_day_9am' },
  { label: '1일 전 오전 9시', value: '1day_before_9am' },
];

/** 모든 알림 옵션 (상세 화면 레이블 조회용) */
export const REMINDER_OPTIONS: { label: string; value: ReminderType }[] = [
  ...TIMED_REMINDER_OPTIONS,
  ...ALL_DAY_REMINDER_OPTIONS.filter(o => o.value !== 'none'),
];

export const RECURRENCE_FREQUENCY_OPTIONS: {
  label: string;
  value: RecurrenceFrequency;
}[] = [
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

export const RECURRENCE_END_OPTIONS: {
  label: string;
  value: 'never' | 'date';
}[] = [
  { label: '종료 없음', value: 'never' },
  { label: '날짜 지정', value: 'date' },
];

/** 카테고리 색상 프리셋 팔레트 (16색) */
export const CATEGORY_COLOR_PRESETS: string[] = [
  '#F59E0B', '#22C55E', '#EF4444', '#8B5CF6',
  '#3B82F6', '#EC4899', '#F97316', '#14B8A6',
  '#6366F1', '#84CC16', '#06B6D4', '#E11D48',
  '#A855F7', '#10B981', '#F43F5E', '#6B7280',
];

/** 카드 색상 순환 배열 (인덱스 기반) */
export const CARD_COLORS: {
  light: { bg: string; text: string };
  dark: { bg: string; text: string };
}[] = [
  {
    light: { bg: '#4F7FFF', text: '#FFFFFF' },
    dark: { bg: '#2B4A8A', text: '#C4D8FF' },
  },
  {
    light: { bg: '#FFC81D', text: '#5C3A00' },
    dark: { bg: '#8A6200', text: '#FFD88A' },
  },
  {
    light: { bg: '#F86F03', text: '#FFFFFF' },
    dark: { bg: '#8A4200', text: '#FFBC80' },
  },
  {
    light: { bg: '#FFF6F4', text: '#6B3528' },
    dark: { bg: '#5C4440', text: '#FFE0D6' },
  },
  {
    light: { bg: '#13BC43', text: '#FFFFFF' },
    dark: { bg: '#1A6B30', text: '#A0F0B8' },
  },
];
