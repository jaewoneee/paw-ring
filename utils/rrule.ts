import dayjs from "./dayjs";

import type { RecurrenceFrequency } from "@/types/schedule";

interface RRuleParams {
  frequency: RecurrenceFrequency;
  selectedDays?: string[];
  endDate?: string;
}

const DAY_LABELS: Record<string, string> = {
  MO: "월",
  TU: "화",
  WE: "수",
  TH: "목",
  FR: "금",
  SA: "토",
  SU: "일",
};

/** UI 선택 → rrule 문자열 생성 */
export function buildRRule(params: RRuleParams): string {
  const parts: string[] = [];

  switch (params.frequency) {
    case "daily":
      parts.push("FREQ=DAILY");
      break;
    case "weekly":
      parts.push("FREQ=WEEKLY");
      if (params.selectedDays && params.selectedDays.length > 0) {
        parts.push(`BYDAY=${params.selectedDays.join(",")}`);
      }
      break;
    case "biweekly":
      parts.push("FREQ=WEEKLY");
      parts.push("INTERVAL=2");
      break;
    case "monthly":
      parts.push("FREQ=MONTHLY");
      break;
  }

  if (params.endDate) {
    // 로컬 타임존 기준 UNTIL 생성 (UTC 변환 없음)
    const until = dayjs(params.endDate).format("YYYYMMDDTHHmmss");
    parts.push(`UNTIL=${until}`);
  }

  return parts.join(";");
}

/** rrule 문자열 → UI 상태 복원 (편집 화면용) */
export function parseRRule(rrule: string): {
  frequency: RecurrenceFrequency;
  selectedDays: string[];
  hasEndDate: boolean;
} {
  const parts = rrule.split(";");
  let frequency: RecurrenceFrequency = "daily";
  let selectedDays: string[] = [];
  let interval = 1;

  for (const part of parts) {
    const [key, value] = part.split("=");
    switch (key) {
      case "FREQ":
        if (value === "DAILY") frequency = "daily";
        else if (value === "WEEKLY") frequency = "weekly";
        else if (value === "MONTHLY") frequency = "monthly";
        break;
      case "INTERVAL":
        interval = parseInt(value, 10);
        break;
      case "BYDAY":
        selectedDays = value.split(",");
        break;
    }
  }

  if (frequency === "weekly" && interval === 2) {
    frequency = "biweekly";
  }

  const hasEndDate = parts.some((p) => p.startsWith("UNTIL="));
  return { frequency, selectedDays, hasEndDate };
}

const RRULE_DAY_TO_DAYJS: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

