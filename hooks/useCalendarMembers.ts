import { useCallback, useEffect, useState } from "react";
import { getCalendarMembers } from "@/services/sharing";
import type { CalendarShareWithDetails } from "@/types/sharing";

/** 캘린더(반려동물) 공유 멤버 목록 훅 */
export function useCalendarMembers(petId: string | undefined) {
  const [members, setMembers] = useState<CalendarShareWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!petId) {
      setMembers([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getCalendarMembers(petId);
      setMembers(data);
    } catch (err) {
      console.error("[useCalendarMembers] fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { members, isLoading, refresh };
}
