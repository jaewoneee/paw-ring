import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSharedPets, getPendingInvitations } from "@/services/sharing";
import { queryKeys } from "@/hooks/queryKeys";
import type { CalendarShareWithDetails } from "@/types/sharing";

/** 공유받은 캘린더 목록 + 대기중 초대 훅 */
export function useSharedCalendars(userId: string | undefined) {
  const queryClient = useQueryClient();

  const sharedQueryKey = userId ? queryKeys.sharedCalendars.byUser(userId) : ['shared-calendars', 'disabled'];
  const pendingQueryKey = userId ? queryKeys.pendingInvites.byUser(userId) : ['pending-invites', 'disabled'];

  const { data: sharedPets = [], isPending: isSharedLoading } = useQuery({
    queryKey: sharedQueryKey,
    queryFn: () => getSharedPets(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const { data: pendingInvites = [], isPending: isPendingLoading } = useQuery({
    queryKey: pendingQueryKey,
    queryFn: () => getPendingInvitations(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const isLoading = (isSharedLoading || isPendingLoading) && !!userId;

  const refresh = useCallback(async () => {
    if (!userId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: sharedQueryKey }),
      queryClient.invalidateQueries({ queryKey: pendingQueryKey }),
    ]);
  }, [userId, queryClient, sharedQueryKey, pendingQueryKey]);

  return { sharedPets, pendingInvites, isLoading, refresh };
}