/** rrule 문자열에서 UNTIL 값을 Date로 파싱 */
function parseUntil(rrule: string): dayjs.Dayjs | null {
  // 로컬 포맷 (Z 없음) 및 레거시 UTC 포맷 (Z 포함) 모두 지원
  const match = rrule.match(/UNTIL=(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
  if (!match) return null;
  return dayjs(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`);
}

/**
 * rrule + start_date → 범위 내 발생 날짜 배열 반환.
 * 캘린더 월간 뷰에서 가상 인스턴스 렌더링용.
 */
export function expandRRule(
  startDate: string,
  rrule: string,
  rangeStart: string,
  rangeEnd: string,
  recurrenceEndDate?: string | null,
): string[] {
  const { frequency, selectedDays } = parseRRule(rrule);
  const start = dayjs(startDate);
  const rStart = dayjs(rangeStart);
  const rEnd = dayjs(rangeEnd);

  // 유효 종료일: UNTIL, recurrenceEndDate, rangeEnd 중 가장 이른 날짜
  const until = parseUntil(rrule);
  const recEnd = recurrenceEndDate ? dayjs(recurrenceEndDate) : null;
  let effectiveEnd = rEnd;
  if (until && until.isBefore(effectiveEnd)) effectiveEnd = until;
  if (recEnd && recEnd.isBefore(effectiveEnd)) effectiveEnd = recEnd;

  const results: string[] = [];

  if (frequency === "weekly" && selectedDays.length > 0) {
    // 주간 + 요일 지정: 각 주의 지정된 요일마다 생성
    const targetDays = selectedDays.map((d) => RRULE_DAY_TO_DAYJS[d]).filter((n) => n !== undefined);

    // start_date 자체는 항상 첫 번째 occurrence (RFC 5545 DTSTART 규칙)
    // 요일이 BYDAY에 없더라도 시작일은 포함
    if (!start.isBefore(rStart, "day") && !start.isAfter(effectiveEnd, "day") && !start.isAfter(rEnd, "day")) {
      results.push(start.format("YYYY-MM-DD"));
    }

    // 시작 주의 일요일부터
    let weekStart = start.startOf("week");
    // 최적화: rangeStart가 멀면 점프
    if (rStart.isAfter(weekStart)) {
      const weeksDiff = Math.floor(rStart.diff(weekStart, "week"));
      if (weeksDiff > 1) weekStart = weekStart.add(weeksDiff - 1, "week");
    }

    while (!weekStart.isAfter(effectiveEnd, "day")) {
      for (const dow of targetDays) {
        const d = weekStart.day(dow);
        if (d.isBefore(start, "day")) continue;
        if (d.isSame(start, "day")) continue; // 이미 위에서 추가됨
        if (d.isAfter(effectiveEnd, "day")) continue;
        if (d.isBefore(rStart, "day")) continue;
        if (d.isAfter(rEnd, "day")) continue;
        results.push(d.format("YYYY-MM-DD"));
      }
      weekStart = weekStart.add(1, "week");
    }
  } else {
    // daily, biweekly, monthly: 단순 간격 증가
    let step: [number, dayjs.ManipulateType];
    switch (frequency) {
      case "daily":
        step = [1, "day"];
        break;
      case "biweekly":
        step = [2, "week"];
        break;
      case "monthly":
        step = [1, "month"];
        break;
      default: // weekly without BYDAY
        step = [1, "week"];
        break;
    }

    let cursor = start;

    // 최적화: rangeStart가 멀면 커서 점프 (step 간격의 배수로 정렬 유지)
    if (rStart.isAfter(cursor)) {
      const diff = rStart.diff(cursor, step[1] as dayjs.ManipulateType);
      const stepsToJump = Math.floor(diff / step[0]);
      if (stepsToJump > 0) {
        cursor = cursor.add(stepsToJump * step[0], step[1] as dayjs.ManipulateType);
      }
    }

    while (!cursor.isAfter(effectiveEnd, "day") && !cursor.isAfter(rEnd, "day")) {
      if (!cursor.isBefore(rStart, "day") && !cursor.isBefore(start, "day")) {
        results.push(cursor.format("YYYY-MM-DD"));
      }
      cursor = cursor.add(step[0], step[1]);
    }
  }

  return [...new Set(results)].sort();
}

/**
 * 현재 occurrence가 첫 번째 또는 마지막인지 판별.
 * 삭제 UI 분기용: 첫/마지막이면 "모든 일정 삭제", 중간이면 "이후 모든 일정 삭제"
 */
export function isFirstOrLastOccurrence(
  startDate: string,
  rrule: string,
  occurrenceDate: string,
  recurrenceEndDate?: string | null,
): { isFirst: boolean; isLast: boolean } {
  const occ = dayjs(occurrenceDate);
  const start = dayjs(startDate);

  const isFirst = occ.isSame(start, "day");

  // 마지막 판별: occurrence 다음날~+1년 범위에 다른 occurrence가 없으면 마지막
  const nextDay = occ.add(1, "day").format("YYYY-MM-DD");
  const farFuture = occ.add(1, "year").format("YYYY-MM-DD");
  const futureOccurrences = expandRRule(startDate, rrule, nextDay, farFuture, recurrenceEndDate);
  const isLast = futureOccurrences.length === 0;

  return { isFirst, isLast };
}

/** rrule → 사람이 읽을 수 있는 라벨 (상세 화면용) */
export function formatRRuleLabel(rrule: string): string {
  const { frequency, selectedDays } = parseRRule(rrule);

  switch (frequency) {
    case "daily":
      return "매일";
    case "weekly":
      if (selectedDays.length > 0) {
        const labels = selectedDays.map((d) => DAY_LABELS[d] || d).join(", ");
        return `매주 ${labels}`;
      }
      return "매주";
    case "biweekly":
      return "격주";
    case "monthly":
      return "매월";
    default:
      return "반복";
  }
}
