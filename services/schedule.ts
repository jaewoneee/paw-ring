import dayjs, { formatISODate } from "@/utils/dayjs";
import { supabase } from "@/lib/supabase";
import type {
  CreateScheduleInput,
  Schedule,
  ScheduleCompletion,
  ScheduleException,
  UpdateScheduleInput,
} from "@/types/schedule";
import { expandRRule } from "@/utils/rrule";

/** 스케줄 생성 */
export async function createSchedule(
  data: CreateScheduleInput
): Promise<Schedule> {
  const row: Record<string, unknown> = {
    pet_id: data.pet_id,
    owner_id: data.owner_id,
    title: data.title,
    category: data.category,
    memo: data.memo ?? null,
    start_date: data.start_date,
    is_all_day: data.is_all_day ?? false,
    reminder: data.reminder ?? "none",
    is_completable: data.is_completable ?? false,
  };
  if (data.end_date) row.end_date = data.end_date;
  if (data.is_recurring) {
    row.is_recurring = true;
    if (data.rrule) row.rrule = data.rrule;
    if (data.recurrence_end_date) row.recurrence_end_date = data.recurrence_end_date;
  }

  const { data: schedule, error } = await supabase
    .from("schedules")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return schedule as Schedule;
}

/** 날짜 범위 내 스케줄 조회 (월간 뷰용) — 반복 스케줄 포함 */
export async function getSchedulesByRange(
  petId: string,
  startDate: string,
  endDate: string
): Promise<Schedule[]> {
  const [inRangeRes, recurringBeforeRes, multiDayBeforeRes] = await Promise.all([
    // 1) 범위 내 start_date를 가진 스케줄
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .gte("start_date", `${startDate}T00:00:00`)
      .lte("start_date", `${endDate}T23:59:59`)
      .order("start_date", { ascending: true }),
    // 2) 범위 이전에 시작된 반복 스케줄 (아직 종료되지 않은 것)
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .eq("is_recurring", true)
      .lt("start_date", `${startDate}T00:00:00`)
      .or(`recurrence_end_date.gte.${startDate}T00:00:00,recurrence_end_date.is.null`),
    // 3) 범위 이전에 시작되어 범위까지 이어지는 다일(multi-day) 스케줄
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .eq("is_recurring", false)
      .lt("start_date", `${startDate}T00:00:00`)
      .gte("end_date", `${startDate}T00:00:00`),
  ]);

  if (inRangeRes.error) throw inRangeRes.error;
  if (recurringBeforeRes.error) throw recurringBeforeRes.error;
  if (multiDayBeforeRes.error) throw multiDayBeforeRes.error;

  // id 기준 중복 제거 후 병합
  const map = new Map<string, Schedule>();
  for (const s of [...(inRangeRes.data ?? []), ...(recurringBeforeRes.data ?? []), ...(multiDayBeforeRes.data ?? [])]) {
    map.set(s.id, s as Schedule);
  }
  return Array.from(map.values());
}

/** 다가오는 스케줄 조회 (홈 화면용, 일주일 이내, 완료된 것 제외) */
export async function getUpcomingSchedules(
  petId: string
): Promise<Schedule[]> {
  // dayjs로 로컬 타임존 기준 날짜 계산 (UTC 오프셋 문제 방지)
  const todayDateStr = formatISODate(dayjs());
  const oneWeekLater = dayjs().add(7, "day");
  const oneWeekLaterDateStr = formatISODate(oneWeekLater);
  const startOfToday = `${todayDateStr}T00:00:00`;
  const endOfWeek = `${oneWeekLaterDateStr}T23:59:59`;

  const [schedulesRes, recurringRes, completionsRes] = await Promise.all([
    // 1) 범위 내 start_date를 가진 일반 스케줄
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .gte("start_date", startOfToday)
      .lte("start_date", endOfWeek)
      .order("start_date", { ascending: true }),
    // 2) 오늘 이전에 시작된 반복 스케줄 (아직 종료되지 않은 것)
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .eq("is_recurring", true)
      .lt("start_date", startOfToday)
      .or(`recurrence_end_date.gte.${todayDateStr},recurrence_end_date.is.null`),
    supabase
      .from("schedule_completions")
      .select("schedule_id, completion_date")
      .gte("completion_date", todayDateStr)
      .lte("completion_date", oneWeekLaterDateStr),
  ]);

  if (schedulesRes.error) throw schedulesRes.error;
  if (recurringRes.error) throw recurringRes.error;
  if (completionsRes.error) throw completionsRes.error;

  // schedule_id + completion_date 조합으로 완료 여부 판별
  const completedSet = new Set(
    (completionsRes.data ?? []).map((c) => `${c.schedule_id}_${c.completion_date}`)
  );

  // 반복 스케줄을 occurrence 단위로 확장하여 각 날짜별 완료 여부 체크
  const recurringSchedules = (recurringRes.data ?? []) as Schedule[];
  const result: Schedule[] = [];

  // 일반 스케줄: 각 날짜별 완료 여부 체크
  for (const s of (schedulesRes.data ?? []) as Schedule[]) {
    if (!s.is_completable) {
      result.push(s);
      continue;
    }
    const scheduleDate = s.start_date.split("T")[0];
    if (!completedSet.has(`${s.id}_${scheduleDate}`)) {
      result.push(s);
    }
  }

  // 반복 스케줄: 범위 내 occurrence 중 하나라도 미완료면 포함
  for (const s of recurringSchedules) {
    if (!s.rrule) continue;
    const occurrences = expandRRule(
      s.start_date,
      s.rrule,
      todayDateStr,
      oneWeekLaterDateStr,
      s.recurrence_end_date,
    );
    if (occurrences.length === 0) continue;

    if (!s.is_completable) {
      result.push(s);
      continue;
    }
    // 하나라도 미완료 occurrence가 있으면 표시
    const hasIncomplete = occurrences.some(
      (date) => !completedSet.has(`${s.id}_${date}`)
    );
    if (hasIncomplete) {
      result.push(s);
    }
  }

  // id 기준 중복 제거
  const map = new Map<string, Schedule>();
  for (const s of result) map.set(s.id, s);
  return Array.from(map.values());
}

