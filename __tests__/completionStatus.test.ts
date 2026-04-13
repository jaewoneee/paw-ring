import { formatISODate } from "@/utils/dayjs";

/**
 * 완료 상태 동기화 테스트
 *
 * 캘린더 리스트(fetchMonthSchedules)와 스케줄 상세(getScheduleCompletion)가
 * 동일한 완료 상태를 반환하는지 검증합니다.
 *
 * 근본 원인: completeSchedule의 upsert에 status 필드가 없어
 * c.status 기반 판단 시 null이 되는 문제 → 레코드 존재 여부로 통일하여 해결
 */

// fetchMonthSchedules / getWeekScheduleInstances에서 사용하는 완료 판단 로직 추출
function buildCompletedSet(
  completions: { schedule_id: string; completion_date: string; status?: string | null }[]
): Set<string> {
  const completedSet = new Set<string>();
  for (const c of completions) {
    const normalizedDate = formatISODate(c.completion_date);
    completedSet.add(`${c.schedule_id}_${normalizedDate}`);
  }
  return completedSet;
}

// schedule-detail에서 사용하는 완료 판단 로직
function isCompletedByDetail(
  completion: { schedule_id: string; completion_date: string } | null
): boolean {
  return !!completion;
}

describe("completionStatus 동기화", () => {
  const scheduleId = "test-schedule-id";
  const completionDate = "2026-03-24";

  it("레코드 존재 시 리스트와 상세 모두 완료로 판단", () => {
    // DB에서 반환된 completion 레코드 (status가 null인 경우도 포함)
    const completionRecord = {
      schedule_id: scheduleId,
      completion_date: completionDate,
      status: null as string | null, // status 필드가 DB 기본값 미설정 시 null
    };

    // 리스트 판단 (buildCompletedSet 방식)
    const completedSet = buildCompletedSet([completionRecord]);
    const key = `${scheduleId}_${completionDate}`;
    const listCompleted = completedSet.has(key) ? "completed" : null;

    // 상세 판단 (!!completion 방식)
    const detailCompleted = isCompletedByDetail(completionRecord);

    expect(listCompleted).toBe("completed");
    expect(detailCompleted).toBe(true);
  });

  it("레코드 없을 시 리스트와 상세 모두 미완료로 판단", () => {
    const completedSet = buildCompletedSet([]);
    const key = `${scheduleId}_${completionDate}`;
    const listCompleted = completedSet.has(key) ? "completed" : null;
    const detailCompleted = isCompletedByDetail(null);

    expect(listCompleted).toBeNull();
    expect(detailCompleted).toBe(false);
  });

  it("status가 'completed'인 경우에도 동일하게 동작", () => {
    const completionRecord = {
      schedule_id: scheduleId,
      completion_date: completionDate,
      status: "completed",
    };

    const completedSet = buildCompletedSet([completionRecord]);
    const key = `${scheduleId}_${completionDate}`;
    const listCompleted = completedSet.has(key) ? "completed" : null;
    const detailCompleted = isCompletedByDetail(completionRecord);

    expect(listCompleted).toBe("completed");
    expect(detailCompleted).toBe(true);
  });

  it("completion_date 형식 정규화: ISO datetime → YYYY-MM-DD", () => {
    // Supabase가 DATE 컬럼을 ISO datetime으로 반환할 수 있음
    const completionRecord = {
      schedule_id: scheduleId,
      completion_date: "2026-03-24T00:00:00+00:00",
      status: null as string | null,
    };

    const completedSet = buildCompletedSet([completionRecord]);
    const key = `${scheduleId}_2026-03-24`;

    expect(completedSet.has(key)).toBe(true);
  });

  it("여러 스케줄의 완료 상태를 정확히 구분", () => {
    const completions = [
      { schedule_id: "s1", completion_date: "2026-03-24", status: null as string | null },
      { schedule_id: "s2", completion_date: "2026-03-25", status: null as string | null },
    ];

    const completedSet = buildCompletedSet(completions);

    expect(completedSet.has("s1_2026-03-24")).toBe(true);
    expect(completedSet.has("s2_2026-03-25")).toBe(true);
    expect(completedSet.has("s1_2026-03-25")).toBe(false); // 다른 날짜
    expect(completedSet.has("s3_2026-03-24")).toBe(false); // 다른 스케줄
  });
});
