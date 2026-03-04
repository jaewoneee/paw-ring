import { supabase } from "@/lib/supabase";
import type {
  CreateScheduleInput,
  Schedule,
  ScheduleCompletion,
  UpdateScheduleInput,
} from "@/types/schedule";

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
  // 1) 범위 내 start_date를 가진 스케줄
  const { data: inRange, error: err1 } = await supabase
    .from("schedules")
    .select("*")
    .eq("pet_id", petId)
    .gte("start_date", `${startDate}T00:00:00`)
    .lte("start_date", `${endDate}T23:59:59`)
    .order("start_date", { ascending: true });

  // 2) 범위 이전에 시작된 반복 스케줄 (아직 종료되지 않은 것)
  const { data: recurringBefore, error: err2 } = await supabase
    .from("schedules")
    .select("*")
    .eq("pet_id", petId)
    .eq("is_recurring", true)
    .lt("start_date", `${startDate}T00:00:00`)
    .or(`recurrence_end_date.gte.${startDate}T00:00:00,recurrence_end_date.is.null`);

  // 3) 범위 이전에 시작되어 범위까지 이어지는 다일(multi-day) 스케줄
  const { data: multiDayBefore, error: err3 } = await supabase
    .from("schedules")
    .select("*")
    .eq("pet_id", petId)
    .eq("is_recurring", false)
    .lt("start_date", `${startDate}T00:00:00`)
    .gte("end_date", `${startDate}T00:00:00`);

  if (err1) throw err1;
  if (err2) throw err2;
  if (err3) throw err3;

  // id 기준 중복 제거 후 병합
  const map = new Map<string, Schedule>();
  for (const s of [...(inRange ?? []), ...(recurringBefore ?? []), ...(multiDayBefore ?? [])]) {
    map.set(s.id, s as Schedule);
  }
  return Array.from(map.values());
}

/** 다가오는 스케줄 조회 (홈 화면용, 일주일 이내, 완료된 것 제외) */
export async function getUpcomingSchedules(
  petId: string
): Promise<Schedule[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();
  const todayDateStr = today.toISOString().split("T")[0];
  const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneWeekLaterStr = oneWeekLater.toISOString();
  const oneWeekLaterDateStr = oneWeekLaterStr.split("T")[0];

  const [schedulesRes, completionsRes] = await Promise.all([
    supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", petId)
      .gte("start_date", startOfToday)
      .lte("start_date", oneWeekLaterStr)
      .order("start_date", { ascending: true }),
    supabase
      .from("schedule_completions")
      .select("schedule_id, completion_date")
      .gte("completion_date", todayDateStr)
      .lte("completion_date", oneWeekLaterDateStr),
  ]);

  if (schedulesRes.error) throw schedulesRes.error;
  if (completionsRes.error) throw completionsRes.error;

  // schedule_id + completion_date 조합으로 완료 여부 판별
  const completedSet = new Set(
    (completionsRes.data ?? []).map((c) => `${c.schedule_id}_${c.completion_date}`)
  );

  return ((schedulesRes.data ?? []) as Schedule[]).filter((s) => {
    if (!s.is_completable) return true;
    const scheduleDate = s.start_date.split("T")[0];
    return !completedSet.has(`${s.id}_${scheduleDate}`);
  });
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

/** 스케줄 삭제 */
export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from("schedules").delete().eq("id", id);

  if (error) throw error;
}