/** 특정 스케줄의 특정 날짜 완료 여부 조회 */
export async function getScheduleCompletion(
  scheduleId: string,
  completionDate: string
): Promise<ScheduleCompletion | null> {
  const { data, error } = await supabase
    .from("schedule_completions")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("completion_date", completionDate)
    .maybeSingle();

  if (error) throw error;
  return data as ScheduleCompletion | null;
}

/** 스케줄 완료 처리 */
export async function completeSchedule(
  scheduleId: string,
  completionDate: string,
  userId: string
): Promise<ScheduleCompletion> {
  const { data, error } = await supabase
    .from("schedule_completions")
    .upsert(
      {
        schedule_id: scheduleId,
        completion_date: completionDate,
        completed_by: userId,
      },
      { onConflict: "schedule_id,completion_date" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as ScheduleCompletion;
}

/** 스케줄 완료 취소 */
export async function uncompleteSchedule(
  scheduleId: string,
  completionDate: string
): Promise<void> {
  const { error } = await supabase
    .from("schedule_completions")
    .delete()
    .eq("schedule_id", scheduleId)
    .eq("completion_date", completionDate);

  if (error) throw error;
}

/** 단건 스케줄 조회 */
export async function getScheduleById(id: string): Promise<Schedule> {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Schedule;
}

/** 스케줄 수정 */
export async function updateSchedule(
  id: string,
  data: UpdateScheduleInput
): Promise<void> {
  const { error } = await supabase
    .from("schedules")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** 스케줄 삭제 (전체) */
export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from("schedules").delete().eq("id", id);

  if (error) throw error;
}

// ─── 반복 스케줄 예외 처리 ───

/** 특정 스케줄의 예외 목록 조회 */
export async function getScheduleExceptions(
  scheduleIds: string[]
): Promise<ScheduleException[]> {
  if (scheduleIds.length === 0) return [];
  const { data, error } = await supabase
    .from("schedule_exceptions")
    .select("*")
    .in("schedule_id", scheduleIds);

  if (error) throw error;
  return (data ?? []) as ScheduleException[];
}

/** 반복 스케줄 - 이 일정만 수정 (예외 생성) */
export async function updateScheduleThisOnly(
  scheduleId: string,
  exceptionDate: string,
  modifiedFields: ScheduleException["modified_fields"]
): Promise<void> {
  const { error } = await supabase.from("schedule_exceptions").upsert(
    {
      schedule_id: scheduleId,
      exception_date: exceptionDate,
      type: "modified",
      modified_fields: modifiedFields,
    },
    { onConflict: "schedule_id,exception_date" }
  );

  if (error) throw error;
}

/** 반복 스케줄 - 이후 모든 일정 수정 (원본 종료 + 새 스케줄 생성) */
export async function updateScheduleThisAndFollowing(
  originalScheduleId: string,
  fromDate: string,
  newData: CreateScheduleInput
): Promise<void> {
  // 1) 원본 스케줄의 반복 종료일을 fromDate 전날로 설정
  const dayBefore = new Date(fromDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const endDateStr = dayBefore.toISOString().split("T")[0] + "T23:59:59.000Z";

  await updateSchedule(originalScheduleId, {
    recurrence_end_date: endDateStr,
  });

  // 2) 새 스케줄 생성
  await createSchedule(newData);
}

/** 반복 스케줄 - 이 일정만 삭제 (예외 등록) */
export async function deleteScheduleThisOnly(
  scheduleId: string,
  exceptionDate: string
): Promise<void> {
  const { error } = await supabase.from("schedule_exceptions").upsert(
    {
      schedule_id: scheduleId,
      exception_date: exceptionDate,
      type: "deleted",
      modified_fields: null,
    },
    { onConflict: "schedule_id,exception_date" }
  );

  if (error) throw error;
}

/** 반복 스케줄 - 이후 모든 일정 삭제 (반복 종료일 변경) */
export async function deleteScheduleThisAndFollowing(
  scheduleId: string,
  fromDate: string
): Promise<void> {
  const schedule = await getScheduleById(scheduleId);
  const startDateStr = schedule.start_date.split("T")[0];

  // fromDate가 시작일과 같으면 스케줄 자체를 삭제
  if (fromDate <= startDateStr) {
    await deleteSchedule(scheduleId);
    return;
  }

  // 그렇지 않으면 전날까지로 반복 종료
  const dayBefore = new Date(fromDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const endDateStr = dayBefore.toISOString().split("T")[0] + "T23:59:59.000Z";

  await updateSchedule(scheduleId, {
    recurrence_end_date: endDateStr,
  });
}
