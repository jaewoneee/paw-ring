import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCalendarMembers } from "@/services/sharing";
import { queryKeys } from "@/hooks/queryKeys";
import type { CalendarShareWithDetails } from "@/types/sharing";

/** 캘린더(반려동물) 공유 멤버 목록 훅 */
export function useCalendarMembers(petId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = petId ? queryKeys.calendarMembers.byPet(petId) : ['calendar-members', 'disabled'];

  const { data: members = [], isPending } = useQuery({
    queryKey,
    queryFn: () => getCalendarMembers(petId!),
    enabled: !!petId,
    staleTime: 60 * 1000,
  });

  const isLoading = isPending && !!petId;

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { members, isLoading, refresh };
}
