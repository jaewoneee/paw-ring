import { expandRRule, buildRRule, parseRRule } from "@/utils/rrule";

describe("expandRRule", () => {
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

  // ─── 격주 반복 ───

  it("격주 반복 — recurrence_end_date가 시작일 전날이면 0건", () => {
    const result = expandRRule(
      "2026-03-14T00:00:00",
      "FREQ=WEEKLY;INTERVAL=2",
      "2026-03-01",
      "2026-03-31",
      "2026-03-13T23:59:59",
    );
    expect(result).toEqual([]);
  });

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

  // ─── 매주 + 요일 지정 ───

  it("매주 월/수/금 반복", () => {
    const result = expandRRule(
      "2026-03-02T09:00:00",        // 월요일
      "FREQ=WEEKLY;BYDAY=MO,WE,FR",
      "2026-03-01",
      "2026-03-08",
    );
    expect(result).toEqual(["2026-03-02", "2026-03-04", "2026-03-06"]);
  });

  it("매주 요일 지정 — recurrenceEndDate 경계에서 정확히 종료", () => {
    const result = expandRRule(
      "2026-03-02T09:00:00",
      "FREQ=WEEKLY;BYDAY=MO,WE,FR",
      "2026-03-01",
      "2026-03-31",
      "2026-03-04T23:59:59",
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
    const result = expandRRule(
      "2025-01-06T00:00:00",
      "FREQ=WEEKLY",
      "2026-03-02",
      "2026-03-15",
    );
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

  // ─── DTSTART 규칙: 시작일은 BYDAY와 무관하게 항상 포함 ───

  it("매주 토요일 — 시작일이 화요일이면 화요일(시작일) + 토요일들", () => {
    // 3/11(수) 시작, 매주 토요일 반복
    const result = expandRRule(
      "2026-03-11T00:00:00",
      "FREQ=WEEKLY;BYDAY=SA",
      "2026-03-01",
      "2026-03-31",
    );
    // 3/11(시작일, 수요일) + 3/14(토), 3/21(토), 3/28(토)
    expect(result).toEqual(["2026-03-11", "2026-03-14", "2026-03-21", "2026-03-28"]);
  });

  it("매주 월요일 — 시작일이 목요일이면 목요일(시작일) + 월요일들", () => {
    // 3/5(목) 시작, 매주 월요일 반복
    const result = expandRRule(
      "2026-03-05T00:00:00",
      "FREQ=WEEKLY;BYDAY=MO",
      "2026-03-01",
      "2026-03-20",
    );
    // 3/5(시작일, 목) + 3/9(월), 3/16(월)
    expect(result).toEqual(["2026-03-05", "2026-03-09", "2026-03-16"]);
  });

  it("매주 요일 — 시작일이 해당 요일과 일치하면 중복 없음", () => {
    // 3/7(토) 시작, 매주 토요일 반복 → 시작일 = 토요일, 중복 X
    const result = expandRRule(
      "2026-03-07T00:00:00",
      "FREQ=WEEKLY;BYDAY=SA",
      "2026-03-01",
      "2026-03-31",
    );
    expect(result).toEqual(["2026-03-07", "2026-03-14", "2026-03-21", "2026-03-28"]);
  });

  it("DTSTART — 시작일이 rangeStart 이전이면 시작일 미포함", () => {
    const result = expandRRule(
      "2026-02-25T00:00:00",  // 2월 25일(수) 시작
      "FREQ=WEEKLY;BYDAY=SA",
      "2026-03-01",           // 3월 1일부터 조회
      "2026-03-15",
    );
    // 시작일(2/25)은 범위 밖이라 미포함, 토요일만: 3/7, 3/14
    expect(result).toEqual(["2026-03-07", "2026-03-14"]);
  });

  // ─── 반복 스케줄 분열 시나리오 ───

  it("분열: 원본 daily 3/8~3/10 + 파생 weekly SA 3/11~ → 날짜 겹침 없음", () => {
    // 원본: 3/8 시작, 매일, 3/10까지
    const original = expandRRule(
      "2026-03-08T00:00:00",
      "FREQ=DAILY",
      "2026-03-01",
      "2026-03-31",
      "2026-03-10T23:59:59",
    );
    expect(original).toEqual(["2026-03-08", "2026-03-09", "2026-03-10"]);

    // 파생: 3/11 시작, 매주 토요일 (DTSTART 3/11 포함)
    const derived = expandRRule(
      "2026-03-11T00:00:00",
      "FREQ=WEEKLY;BYDAY=SA",
      "2026-03-01",
      "2026-03-31",
    );
    expect(derived).toEqual(["2026-03-11", "2026-03-14", "2026-03-21", "2026-03-28"]);

    // 두 결과에 겹치는 날짜가 없어야 함
    const overlap = original.filter(d => derived.includes(d));
    expect(overlap).toEqual([]);
  });

  it("분열: 파생 스케줄 start_date가 fromDate여야 원본과 겹치지 않음", () => {
    // 잘못된 케이스: 파생 start_date가 원본 시작일(3/8)이면 겹침 발생
    const wrongDerived = expandRRule(
      "2026-03-08T00:00:00",  // 원본 시작일을 그대로 쓴 경우 (버그)
      "FREQ=WEEKLY;BYDAY=SA",
      "2026-03-01",
      "2026-03-31",
    );
    // 3/8(DTSTART)이 원본 범위(3/8~3/10)와 겹침!
    expect(wrongDerived).toContain("2026-03-08");

    // 올바른 케이스: 파생 start_date = fromDate(3/11)
    const correctDerived = expandRRule(
      "2026-03-11T00:00:00",  // fromDate 기준
      "FREQ=WEEKLY;BYDAY=SA",
      "2026-03-01",
      "2026-03-31",
    );
    expect(correctDerived).not.toContain("2026-03-08");
    expect(correctDerived).not.toContain("2026-03-09");
    expect(correctDerived).not.toContain("2026-03-10");
    expect(correctDerived[0]).toBe("2026-03-11");
  });

  it("분열: 매일→매일 변경 시에도 겹침 없음", () => {
    // 원본: 3/8 daily, 3/14까지
    const original = expandRRule(
      "2026-03-08T00:00:00",
      "FREQ=DAILY",
      "2026-03-01",
      "2026-03-31",
      "2026-03-14T23:59:59",
    );
    // 파생: 3/15 daily
    const derived = expandRRule(
      "2026-03-15T00:00:00",
      "FREQ=DAILY",
      "2026-03-01",
      "2026-03-31",
    );

    const overlap = original.filter(d => derived.includes(d));
    expect(overlap).toEqual([]);
    expect(original[original.length - 1]).toBe("2026-03-14");
    expect(derived[0]).toBe("2026-03-15");
  });
});

describe("buildRRule / parseRRule", () => {
  it("daily → build → parse roundtrip", () => {
    const rrule = buildRRule({ frequency: "daily" });
    const parsed = parseRRule(rrule);
    expect(parsed.frequency).toBe("daily");
    expect(parsed.selectedDays).toEqual([]);
  });

  it("weekly + 요일 → build → parse roundtrip", () => {
    const rrule = buildRRule({ frequency: "weekly", selectedDays: ["MO", "WE", "FR"] });
    const parsed = parseRRule(rrule);
    expect(parsed.frequency).toBe("weekly");
    expect(parsed.selectedDays).toEqual(["MO", "WE", "FR"]);
  });

  it("biweekly → build → parse roundtrip", () => {
    const rrule = buildRRule({ frequency: "biweekly" });
    const parsed = parseRRule(rrule);
    expect(parsed.frequency).toBe("biweekly");
  });

  it("monthly → build → parse roundtrip", () => {
    const rrule = buildRRule({ frequency: "monthly" });
    const parsed = parseRRule(rrule);
    expect(parsed.frequency).toBe("monthly");
  });

  it("endDate 포함 시 UNTIL 생성 및 파싱", () => {
    const rrule = buildRRule({
      frequency: "daily",
      endDate: "2026-03-31T23:59:59",
    });
    expect(rrule).toContain("UNTIL=");
    const parsed = parseRRule(rrule);
    expect(parsed.hasEndDate).toBe(true);
  });

  it("endDate 없으면 UNTIL 미포함", () => {
    const rrule = buildRRule({ frequency: "daily" });
    expect(rrule).not.toContain("UNTIL=");
    const parsed = parseRRule(rrule);
    expect(parsed.hasEndDate).toBe(false);
  });
});
