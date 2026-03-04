import FontAwesome from "@expo/vector-icons/FontAwesome";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { CATEGORY_META, REMINDER_OPTIONS } from "@/constants/Schedule";
import { deleteSchedule, getScheduleById } from "@/services/schedule";
import type { Schedule } from "@/types/schedule";
import { formatTime } from "@/utils/date";

export default function ScheduleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getScheduleById(id);
      setSchedule(data);
    } catch (err) {
      console.error("[ScheduleDetail] fetch failed:", err);
      Alert.alert("오류", "일정을 불러올 수 없습니다.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleDelete = () => {
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

  const meta = CATEGORY_META[schedule.category];
  const dateLabel = dayjs(schedule.start_date)
    .locale("ko")
    .format("YYYY년 M월 D일 (dd)");
  const timeLabel = schedule.is_all_day
    ? "종일"
    : formatTime(schedule.start_date);
  const reminderLabel =
    REMINDER_OPTIONS.find((r) => r.value === schedule.reminder)?.label ?? "없음";

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
                    {meta.label}
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

        {/* 액션 버튼 */}
        <View className="gap-3">
          <Button
            onPress={() =>
              router.push({
                pathname: "/edit-schedule",
                params: { id: schedule.id },
              })
            }
          >
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
