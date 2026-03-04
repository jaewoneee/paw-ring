import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";

import { Typography } from "@/components/ui/Typography";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { CATEGORY_META } from "@/constants/Schedule";
import type { Schedule } from "@/types/schedule";
import { formatTime } from "@/utils/date";

interface ScheduleItemProps {
  schedule: Schedule;
  onPress: (schedule: Schedule) => void;
}

export function ScheduleItem({ schedule, onPress }: ScheduleItemProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const meta = CATEGORY_META[schedule.category];

  return (
    <Pressable
      onPress={() => onPress(schedule)}
      className="flex-row items-center rounded-xl overflow-hidden"
      style={{ backgroundColor: colors.surfaceElevated }}
    >
      {/* 카테고리 색상 바 */}
      <View style={{ width: 4, alignSelf: "stretch", backgroundColor: meta.color }} />

      <View className="flex-1 flex-row items-center gap-3 px-3 py-3">
        {/* 카테고리 아이콘 */}
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: meta.color + "20" }}
        >
          <FontAwesome name={meta.icon as any} size={14} color={meta.color} />
        </View>

        {/* 내용 */}
        <View className="flex-1">
          <Typography variant="body-md" className="font-medium">
            {schedule.title}
          </Typography>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {schedule.is_all_day ? "종일" : formatTime(schedule.start_date)}
            {schedule.memo ? ` · ${schedule.memo}` : ""}
          </Text>
        </View>

        <FontAwesome name="chevron-right" size={12} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}
