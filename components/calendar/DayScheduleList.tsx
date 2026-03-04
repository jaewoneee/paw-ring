import FontAwesome from '@expo/vector-icons/FontAwesome';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import React from 'react';
import { View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { ScheduleInstance } from '@/types/schedule';

import { ScheduleItem } from './ScheduleItem';

interface DayScheduleListProps {
  date: string;
  schedules: ScheduleInstance[];
  onPressSchedule: (instance: ScheduleInstance) => void;
  onPressAdd: () => void;
}

export function DayScheduleList({
  date,
  schedules,
  onPressSchedule,
  onPressAdd,
}: DayScheduleListProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const dateLabel = dayjs(date).locale('ko').format('M월 D일 (dd)');

  return (
    <View className="px-4 pt-3 pb-4 gap-3">
      {/* 날짜 헤더 */}
      <View className="flex-row items-center justify-between">
        <Typography variant="body-lg" className="font-semibold">
          {dateLabel}
        </Typography>
      </View>

      {/* 스케줄 리스트 */}
      {schedules.length === 0 ? (
        <View className="items-center py-8 gap-2">
          <FontAwesome
            name="calendar-o"
            size={24}
            color={colors.mutedForeground}
          />
          <Typography
            variant="body-sm"
            className="text-muted-foreground text-center"
          >
            이 날의 일정이 없어요
          </Typography>
        </View>
      ) : (
        <View className="gap-2">
          {schedules.map(s => (
            <ScheduleItem
              key={`${s.schedule.id}-${s.occurrenceDate}`}
              schedule={s.schedule}
              onPress={() => onPressSchedule(s)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
