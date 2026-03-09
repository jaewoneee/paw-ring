import { isFirstOrLastOccurrence } from "@/utils/rrule";

describe("isFirstOrLastOccurrence", () => {
  // ─── 매일 반복 (종료일 있음) ───

  describe("매일 반복 (3/1 ~ 3/10)", () => {
    const startDate = "2026-03-01T09:00:00";
    const rrule = "FREQ=DAILY";
    const recurrenceEndDate = "2026-03-10T23:59:59";

    it("첫 번째 날짜 → isFirst: true, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-01", recurrenceEndDate);
      expect(result).toEqual({ isFirst: true, isLast: false });
    });

    it("마지막 날짜 → isFirst: false, isLast: true", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-10", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: true });
    });

    it("중간 날짜 → isFirst: false, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-05", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: false });
    });

    it("두 번째 날짜 → isFirst: false, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-02", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: false });
    });

    it("끝에서 두 번째 날짜 → isFirst: false, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-09", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: false });
    });
  });

  // ─── 매일 반복 (종료일 없음) ───

  describe("매일 반복 (종료일 없음)", () => {
    const startDate = "2026-03-01T09:00:00";
    const rrule = "FREQ=DAILY";

    it("첫 번째 날짜 → isFirst: true, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-01");
      expect(result).toEqual({ isFirst: true, isLast: false });
    });

    it("아무 중간 날짜 → isFirst: false, isLast: false (무한 반복이므로 마지막 없음)", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-06-15");
      expect(result).toEqual({ isFirst: false, isLast: false });
    });
  });

  // ─── 매주 반복 (요일 지정) ───

  describe("매주 월,수,금 반복 (3/2 시작, 3/31까지)", () => {
    const startDate = "2026-03-02T09:00:00"; // 월요일
    const rrule = "FREQ=WEEKLY;BYDAY=MO,WE,FR";
    const recurrenceEndDate = "2026-03-31T23:59:59";

    it("시작일(월) → isFirst: true, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-02", recurrenceEndDate);
      expect(result).toEqual({ isFirst: true, isLast: false });
    });

    it("중간 수요일 → isFirst: false, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-11", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: false });
    });

    it("마지막 금요일(3/27) → isFirst: false, isLast: false (3/30 월요일이 남아있음)", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-27", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: false });
    });

    it("마지막 occurrence(3/30 월) → isFirst: false, isLast: true", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-30", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: true });
    });
  });

  // ─── 매월 반복 ───

  describe("매월 반복 (1/15 시작, 5/15까지)", () => {
    const startDate = "2026-01-15T09:00:00";
    const rrule = "FREQ=MONTHLY";
    const recurrenceEndDate = "2026-05-15T23:59:59";

    it("첫 번째(1/15) → isFirst: true, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-01-15", recurrenceEndDate);
      expect(result).toEqual({ isFirst: true, isLast: false });
    });

    it("중간(3/15) → isFirst: false, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-15", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: false });
    });

    it("마지막(5/15) → isFirst: false, isLast: true", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-05-15", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: true });
    });
  });

  // ─── UNTIL이 rrule에 포함된 경우 ───

  describe("UNTIL이 rrule에 포함된 매일 반복", () => {
    const startDate = "2026-03-01T09:00:00";
    const rrule = "FREQ=DAILY;UNTIL=20260305T235959";

    it("마지막 날짜(3/5) → isFirst: false, isLast: true", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-05");
      expect(result).toEqual({ isFirst: false, isLast: true });
    });
  });

  // ─── 엣지 케이스: 단 하루짜리 반복 ───

  describe("단 하루짜리 반복 (시작일 = 종료일)", () => {
    const startDate = "2026-03-01T09:00:00";
    const rrule = "FREQ=DAILY";
    const recurrenceEndDate = "2026-03-01T23:59:59";

    it("유일한 날짜 → isFirst: true, isLast: true", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-01", recurrenceEndDate);
      expect(result).toEqual({ isFirst: true, isLast: true });
    });
  });

  // ─── 엣지 케이스: 이틀짜리 반복 ───

  describe("이틀짜리 반복 (3/1 ~ 3/2)", () => {
    const startDate = "2026-03-01T09:00:00";
    const rrule = "FREQ=DAILY";
    const recurrenceEndDate = "2026-03-02T23:59:59";

    it("첫째 날 → isFirst: true, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-01", recurrenceEndDate);
      expect(result).toEqual({ isFirst: true, isLast: false });
    });

    it("둘째 날 → isFirst: false, isLast: true", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-02", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: true });
    });
  });

  // ─── DTSTART 규칙: 시작일이 요일 규칙과 다른 경우 ───

  describe("DTSTART 규칙 — 화요일에 매주 토요일 반복 생성", () => {
    const startDate = "2026-03-03T09:00:00"; // 화요일
    const rrule = "FREQ=WEEKLY;BYDAY=SA";
    const recurrenceEndDate = "2026-03-21T23:59:59";

    it("시작일(화) → isFirst: true, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-03", recurrenceEndDate);
      expect(result).toEqual({ isFirst: true, isLast: false });
    });

    it("첫 토요일(3/7) → isFirst: false, isLast: false", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-07", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: false });
    });

    it("마지막 토요일(3/21) → isFirst: false, isLast: true", () => {
      const result = isFirstOrLastOccurrence(startDate, rrule, "2026-03-21", recurrenceEndDate);
      expect(result).toEqual({ isFirst: false, isLast: true });
    });
  });
});
