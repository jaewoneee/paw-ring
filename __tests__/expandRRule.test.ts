import { expandRRule } from "@/utils/rrule";

describe("expandRRule", () => {
  // ─── 이번 버그: recurrence_end_date가 시작일 전날이면 0건 ───

  it("격주 반복 — recurrence_end_date가 시작일 전날이면 0건", () => {
    const result = expandRRule(
      "2026-03-14T00:00:00",        // startDate
      "FREQ=WEEKLY;INTERVAL=2",     // rrule (격주)
      "2026-03-01",                 // rangeStart
      "2026-03-31",                 // rangeEnd
      "2026-03-13T23:59:59",        // recurrenceEndDate (시작일 전날)
    );
    expect(result).toEqual([]);
  });

  // ─── 격주 반복 정상 케이스 ───

  it("격주 반복 — 3/14 시작, 4/8 종료 → 3월 내 2건", () => {
    const result = expandRRule(
      "2026-03-14T00:00:00",
      "FREQ=WEEKLY;INTERVAL=2;UNTIL=20260408T235959",
      "2026-03-01",
      "2026-03-31",
      "2026-04-08T23:59:59",
    );
    expect(result).toEqual(["2026-03-14", "2026-03-28"]);
  });

  it("격주 반복 — 4월 범위 조회 시 올바른 날짜", () => {
    const result = expandRRule(
      "2026-03-14T00:00:00",
      "FREQ=WEEKLY;INTERVAL=2;UNTIL=20260425T235959",
      "2026-04-01",
      "2026-04-30",
      "2026-04-25T23:59:59",
    );
    expect(result).toEqual(["2026-04-11", "2026-04-25"]);
  });

  // ─── 매일 반복 ───

  it("매일 반복 — UNTIL 포함, 범위 내 정확한 날짜 수", () => {
    const result = expandRRule(
      "2026-03-01T09:00:00",
      "FREQ=DAILY;UNTIL=20260305T235959",
      "2026-03-01",
      "2026-03-31",
    );
    expect(result).toEqual([
      "2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05",
    ]);
  });

  it("매일 반복 — recurrenceEndDate로 범위 제한", () => {
    const result = expandRRule(
      "2026-03-01T09:00:00",
      "FREQ=DAILY",
      "2026-03-01",
      "2026-03-31",
      "2026-03-03T23:59:59",
    );
    expect(result).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
  });

  // ─── 매주 + 요일 지정 ───

  it("매주 월/수/금 반복", () => {
    const result = expandRRule(
      "2026-03-02T09:00:00",        // 월요일
      "FREQ=WEEKLY;BYDAY=MO,WE,FR",
      "2026-03-01",
      "2026-03-08",
    );
    // 3/2(월), 3/4(수), 3/6(금)
    expect(result).toEqual(["2026-03-02", "2026-03-04", "2026-03-06"]);
  });

  it("매주 요일 지정 — recurrenceEndDate 경계에서 정확히 종료", () => {
    const result = expandRRule(
      "2026-03-02T09:00:00",
      "FREQ=WEEKLY;BYDAY=MO,WE,FR",
      "2026-03-01",
      "2026-03-31",
      "2026-03-04T23:59:59",        // 수요일까지만
    );
    expect(result).toEqual(["2026-03-02", "2026-03-04"]);
  });

  // ─── 월간 반복 ───

  it("월간 반복 — 3개월 범위", () => {
    const result = expandRRule(
      "2026-01-15T10:00:00",
      "FREQ=MONTHLY",
      "2026-01-01",
      "2026-03-31",
    );
    expect(result).toEqual(["2026-01-15", "2026-02-15", "2026-03-15"]);
  });

  // ─── 범위 밖 시작일 (커서 점프 최적화 검증) ───

  it("매일 반복 — 먼 과거 시작, 현재 범위 조회", () => {
    const result = expandRRule(
      "2025-01-01T00:00:00",
      "FREQ=DAILY",
      "2026-03-01",
      "2026-03-03",
    );
    expect(result).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
  });

  it("매주 반복 — 먼 과거 시작, 현재 범위 조회", () => {
    // 2025-01-06은 월요일, 매주 반복이면 월요일마다
    const result = expandRRule(
      "2025-01-06T00:00:00",
      "FREQ=WEEKLY",
      "2026-03-02",
      "2026-03-15",
    );
    // 2026-03-02(월), 2026-03-09(월)
    expect(result).toEqual(["2026-03-02", "2026-03-09"]);
  });

  // ─── 엣지 케이스 ───

  it("시작일이 rangeEnd 이후면 0건", () => {
    const result = expandRRule(
      "2026-04-01T00:00:00",
      "FREQ=DAILY",
      "2026-03-01",
      "2026-03-31",
    );
    expect(result).toEqual([]);
  });

  it("종료일 없는 반복 — rangeEnd에서 정확히 멈춤", () => {
    const result = expandRRule(
      "2026-03-30T00:00:00",
      "FREQ=DAILY",
      "2026-03-01",
      "2026-03-31",
    );
    expect(result).toEqual(["2026-03-30", "2026-03-31"]);
  });
});
