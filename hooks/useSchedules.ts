import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";

import { getSchedulesByRange } from "@/services/schedule";
import type { ScheduleInstance } from "@/types/schedule";
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
            instances.push({ schedule, occurrenceDate, isRecurringInstance: true });
          }
        } else {
          instances.push({
            schedule,
            occurrenceDate: dayjs(schedule.start_date).format("YYYY-MM-DD"),
            isRecurringInstance: false,
          });
        }
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

  return { schedules, isLoading, refresh };
}
