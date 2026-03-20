import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/hooks/queryKeys";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/services/notificationHistory";

export function useNotificationHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.uid;

  const queryKey = userId
    ? queryKeys.notifications.all(userId)
    : (["notifications", "disabled"] as const);

  const {
    data: notifications = [],
    isPending,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getNotifications(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  const isLoading = isPending && !!userId;
  const error = queryError ? "알림을 불러오지 못했습니다" : null;

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsRead(notificationId);
        if (userId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(userId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
        }
      } catch (err) {
        console.warn("[notificationHistory] 읽음 처리 실패:", err);
      }
    },
    [userId, queryClient]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await markAllAsRead(userId);
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
    } catch (err) {
      console.warn("[notificationHistory] 전체 읽음 처리 실패:", err);
    }
  }, [userId, queryClient]);

  return {
    notifications,
    isLoading,
    error,
    refetch,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  };
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const userId = user?.uid;

  const { data: count = 0 } = useQuery({
    queryKey: userId
      ? queryKeys.notifications.unreadCount(userId)
      : (["notifications", "unread", "disabled"] as const),
    queryFn: () => getUnreadCount(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  return count;
}
