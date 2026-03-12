import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys";
import { getActivityFeed } from "@/services/schedule";

/** 돌봄 활동 피드 훅 */
export function useActivityFeed(petId: string | undefined, limit: number = 20) {
  const queryClient = useQueryClient();
  const queryKey = petId
    ? queryKeys.activityFeed.byPet(petId)
    : ['activity-feed', 'disabled'];

  const { data: activities = [], isPending, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: () => getActivityFeed(petId!, limit),
    enabled: !!petId,
    staleTime: 30 * 1000,
  });

  const isLoading = isPending && !!petId;
  const error = queryError ? "활동 기록을 불러오지 못했습니다" : null;

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { activities, isLoading, error, refresh, refetch };
}
