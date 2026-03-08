import dayjs, { formatISODate } from "@/utils/dayjs";
import { useCallback, useEffect, useState } from "react";

import { getCompletionsByRange, getScheduleExceptions, getSchedulesByRange } from "@/services/schedule";
import type { CompletionStatus, ScheduleException, ScheduleInstance } from "@/types/schedule";
import { getMonthRange } from "@/utils/date";
import { expandRRule } from "@/utils/rrule";

/** 월간 스케줄 데이터 fetch 훅 (반복 스케줄 인스턴스 확장 포함) */
export function useMonthSchedules(
  petId: string | undefined,
  year: number,
  month: number
) {
  const [schedules, setSchedules] = useState<ScheduleInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!petId) {
      setSchedules([]);
      return;
    }
    setIsLoading(true);
    try {
      const { start, end } = getMonthRange(year, month);
      const rawSchedules = await getSchedulesByRange(petId, start, end);

      // 반복 스케줄의 예외 목록 조회
      const recurringIds = rawSchedules
        .filter((s) => s.is_recurring)
        .map((s) => s.id);
      const exceptions = await getScheduleExceptions(recurringIds);

      // 예외를 schedule_id + exception_date 기준 Map으로 변환
      const exceptionMap = new Map<string, ScheduleException>();
      for (const ex of exceptions) {
        exceptionMap.set(`${ex.schedule_id}_${ex.exception_date}`, ex);
      }

      const instances: ScheduleInstance[] = [];

      for (const schedule of rawSchedules) {
        if (schedule.is_recurring && schedule.rrule) {
          const occurrences = expandRRule(
            schedule.start_date,
            schedule.rrule,
            start,
            end,
            schedule.recurrence_end_date,
          );
          for (const occurrenceDate of occurrences) {
            const exKey = `${schedule.id}_${occurrenceDate}`;
            const exception = exceptionMap.get(exKey);

            // 삭제된 예외는 건너뛰기
            if (exception?.type === "deleted") continue;

            // 수정된 예외는 modified_fields 반영
            const effectiveSchedule =
              exception?.type === "modified" && exception.modified_fields
                ? { ...schedule, ...exception.modified_fields }
                : schedule;

            instances.push({
              schedule: effectiveSchedule,
              occurrenceDate,
              isRecurringInstance: true,
            });
          }
        } else {
          const sDate = formatISODate(schedule.start_date);
          const eDate = schedule.end_date
            ? formatISODate(schedule.end_date)
            : null;

          if (eDate && eDate !== sDate) {
            // Multi-day: create instances for each day in range
            let d = dayjs(sDate);
            const last = dayjs(eDate);
            while (!d.isAfter(last, "day")) {
              const occDate = formatISODate(d);
              if (occDate >= start && occDate <= end) {
                instances.push({
                  schedule,
                  occurrenceDate: occDate,
                  isRecurringInstance: false,
                });
              }
              d = d.add(1, "day");
            }
          } else {
            instances.push({
              schedule,
              occurrenceDate: sDate,
              isRecurringInstance: false,
            });
          }
        }
      }

      // completion 상태 일괄 조회 (completable 스케줄만)
      const allScheduleIds = [...new Set(
        instances.filter(i => i.schedule.is_completable).map(i => i.schedule.id)
      )];
      const completions = await getCompletionsByRange(allScheduleIds, start, end);
      const completionMap = new Map<string, CompletionStatus>();
      for (const c of completions) {
        // DB DATE 컬럼 반환 포맷이 다를 수 있으므로 YYYY-MM-DD로 정규화
        const normalizedDate = formatISODate(c.completion_date);
        completionMap.set(`${c.schedule_id}_${normalizedDate}`, c.status);
      }

      // completion 상태를 인스턴스에 매핑
      for (const instance of instances) {
        const key = `${instance.schedule.id}_${instance.occurrenceDate}`;
        instance.completionStatus = completionMap.get(key) ?? null;
      }

      // occurrenceDate → 시간순 정렬
      instances.sort((a, b) => {
        if (a.occurrenceDate !== b.occurrenceDate) {
          return a.occurrenceDate.localeCompare(b.occurrenceDate);
        }
        return a.schedule.start_date.localeCompare(b.schedule.start_date);
      });

      setSchedules(instances);
    } catch (err) {
      console.error("[useMonthSchedules] fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [petId, year, month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** 낙관적 업데이트: 특정 인스턴스의 completionStatus를 로컬에서 즉시 변경 */
  const updateCompletionStatus = useCallback(
    (scheduleId: string, occurrenceDate: string, status: CompletionStatus | null) => {
      setSchedules(prev =>
        prev.map(inst =>
          inst.schedule.id === scheduleId && inst.occurrenceDate === occurrenceDate
            ? { ...inst, completionStatus: status }
            : inst
        )
      );
    },
    []
  );

  return { schedules, isLoading, refresh, updateCompletionStatus };
}
