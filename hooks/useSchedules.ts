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
          const sDate = dayjs(schedule.start_date).format("YYYY-MM-DD");
          const eDate = schedule.end_date
            ? dayjs(schedule.end_date).format("YYYY-MM-DD")
            : null;

          if (eDate && eDate !== sDate) {
            // Multi-day: create instances for each day in range
            let d = dayjs(sDate);
            const last = dayjs(eDate);
            while (!d.isAfter(last, "day")) {
              const occDate = d.format("YYYY-MM-DD");
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
