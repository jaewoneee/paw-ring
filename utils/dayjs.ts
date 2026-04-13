import dayjs from 'dayjs';
import 'dayjs/locale/ko';

dayjs.locale('ko');

export default dayjs;
export { type Dayjs } from 'dayjs';

// --- 날짜 포맷 ---

/** ISO 날짜 키: "2026-03-06" */
export function formatISODate(date: dayjs.ConfigType): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/** 한국어 날짜 + 요일: "2026년 3월 6일 (금)" */
export function formatKoreanDate(date: dayjs.ConfigType): string {
  return dayjs(date).format('YYYY년 M월 D일 (dd)');
}

/** 한국어 날짜 (요일 없음): "2026년 3월 6일" */
export function formatKoreanDateNoDay(date: dayjs.ConfigType): string {
  return dayjs(date).format('YYYY년 M월 D일');
}

/** 한국어 날짜 + 풀 요일: "2026년 3월 6일 금요일" */
export function formatKoreanDateFull(date: dayjs.ConfigType): string {
  return dayjs(date).format('YYYY년 M월 D일 dddd');
}

/** 월 레이블: "2026년 3월" */
export function formatMonthLabel(date: dayjs.ConfigType): string {
  return dayjs(date).format('YYYY년 M월');
}

/** 짧은 월: "3월" */
export function formatShortMonth(date: dayjs.ConfigType): string {
  return dayjs(date).format('M월');
}

/** 표시용 날짜: "2026. 03. 06" */
export function formatDisplayDate(date: dayjs.ConfigType): string {
  return dayjs(date).format('YYYY. MM. DD');
}

/** 짧은 날짜 + 요일: "3월 6일 (금)" */
export function formatShortDate(date: dayjs.ConfigType): string {
  return dayjs(date).format('M월 D일 (dd)');
}

// --- 로컬 타임존 ISO 변환 ---

/**
 * 로컬 타임존 기준 ISO 문자열 반환: "2026-03-08T09:00:00"
 *
 * ⚠️ 스케줄 날짜를 DB에 저장할 때 반드시 이 함수를 사용할 것.
 *    .toISOString()은 UTC로 변환하므로 사용 금지.
 *
 * @see .claude/product/datetime-policy.md
 */
export function toLocalISOString(date: dayjs.ConfigType): string {
  return dayjs(date).format('YYYY-MM-DDTHH:mm:ss');
}

// --- 시간 포맷 ---

/** 24시간 형식: "14:30" */
export function formatTime24(date: dayjs.ConfigType): string {
  return dayjs(date).format('HH:mm');
}

/** 오전/오후 형식: "오후 02:30" */
export function formatTime12(date: dayjs.ConfigType): string {
  return dayjs(date).format('A hh:mm');
}

// --- 상대 날짜 ---

/** 상대 날짜 라벨: "오늘", "어제", "3월 21일 (금)" */
export function formatDateLabel(date: dayjs.ConfigType): string {
  const today = formatISODate(dayjs());
  const yesterday = formatISODate(dayjs().subtract(1, 'day'));
  const target = formatISODate(dayjs(date));

  if (target === today) return '오늘';
  if (target === yesterday) return '어제';
  return dayjs(date).format('M월 D일 (dd)');
}

/** 미래 기준 상대 날짜 라벨: "오늘", "내일", "3월 26일 (목)" */
export function formatFutureDateLabel(date: dayjs.ConfigType): string {
  const today = formatISODate(dayjs());
  const tomorrow = formatISODate(dayjs().add(1, 'day'));
  const target = formatISODate(dayjs(date));

  if (target === today) return '오늘';
  if (target === tomorrow) return '내일';
  return dayjs(date).format('M월 D일 (dd)');
}

// --- 상대 시간 ---

/** 상대 시간: "방금 전", "3분 전", "2시간 전", "3일 전", "1주일 전", "1개월 전" */
export function formatRelativeTime(date: dayjs.ConfigType): string {
  const now = dayjs();
  const target = dayjs(date);
  const diffMin = now.diff(target, 'minute');

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = now.diff(target, 'hour');
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = now.diff(target, 'day');
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 14) return '1주일 전';
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주일 전`;
  if (diffDay < 60) return '1개월 전';
  return `${Math.floor(diffDay / 30)}개월 전`;
}
