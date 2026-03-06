import dayjs, {
  type Dayjs,
  formatDisplayDate,
  formatISODate,
  formatTime24,
} from "./dayjs";

/** 날짜를 "YYYY. MM. DD" 형식으로 포맷 */
export function formatDate(date: Date | string): string {
  return formatDisplayDate(date);
}

/** 날짜를 ISO 문자열(YYYY-MM-DD)로 변환 */
export function toDateString(date: Date): string {
  return formatISODate(date);
}

/** 월간 캘린더 42일(6행x7열) 그리드 반환 (일요일 시작) */
export function getMonthGrid(year: number, month: number): Dayjs[] {
  const firstDay = dayjs().year(year).month(month).startOf("month");
  const startOfGrid = firstDay.startOf("week");
  const days: Dayjs[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(startOfGrid.add(i, "day"));
  }
  return days;
}

/** 월간 그리드의 시작/끝 날짜 범위 반환 (스케줄 fetch용) */
export function getMonthRange(
  year: number,
  month: number
): { start: string; end: string } {
  const firstDay = dayjs().year(year).month(month).startOf("month");
  const start = formatISODate(firstDay.startOf("week"));
  const end = formatISODate(firstDay.endOf("month").endOf("week"));
  return { start, end };
}

/** ISO 문자열에서 시간만 "HH:mm" 포맷으로 추출 */
export function formatTime(isoString: string): string {
  return formatTime24(isoString);
}

/** 특정 날짜가 속한 주의 7일(일~토) 반환 */
export function getWeekGrid(date: string): Dayjs[] {
  const d = dayjs(date);
  const startOfWeek = d.startOf("week");
  const days: Dayjs[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(startOfWeek.add(i, "day"));
  }
  return days;
}

/** 두 날짜가 같은 날인지 비교 */
export function isSameDay(
  a: string | Date | Dayjs,
  b: string | Date | Dayjs
): boolean {
  return formatISODate(a) === formatISODate(b);
}
