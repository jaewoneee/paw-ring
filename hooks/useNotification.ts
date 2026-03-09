import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import type { EventSubscription } from "expo-modules-core";
import { useAuth } from "@/hooks/useAuth";
import {
  registerForPushNotifications,
  getNotificationPermissionStatus,
  removePushToken,
} from "@/services/notification";

/**
 * 알림 초기화 및 권한 상태 관리 훅
 * - 로그인된 사용자에 대해 자동으로 권한 요청 + 토큰 등록
 * - 알림 수신 리스너 등록
 */
export function useNotification() {
  const { user, userProfile } = useAuth();
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
    })();
  }, [user, userProfile?.notification_enabled]);

  // 알림 수신 리스너 (포그라운드)
  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("[Notification] 알림 수신:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("[Notification] 알림 탭:", response);
        // TODO: 딥링크 처리 (스케줄 상세 화면으로 이동)
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

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
