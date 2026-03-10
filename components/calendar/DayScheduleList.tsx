import { Calendar } from 'lucide-react-native';
import { formatShortDate } from '@/utils/dayjs';
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
  onToggleComplete?: (instance: ScheduleInstance) => void;
}

export function DayScheduleList({
  date,
  schedules,
  onPressSchedule,
  onPressAdd,
  onToggleComplete,
}: DayScheduleListProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const dateLabel = formatShortDate(date);

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
          <Calendar size={24} color={colors.mutedForeground} />
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
              occurrenceDate={s.occurrenceDate}
              completionStatus={s.completionStatus}
              onPress={() => onPressSchedule(s)}
              onToggleComplete={onToggleComplete ? () => onToggleComplete(s) : undefined}
            />
          ))}
        </View>
      )}
    </View>
  );
}
