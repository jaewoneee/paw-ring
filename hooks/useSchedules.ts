import { useCallback, useEffect, useState } from "react";

import { getSchedulesByRange } from "@/services/schedule";
import type { Schedule } from "@/types/schedule";
import { getMonthRange } from "@/utils/date";

/** 월간 스케줄 데이터 fetch 훅 */
export function useMonthSchedules(
  petId: string | undefined,
  year: number,
  month: number
) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!petId) {
      setSchedules([]);
      return;
    }
    setIsLoading(true);
    try {
      const { start, end } = getMonthRange(year, month);
      const data = await getSchedulesByRange(petId, start, end);
      setSchedules(data);
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
