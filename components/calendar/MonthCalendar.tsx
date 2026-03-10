import { Text } from '@/components/ui/Text';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import dayjs, { formatISODate, formatMonthLabel } from '@/utils/dayjs';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCategoryContext } from '@/contexts/CategoryContext';
import type { ScheduleInstance } from '@/types/schedule';
import { getMonthGrid } from '@/utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_DOTS = 3;

interface MonthCalendarProps {
  year: number;
  month: number;
  selectedDate: string;
  schedules: ScheduleInstance[];
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
}

export function MonthCalendar({
  year,
  month,
  selectedDate,
  schedules,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onGoToday,
}: MonthCalendarProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { getCategoryMeta } = useCategoryContext();

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);
  const today = formatISODate(dayjs());
  const monthLabel = formatMonthLabel(dayjs().year(year).month(month));
  const isCurrentMonth = year === dayjs().year() && month === dayjs().month();

  // 날짜별 스케줄 그룹핑
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, ScheduleInstance[]>();
    for (const s of schedules) {
      const key = s.occurrenceDate;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [schedules]);

  return (
    <View className="px-4 pt-2 pb-1">
      {/* 월 헤더 */}
      <View className="flex-row items-center justify-between mb-3">
        <Pressable
          onPress={onPrevMonth}
          className="w-11 h-11 items-center justify-center"
          accessibilityLabel="이전 달"
          accessibilityRole="button"
        >
          <FontAwesome
            name="chevron-left"
            size={14}
            color={colors.foreground}
          />
        </Pressable>
        <Pressable
          onPress={onGoToday}
          className="flex-row items-center gap-1.5"
          accessibilityLabel="오늘로 이동"
          accessibilityRole="button"
        >
          <Typography variant="body-xl" className="font-semibold">
            {monthLabel}
          </Typography>
          {!isCurrentMonth && (
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: colors.primary + '18' }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: colors.primary }}
              >
                오늘
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={onNextMonth}
          className="w-11 h-11 items-center justify-center"
          accessibilityLabel="다음 달"
          accessibilityRole="button"
        >
          <FontAwesome
            name="chevron-right"
            size={14}
            color={colors.foreground}
          />
        </Pressable>
      </View>

      {/* 요일 헤더 */}
      <View className="flex-row mb-1">
        {WEEKDAYS.map((day, i) => (
          <View
            key={day}
            style={{ width: '14.28%' }}
            className="items-center py-1"
          >
            <Text
              className="text-xs font-medium"
              style={{
                color:
                  i === 0
                    ? colors.error
                    : i === 6
                      ? colors.primary
                      : colors.mutedForeground,
              }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* 날짜 그리드 */}
      <View className="flex-row flex-wrap">
        {grid.map(day => {
          const dateStr = formatISODate(day);
          const isCurrentMonth = day.month() === month;
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const daySchedules = schedulesByDate.get(dateStr);
          const dayOfWeek = day.day();

          // 카테고리별 고유 dot 색상 (최대 3개)
          const dotColors = daySchedules
            ? [
                ...new Set(
                  daySchedules.map(
                    s => getCategoryMeta(s.schedule.category).color,
                  ),
                ),
              ].slice(0, MAX_DOTS)
            : [];

          return (
            <Pressable
              key={dateStr}
              onPress={() => onSelectDate(dateStr)}
              style={{ width: '14.28%', aspectRatio: 1 }}
              className="items-center justify-center"
            >
              <View
                className="items-center justify-center rounded-full"
                style={[
                  { width: 24, height: 24 },
                  isSelected && { backgroundColor: colors.primary },
                  isToday &&
                    !isSelected && {
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                    },
                ]}
              >
                <Text
                  className="text-xl"
                  style={{
                    color: isSelected
                      ? colors.primaryForeground
                      : !isCurrentMonth
                        ? colors.border
                        : dayOfWeek === 0
                          ? colors.error
                          : dayOfWeek === 6
                            ? colors.primary
                            : colors.foreground,
                  }}
                >
                  {day.date()}
                </Text>
              </View>

              {/* Dot 마커 */}
              <View className="flex-row gap-0.5 mt-0.5" style={{ height: 5 }}>
                {dotColors.map(c => (
                  <View
                    key={c}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: c,
                    }}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
