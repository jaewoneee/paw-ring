import FontAwesome from "@expo/vector-icons/FontAwesome";
import { formatKoreanDate, formatKoreanDateNoDay } from "@/utils/dayjs";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { REMINDER_OPTIONS } from "@/constants/Schedule";
import { useCategoryContext } from "@/contexts/CategoryContext";
import { useAuth } from "@/hooks/useAuth";
import {
  completeSchedule,
  deleteSchedule,
  deleteScheduleThisAndFollowing,
  deleteScheduleThisOnly,
  getScheduleById,
  getScheduleCompletion,
  uncompleteSchedule,
} from "@/services/schedule";
import type { Schedule } from "@/types/schedule";
import { formatTime } from "@/utils/date";
import { formatRRuleLabel } from "@/utils/rrule";

export default function ScheduleDetailScreen() {
  const router = useRouter();
  const { id, occurrenceDate } = useLocalSearchParams<{ id: string; occurrenceDate?: string }>();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const { user } = useAuth();
  const { getCategoryMeta } = useCategoryContext();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [completionDate, setCompletionDate] = useState<string>('');

  const fetchSchedule = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getScheduleById(id);
      setSchedule(data);
      // 반복 스케줄은 occurrenceDate 기준, 단건은 start_date 기준
      const targetDate = occurrenceDate ?? data.start_date.split("T")[0];
      setCompletionDate(targetDate);
      if (data.is_completable) {
        const completion = await getScheduleCompletion(id, targetDate);
        setIsCompleted(!!completion);
      }
    } catch (err) {
      console.error("[ScheduleDetail] fetch failed:", err);
      Alert.alert("오류", "일정을 불러올 수 없습니다.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, occurrenceDate]);

  useFocusEffect(
    useCallback(() => {
      fetchSchedule();
    }, [fetchSchedule])
  );

  const handleToggleComplete = async () => {
    if (!schedule || !user || isToggling) return;
    setIsToggling(true);
    try {
      if (isCompleted) {
        await uncompleteSchedule(schedule.id, completionDate);
        setIsCompleted(false);
      } else {
        await completeSchedule(schedule.id, completionDate, user.uid);
        setIsCompleted(true);
      }
    } catch (err) {
      console.error("[ScheduleDetail] toggle complete failed:", err);
      Alert.alert("오류", "완료 상태 변경에 실패했습니다.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleEdit = () => {
    if (schedule?.is_recurring) {
      Alert.alert("반복 일정 수정", "어떻게 수정할까요?", [
        { text: "취소", style: "cancel" },
        {
          text: "이 일정만",
          onPress: () =>
            router.push({
              pathname: "/edit-schedule",
              params: { id: schedule.id, editMode: "single", occurrenceDate },
            }),
        },
        {
          text: "이후 모든 일정",
          onPress: () =>
            router.push({
              pathname: "/edit-schedule",
              params: { id: schedule.id, editMode: "following", occurrenceDate },
            }),
        },
      ]);
    } else {
      router.push({
        pathname: "/edit-schedule",
        params: { id: schedule!.id },
      });
    }
  };

  const handleDelete = () => {
    if (schedule?.is_recurring) {
      Alert.alert("반복 일정 삭제", "어떻게 삭제할까요?", [
        { text: "취소", style: "cancel" },
        {
          text: "이 일정만",
          onPress: async () => {
            try {
              await deleteScheduleThisOnly(id!, occurrenceDate ?? completionDate);
              router.back();
            } catch (err) {
              console.error("[ScheduleDetail] delete single failed:", err);
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        },
        {
          text: "이후 모든 일정",
          onPress: async () => {
            try {
              await deleteScheduleThisAndFollowing(id!, occurrenceDate ?? completionDate);
              router.back();
            } catch (err) {
              console.error("[ScheduleDetail] delete following failed:", err);
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        },
        {
          text: "모든 일정 삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSchedule(id!);
              router.back();
            } catch (err) {
              console.error("[ScheduleDetail] delete all failed:", err);
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        },
      ]);
    } else {
      Alert.alert("일정 삭제", "이 일정을 삭제할까요?", [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSchedule(id!);
              router.back();
            } catch (err) {
              console.error("[ScheduleDetail] delete failed:", err);
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        },
      ]);
    }
  };

  if (isLoading || !schedule) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Typography className="text-muted-foreground">로딩 중...</Typography>
        </View>
      </Screen>
    );
  }

  const meta = getCategoryMeta(schedule.category);
  const dateLabel = formatKoreanDate(schedule.start_date);
  const timeLabel = schedule.is_all_day
    ? "종일"
    : formatTime(schedule.start_date);
  const reminderLabel =
    REMINDER_OPTIONS.find((r) => r.value === schedule.reminder)?.label ?? "없음";

  const endDateLabel = schedule.end_date
    ? formatKoreanDate(schedule.end_date)
    : null;

  const recurrenceLabel =
    schedule.is_recurring && schedule.rrule
      ? formatRRuleLabel(schedule.rrule)
      : null;

  const recurrenceEndLabel =
    schedule.is_recurring && schedule.recurrence_end_date
      ? formatKoreanDateNoDay(schedule.recurrence_end_date)
      : null;

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        <Card>
          <CardContent>
            <View className="gap-4">
              {/* 카테고리 뱃지 + 제목 */}
              <View className="flex-row items-center gap-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: meta.color + "20" }}
                >
                  <FontAwesome
                    name={meta.icon as any}
                    size={18}
                    color={meta.color}
                  />
                </View>
                <View className="flex-1">
                  <Typography variant="body-xl" className="font-semibold">
                    {schedule.title}
                  </Typography>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: meta.color }}
                  >
                    {meta.name}
                  </Text>
                </View>
              </View>

              {/* 구분선 */}
              <View className="border-b border-border" />

              {/* 날짜/시간 */}
              <DetailRow
                icon="calendar"
                label="날짜"
                value={dateLabel}
                colors={colors}
              />
              <DetailRow
                icon="clock-o"
                label="시간"
                value={timeLabel}
                colors={colors}
              />
              <DetailRow
                icon="bell-o"
                label="알림"
                value={reminderLabel}
                colors={colors}
              />

              {endDateLabel && (
                <DetailRow
                  icon="calendar"
                  label="종료"
                  value={endDateLabel}
                  colors={colors}
                />
              )}

              {recurrenceLabel && (
                <DetailRow
                  icon="refresh"
                  label="반복"
                  value={
                    recurrenceEndLabel
                      ? `${recurrenceLabel} (${recurrenceEndLabel}까지)`
                      : recurrenceLabel
                  }
                  colors={colors}
                />
              )}

              {/* 메모 */}
              {schedule.memo && (
                <>
                  <View className="border-b border-border" />
                  <View className="gap-1">
                    <Typography
                      variant="small"
                      className="text-muted-foreground font-medium"
                    >
                      메모
                    </Typography>
                    <Typography variant="body-md">{schedule.memo}</Typography>
                  </View>
                </>
              )}
            </View>
          </CardContent>
        </Card>

        {/* 완료 처리 */}
        {schedule.is_completable && (
          <Button
            onPress={handleToggleComplete}
            variant={isCompleted ? "outline" : "default"}
            disabled={isToggling}
          >
            {isCompleted ? "완료 취소" : "오늘 일정 완료"}
          </Button>
        )}

        {/* 액션 버튼 */}
        <View className="gap-3">
          <Button variant="outline" onPress={handleEdit}>
            수정
          </Button>
          <Button variant="outline" onPress={handleDelete}>
            삭제
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}

function DetailRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: (typeof Colors)["light"] | (typeof Colors)["dark"];
}) {
  return (
    <View className="flex-row items-center gap-3">
      <FontAwesome
        name={icon as any}
        size={16}
        color={colors.mutedForeground}
        style={{ width: 20, textAlign: "center" }}
      />
      <Text
        className="text-sm"
        style={{ color: colors.mutedForeground, width: 40 }}
      >
        {label}
      </Text>
      <Typography variant="body-md" className="flex-1">
        {value}
      </Typography>
    </View>
  );
}
