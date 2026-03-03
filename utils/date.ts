import dayjs from "dayjs";

/** 날짜를 "YYYY. MM. DD" 형식으로 포맷 */
export function formatDate(date: Date | string): string {
  return dayjs(date).format("YYYY. MM. DD");
}

/** 날짜를 ISO 문자열(YYYY-MM-DD)로 변환 (Firestore 저장용) */
export function toDateString(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}
