/**
 * 알림 더미 데이터 시드 스크립트
 *
 * 사용법: 앱 내 아무 화면에서 import 후 호출
 *   import { seedNotifications } from '@/scripts/seedNotifications';
 *   seedNotifications('YOUR_USER_ID');
 *
 * 또는 React Query devtools나 콘솔에서 실행
 */
import { supabase } from "@/lib/supabase";

export async function seedNotifications(userId: string) {
  const now = new Date();

  const dummies = [
    // 오늘 - 스케줄 알림 (안 읽음)
    {
      user_id: userId,
      type: "schedule_reminder",
      title: "코코 산책 시간!",
      body: "오후 3:00 산책 일정이 있어요",
      is_read: false,
      data: { scheduleId: "dummy-1", occurrenceDate: iso(now) },
      created_at: hoursAgo(now, 0.5),
    },
    {
      user_id: userId,
      type: "schedule_reminder",
      title: "코코 저녁 식사",
      body: "오후 6:00 식사 시간이에요",
      is_read: false,
      data: { scheduleId: "dummy-2", occurrenceDate: iso(now) },
      created_at: hoursAgo(now, 2),
    },
    {
      user_id: userId,
      type: "schedule_reminder",
      title: "코코 약 투여",
      body: "오전 9:00 심장사상충 예방약",
      is_read: true,
      data: { scheduleId: "dummy-3", occurrenceDate: iso(now) },
      created_at: hoursAgo(now, 8),
    },
    // 오늘 - 공유 초대 (안 읽음)
    {
      user_id: userId,
      type: "share_invite",
      title: "김민수님이 캘린더 공유를 요청했어요",
      body: "뽀삐 캘린더에 초대되었습니다",
      is_read: false,
      data: { inviteId: "dummy-invite-1", petId: "dummy-pet-1", inviterName: "김민수" },
      created_at: hoursAgo(now, 3),
    },
    // 어제
    {
      user_id: userId,
      type: "share_accepted",
      title: "이영희님이 공유를 수락했어요",
      body: "코코 캘린더를 함께 관리합니다",
      is_read: true,
      data: { petId: "dummy-pet-2", accepterName: "이영희" },
      created_at: hoursAgo(now, 28),
    },
    {
      user_id: userId,
      type: "schedule_reminder",
      title: "코코 병원 방문",
      body: "오후 2:00 정기 검진",
      is_read: true,
      data: { scheduleId: "dummy-4", occurrenceDate: daysAgoDate(now, 1) },
      created_at: hoursAgo(now, 30),
    },
    // 2일 전
    {
      user_id: userId,
      type: "schedule_reminder",
      title: "코코 목욕",
      body: "오전 11:00 목욕 일정",
      is_read: true,
      data: { scheduleId: "dummy-5", occurrenceDate: daysAgoDate(now, 2) },
      created_at: hoursAgo(now, 52),
    },
    {
      user_id: userId,
      type: "share_invite",
      title: "박지훈님이 캘린더 공유를 요청했어요",
      body: "초코 캘린더에 초대되었습니다",
      is_read: true,
      data: { inviteId: "dummy-invite-2", petId: "dummy-pet-3", inviterName: "박지훈" },
      created_at: hoursAgo(now, 55),
    },
    // 5일 전
    {
      user_id: userId,
      type: "schedule_reminder",
      title: "코코 미용",
      body: "오후 1:00 미용실 예약",
      is_read: true,
      data: { scheduleId: "dummy-6", occurrenceDate: daysAgoDate(now, 5) },
      created_at: hoursAgo(now, 120),
    },
    {
      user_id: userId,
      type: "share_accepted",
      title: "최수진님이 공유를 수락했어요",
      body: "코코 캘린더를 함께 관리합니다",
      is_read: true,
      data: { petId: "dummy-pet-2", accepterName: "최수진" },
      created_at: hoursAgo(now, 125),
    },
  ];

  const { error } = await supabase.from("notifications").insert(dummies);

  if (error) {
    console.error("[seedNotifications] 실패:", error);
    return false;
  }

  console.log(`[seedNotifications] ${dummies.length}개 더미 알림 생성 완료`);
  return true;
}

function hoursAgo(base: Date, hours: number): string {
  return new Date(base.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgoDate(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function iso(date: Date): string {
  return date.toISOString().split("T")[0];
}
