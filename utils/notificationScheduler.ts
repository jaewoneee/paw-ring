import * as Notifications from "expo-notifications";
import dayjs from "./dayjs";
import type { ReminderType, Schedule } from "@/types/schedule";
import { expandRRule } from "@/utils/rrule";

/** 알림 식별자 접두사 */
const NOTIFICATION_PREFIX = "schedule";

/** 반복 스케줄 알림 등록 범위 (일) */
const RECURRING_LOOKAHEAD_DAYS = 7;

/** 스케줄 + 날짜 조합으로 고유 알림 식별자 생성 */
function buildNotificationId(scheduleId: string, occurrenceDate: string): string {
  return `${NOTIFICATION_PREFIX}-${scheduleId}-${occurrenceDate}`;
}

/**
 * reminder 타입과 스케줄 시작 시간으로 알림 발송 시각을 계산한다.
 * 과거 시간이면 null을 반환한다.
 */
function calculateTriggerDate(
  startDate: string,
  reminder: ReminderType,
  isAllDay: boolean,
  occurrenceDate?: string,
): Date | null {
  // 반복 스케줄의 경우 occurrenceDate 기준으로 시간 부분만 startDate에서 가져옴
  let base: dayjs.Dayjs;
  if (occurrenceDate) {
    const timePart = dayjs(startDate);
    base = dayjs(occurrenceDate)
      .hour(timePart.hour())
      .minute(timePart.minute())
      .second(0);
  } else {
    base = dayjs(startDate);
  }

  let triggerDate: dayjs.Dayjs;

  switch (reminder) {
    case "on_time":
      triggerDate = base;
      break;
    case "5min":
      triggerDate = base.subtract(5, "minute");
      break;
    case "10min":
      triggerDate = base.subtract(10, "minute");
      break;
    case "15min":
      triggerDate = base.subtract(15, "minute");
      break;
    case "30min":
      triggerDate = base.subtract(30, "minute");
      break;
    case "1hour":
      triggerDate = base.subtract(1, "hour");
      break;
    case "1day":
      triggerDate = base.subtract(1, "day");
      break;
    case "same_day_9am":
      // 종일 스케줄: occurrenceDate 또는 startDate의 당일 오전 9시
      triggerDate = (occurrenceDate ? dayjs(occurrenceDate) : dayjs(startDate))
        .hour(9)
        .minute(0)
        .second(0);
      break;
    case "1day_before_9am":
      triggerDate = (occurrenceDate ? dayjs(occurrenceDate) : dayjs(startDate))
        .subtract(1, "day")
        .hour(9)
        .minute(0)
        .second(0);
      break;
    default:
      return null;
  }

  // 과거 시간이면 알림 등록하지 않음
  if (triggerDate.isBefore(dayjs())) {
    return null;
  }

  return triggerDate.toDate();
}

/** 알림 본문 메시지 생성 */
function buildNotificationBody(
  title: string,
  reminder: ReminderType,
): string {
  switch (reminder) {
    case "on_time":
      return "지금 시작이에요!";
    case "5min":
      return "5분 후 시작이에요!";
    case "10min":
      return "10분 후 시작이에요!";
    case "15min":
      return "15분 후 시작이에요!";
    case "30min":
      return "30분 후 시작이에요!";
    case "1hour":
      return "1시간 후 시작이에요!";
    case "1day":
      return "내일 예정된 일정이에요!";
    case "same_day_9am":
      return "오늘 예정된 일정이에요!";
    case "1day_before_9am":
      return "내일 예정된 일정이에요!";
    default:
      return "";
  }
}

/**
 * 단건 스케줄의 로컬 알림을 등록한다.
 * 이미 등록된 알림이 있으면 취소 후 재등록한다.
 */
