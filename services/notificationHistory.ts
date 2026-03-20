import { supabase } from "@/lib/supabase";
import type { AppNotification, NotificationType } from "@/types/notification";

/** 알림 내역 조회 (최신순, 최대 50개) */
export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as AppNotification[];
}

/** 안 읽은 알림 수 조회 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

/** 단건 읽음 처리 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

/** 전체 읽음 처리 */
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

/** 알림 생성 */
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    data: params.data ?? {},
  });

  if (error) throw error;
}

/** 30일 이상 된 알림 삭제 */
export async function cleanOldNotifications(userId: string): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .lt("created_at", thirtyDaysAgo.toISOString());

  if (error) {
    console.warn("[notificationHistory] 오래된 알림 삭제 실패:", error);
  }
}
