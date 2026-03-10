import { useCallback, useEffect, useState } from "react";
import { getSharedPets, getPendingInvitations } from "@/services/sharing";
import type { CalendarShareWithDetails } from "@/types/sharing";

/** 공유받은 캘린더 목록 + 대기중 초대 훅 */
export function useSharedCalendars(userId: string | undefined) {
  const [sharedPets, setSharedPets] = useState<CalendarShareWithDetails[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CalendarShareWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSharedPets([]);
      setPendingInvites([]);
      return;
    }
    setIsLoading(true);
    try {
      const [shared, pending] = await Promise.all([
        getSharedPets(userId),
        getPendingInvitations(userId),
      ]);
      setSharedPets(shared);
      setPendingInvites(pending);
    } catch (err) {
      console.error("[useSharedCalendars] fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sharedPets, pendingInvites, isLoading, refresh };
}