async function scheduleOneNotification(
  schedule: Schedule,
  occurrenceDate?: string,
): Promise<string | null> {
  if (schedule.reminder === "none") return null;

  const dateKey = occurrenceDate ?? schedule.start_date.split("T")[0];
  const notificationId = buildNotificationId(schedule.id, dateKey);

  const triggerDate = calculateTriggerDate(
    schedule.start_date,
    schedule.reminder,
    schedule.is_all_day,
    occurrenceDate,
  );

  if (!triggerDate) return null;

  // 기존 알림 취소 후 재등록
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch((err) => console.warn("[notification] 기존 알림 취소 실패:", err));

  await Notifications.scheduleNotificationAsync({
    identifier: notificationId,
    content: {
      title: `🐾 ${schedule.title}`,
      body: buildNotificationBody(schedule.title, schedule.reminder),
      data: {
        scheduleId: schedule.id,
        occurrenceDate: dateKey,
      },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return notificationId;
}

/**
 * 특정 날짜의 알림 하나만 등록한다 (반복 스케줄의 예외 수정 시 사용).
 */
export async function scheduleNotificationForOccurrence(
  schedule: Schedule,
  occurrenceDate: string,
): Promise<void> {
  if (schedule.reminder === "none") return;

  try {
    await scheduleOneNotification(schedule, occurrenceDate);
  } catch (error) {
    console.error("[NotificationScheduler] 단건 알림 등록 실패:", error);
  }
}

/**
 * 스케줄에 대한 알림을 등록한다.
 * - 단건 스케줄: 1개 알림
 * - 반복 스케줄: 향후 7일치 알림 일괄 등록
 */
export async function scheduleNotifications(
  schedule: Schedule,
): Promise<void> {
  if (schedule.reminder === "none") return;

  try {
    if (schedule.is_recurring && schedule.rrule) {
      const today = dayjs().format("YYYY-MM-DD");
      const rangeEnd = dayjs().add(RECURRING_LOOKAHEAD_DAYS, "day").format("YYYY-MM-DD");
      const occurrences = expandRRule(
        schedule.start_date,
        schedule.rrule,
        today,
        rangeEnd,
        schedule.recurrence_end_date,
      );

      await Promise.all(
        occurrences.map((date) => scheduleOneNotification(schedule, date)),
      );
    } else {
      await scheduleOneNotification(schedule);
    }
  } catch (error) {
    console.error("[NotificationScheduler] 알림 등록 실패:", error);
  }
}

/**
 * 특정 스케줄의 모든 예약된 알림을 취소한다.
 */
export async function cancelScheduleNotifications(
  scheduleId: string,
): Promise<void> {
  try {
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    const prefix = `${NOTIFICATION_PREFIX}-${scheduleId}-`;

    const cancellations = allScheduled
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier));

    await Promise.all(cancellations);
  } catch (error) {
    console.error("[NotificationScheduler] 알림 취소 실패:", error);
  }
}

/**
 * 특정 스케줄의 특정 날짜 알림만 취소한다 (반복 스케줄의 단건 삭제/완료 시).
 */
export async function cancelNotificationForDate(
  scheduleId: string,
  occurrenceDate: string,
): Promise<void> {
  try {
    const notificationId = buildNotificationId(scheduleId, occurrenceDate);
    await Notifications.cancelScheduledNotificationAsync(notificationId).catch((err) => console.warn("[notification] 알림 취소 실패:", err));
  } catch (error) {
    console.error("[NotificationScheduler] 알림 취소 실패:", error);
  }
}

/**
 * 여러 스케줄의 향후 알림을 일괄 등록한다.
 * 앱 실행 시 호출하여 반복 스케줄의 알림을 보충한다.
 */
export async function refreshAllNotifications(
  schedules: Schedule[],
): Promise<void> {
  try {
    // 기존 schedule 관련 알림 모두 취소
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    const schedulePrefixed = allScheduled.filter((n) =>
      n.identifier.startsWith(`${NOTIFICATION_PREFIX}-`),
    );

    await Promise.all(
      schedulePrefixed.map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier),
      ),
    );

    // 알림이 설정된 스케줄만 재등록
    const withReminder = schedules.filter((s) => s.reminder !== "none");
    await Promise.all(withReminder.map((s) => scheduleNotifications(s)));
  } catch (error) {
    console.error("[NotificationScheduler] 알림 일괄 갱신 실패:", error);
  }
}
