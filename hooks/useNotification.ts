import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import type { EventSubscription } from "expo-modules-core";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { usePets } from "@/contexts/PetContext";
import {
  registerForPushNotifications,
  getNotificationPermissionStatus,
  removePushToken,
} from "@/services/notification";
import { getSchedulesByRange } from "@/services/schedule";
import { refreshAllNotifications } from "@/utils/notificationScheduler";
import { isPetNotificationEnabled } from "@/services/petNotification";
import dayjs, { formatISODate } from "@/utils/dayjs";
import { createNotification, cleanOldNotifications } from "@/services/notificationHistory";
import { queryKeys } from "@/hooks/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

/**
 * 알림 초기화 및 권한 상태 관리 훅
 * - 로그인된 사용자에 대해 자동으로 권한 요청 + 토큰 등록
 * - 알림 수신 리스너 등록
 * - 알림 탭 시 딥링크 처리
 * - 앱 실행 시 향후 알림 보충 등록
 */
export function useNotification() {
  const { user, userProfile } = useAuth();
  const { selectedPet } = usePets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  // 알림 권한 요청 + 토큰 등록
  useEffect(() => {
    if (!user || !userProfile) return;

    // 전체 알림이 꺼져 있으면 등록하지 않음
    if (!userProfile.notification_enabled) return;

    (async () => {
      const token = await registerForPushNotifications(user.uid);
      if (token) {
        setPushToken(token);
      }

      const status = await getNotificationPermissionStatus();
      setPermissionStatus(status);

      // 30일 이상 오래된 알림 정리
      cleanOldNotifications(user.uid).catch(() => {});
    })();
  }, [user, userProfile?.notification_enabled]);

  // 앱 실행 시 향후 알림 보충 등록 (반복 스케줄의 7일치 알림 갱신)
  useEffect(() => {
    if (!user || !selectedPet || !userProfile?.notification_enabled) return;

    (async () => {
      try {
        // 반려동물 단위 알림이 꺼져 있으면 해당 펫의 알림 등록하지 않음
        const petEnabled = await isPetNotificationEnabled(selectedPet.id, user.uid);
        if (!petEnabled) return;

        const today = formatISODate(dayjs());
        const rangeEnd = formatISODate(dayjs().add(7, "day"));
        const schedules = await getSchedulesByRange(
          selectedPet.id,
          today,
          rangeEnd,
        );
        await refreshAllNotifications(schedules);
      } catch (error) {
        console.error("[Notification] 알림 보충 등록 실패:", error);
      }
    })();
  }, [user, selectedPet?.id, userProfile?.notification_enabled]);

  // 알림 수신 리스너 (포그라운드) + 딥링크 처리
  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("[Notification] 알림 수신:", notification);

        // 알림 내역 DB에 저장
        if (user) {
          const { title, body, data } = notification.request.content;
          createNotification({
            userId: user.uid,
            type: "schedule_reminder",
            title: title ?? "",
            body: body ?? undefined,
            data: (data as Record<string, unknown>) ?? {},
          })
            .then(() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(user.uid) });
              queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(user.uid) });
            })
            .catch((err) => console.warn("[Notification] 알림 내역 저장 실패:", err));
        }
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("[Notification] 알림 탭:", response);

        const data = response.notification.request.content.data as
          | { scheduleId?: string; occurrenceDate?: string }
          | undefined;
        if (data?.scheduleId) {
          const params: Record<string, string> = { id: data.scheduleId };
          if (data.occurrenceDate) {
            params.occurrenceDate = data.occurrenceDate;
          }
          router.push({ pathname: "/schedule-detail", params });
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  // 로그아웃 시 토큰 제거
  useEffect(() => {
    if (!user && pushToken) {
      // user가 null이 되면 이전 토큰 정보를 정리
      setPushToken(null);
    }
  }, [user]);

  /** 수동으로 알림 권한 재요청 (설정에서 거부 후 다시 시도할 때) */
  const refreshPermission = async () => {
    const status = await getNotificationPermissionStatus();
    setPermissionStatus(status);
    return status;
  };

  /** 토큰 제거 (로그아웃 시 호출) */
  const unregisterToken = async () => {
    if (!user || !pushToken) return;
    await removePushToken(user.uid, pushToken);
    setPushToken(null);
  };

  return {
    permissionStatus,
    pushToken,
    refreshPermission,
    unregisterToken,
  };
}
