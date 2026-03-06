import { Text } from '@/components/ui/Text';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORY_META } from '@/constants/Schedule';
import type { ScheduleInstance } from '@/types/schedule';
import dayjs, { formatKoreanDateFull, formatISODate, formatTime24 } from '@/utils/dayjs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIME_LABEL_WIDTH = 58;

interface DayTimeGridProps {
  date: string;
  schedules: ScheduleInstance[];
  onPressSchedule: (instance: ScheduleInstance) => void;
}

export function DayTimeGrid({
  date,
  schedules,
  onPressSchedule,
}: DayTimeGridProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const scrollRef = useRef<ScrollView>(null);

  const dateLabel = formatKoreanDateFull(date);

  // 종일 이벤트와 시간 이벤트 분리
  const { allDaySchedules, timedSchedules } = useMemo(() => {
    const allDay: ScheduleInstance[] = [];
    const timed: ScheduleInstance[] = [];
    for (const s of schedules) {
      if (s.schedule.is_all_day) {
        allDay.push(s);
      } else {
        timed.push(s);
      }
    }
    return { allDaySchedules: allDay, timedSchedules: timed };
  }, [schedules]);

  // 시간 이벤트의 위치 계산
  const timedBlocks = useMemo(() => {
    return timedSchedules.map(s => {
      const start = dayjs(s.schedule.start_date);
      const end = s.schedule.end_date
        ? dayjs(s.schedule.end_date)
        : start.add(1, 'hour');

      const startMinutes = start.hour() * 60 + start.minute();
      const endMinutes = end.hour() * 60 + end.minute();
      const duration = Math.max(endMinutes - startMinutes, 30); // 최소 30분

      return {
        instance: s,
        top: (startMinutes / 60) * HOUR_HEIGHT,
        height: (duration / 60) * HOUR_HEIGHT,
        meta: CATEGORY_META[s.schedule.category],
      };
    });
  }, [timedSchedules]);

  // 초기 스크롤: 첫 이벤트 또는 현재 시간 근처로
  useEffect(() => {
    const scrollToHour = timedBlocks.length > 0
      ? Math.max(0, Math.floor(timedBlocks[0].top / HOUR_HEIGHT) - 1)
      : Math.max(0, dayjs().hour() - 1);

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: scrollToHour * HOUR_HEIGHT,
        animated: false,
      });
    }, 100);
  }, [date]);

  const formatHourLabel = (hour: number): string => {
    if (hour === 0) return '오전 12시';
    if (hour === 12) return '정오';
    if (hour < 12) return `오전 ${hour}시`;
    return `오후 ${hour - 12}시`;
  };

  return (
    <View className="flex-1">
      {/* 선택 날짜 레이블 */}
      <View className="py-2 px-4">
        <Typography
          variant="body-md"
          className="font-semibold text-center"
        >
          {dateLabel}
        </Typography>
      </View>

      {/* 종일 이벤트 */}
      {allDaySchedules.length > 0 && (
        <AllDaySection
          schedules={allDaySchedules}
          onPressSchedule={onPressSchedule}
          colors={colors}
        />
      )}

      {/* 타임 그리드 */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ height: 24 * HOUR_HEIGHT + HOUR_HEIGHT }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ position: 'relative' }}>
          {/* 시간 라인들 */}
          {HOURS.map(hour => (
            <View
              key={hour}
              style={{
                position: 'absolute',
                top: hour * HOUR_HEIGHT,
                left: 0,
                right: 0,
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              <View
                style={{ width: TIME_LABEL_WIDTH, paddingRight: 8 }}
                className="items-end"
              >
                <Text
                  className="text-xs"
                  style={{
                    color: colors.mutedForeground,
                    marginTop: -7,
                  }}
                >
                  {formatHourLabel(hour)}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  height: 0.5,
                  backgroundColor: colors.border,
                }}
              />
            </View>
          ))}

          {/* 현재 시간 인디케이터 */}
          {formatISODate(dayjs()) === date && (
            <View
              style={{
                position: 'absolute',
                top:
                  ((dayjs().hour() * 60 + dayjs().minute()) / 60) *
                  HOUR_HEIGHT,
                left: TIME_LABEL_WIDTH - 4,
                right: 0,
                flexDirection: 'row',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.error,
                }}
              />
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: colors.error,
                }}
              />
            </View>
          )}

          {/* 스케줄 블록 */}
          {timedBlocks.map(({ instance, top, height, meta }) => (
            <Pressable
              key={`${instance.schedule.id}-${instance.occurrenceDate}`}
              onPress={() => onPressSchedule(instance)}
              style={{
                position: 'absolute',
                top,
                left: TIME_LABEL_WIDTH + 4,
                right: 12,
                height: Math.max(height, 28),
                backgroundColor: meta.color + '25',
                borderLeftWidth: 3,
                borderLeftColor: meta.color,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
                justifyContent: 'center',
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.foreground }}
                numberOfLines={1}
              >
                {instance.schedule.title}
              </Text>
              {height >= 40 && (
                <Text
                  className="text-xs"
                  style={{ color: colors.mutedForeground }}
                >
                  {formatTime24(instance.schedule.start_date)}
                  {instance.schedule.end_date &&
                    ` - ${formatTime24(instance.schedule.end_date)}`}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const MAX_COLLAPSED = 3;

function AllDaySection({
  schedules,
  onPressSchedule,
  colors,
}: {
  schedules: ScheduleInstance[];
  onPressSchedule: (instance: ScheduleInstance) => void;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = schedules.length > MAX_COLLAPSED;
  const visible = expanded ? schedules : schedules.slice(0, MAX_COLLAPSED);

  return (
    <View className="px-4 pb-2">
      <View className="gap-1.5">
        {visible.map(s => {
          const meta = CATEGORY_META[s.schedule.category];
          return (
            <Pressable
              key={`${s.schedule.id}-${s.occurrenceDate}`}
              onPress={() => onPressSchedule(s)}
              className="flex-row items-center rounded-md px-3 py-2"
              style={{ backgroundColor: meta.color + '20' }}
            >
              <View
                style={{
                  width: 4,
                  alignSelf: 'stretch',
                  minHeight: 16,
                  borderRadius: 2,
                  backgroundColor: meta.color,
                  marginRight: 8,
                }}
              />
              <Typography
                variant="body-sm"
                className="font-medium flex-1"
                numberOfLines={1}
              >
                {s.schedule.title}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      {canExpand && (
        <Pressable
          onPress={() => setExpanded(prev => !prev)}
          className="flex-row items-center justify-center py-1.5 mt-1"
        >
          <Typography
            variant="body-sm"
            style={{ color: colors.primary }}
            className="mr-1"
          >
            {expanded
              ? '접기'
              : `+${schedules.length - MAX_COLLAPSED}개 더보기`}
          </Typography>
          <FontAwesome
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={10}
            color={colors.primary}
          />
        </Pressable>
      )}

      <View className="border-b border-border mt-1" />
    </View>
  );
}
