import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

/** 포그라운드에서도 알림을 표시하도록 핸들러 설정 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** 알림 권한 요청 — 권한 상태를 반환 */
export async function requestNotificationPermission(): Promise<boolean> {
  // 실제 디바이스가 아닌 경우 (시뮬레이터 등) 푸시 토큰 발급 불가
  if (!Device.isDevice) {
    console.warn("[Notification] 실제 디바이스가 아닙니다.");
    return false;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Notification] 알림 권한이 거부되었습니다.");
    return false;
  }

  // Android: 알림 채널 설정
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF8C6B",
    });
  }

  return true;
}

/** 현재 알림 권한 상태 조회 */
export async function getNotificationPermissionStatus(): Promise<
  Notifications.PermissionStatus
> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/** Expo 푸시 토큰 발급 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (error) {
    console.error("[Notification] 푸시 토큰 발급 실패:", error);
    return null;
  }
}

/** Supabase에 FCM 토큰 저장 (upsert) */
export async function savePushToken(
  userId: string,
  token: string
): Promise<void> {
  const deviceInfo = {
    os: Platform.OS,
    osVersion: Platform.Version,
    brand: Device.brand,
    modelName: Device.modelName,
  };

  const { error } = await supabase.from("fcm_tokens").upsert(
    {
      user_id: userId,
      token,
      device_info: deviceInfo,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,token" }
  );

  if (error) {
    console.error("[Notification] 토큰 저장 실패:", error);
    throw error;
  }

  console.log("[Notification] 토큰 저장 완료");
}

/** Supabase에서 현재 디바이스의 토큰 삭제 (로그아웃 시) */
export async function removePushToken(
  userId: string,
  token: string
): Promise<void> {
  const { error } = await supabase
    .from("fcm_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("token", token);

  if (error) {
    console.error("[Notification] 토큰 삭제 실패:", error);
  }
}

/**
 * 알림 권한 요청 → 토큰 발급 → DB 저장까지 일괄 처리
 * 앱 초기화 시 호출
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const token = await getExpoPushToken();
  if (!token) return null;

  await savePushToken(userId, token);
  return token;
}
