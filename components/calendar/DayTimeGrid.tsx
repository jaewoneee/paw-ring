import { Text } from '@/components/ui/Text';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCategoryContext } from '@/contexts/CategoryContext';
import type { ScheduleInstance } from '@/types/schedule';
import dayjs, {
  formatISODate,
  formatKoreanDateFull,
  formatTime24,
} from '@/utils/dayjs';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';

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
  const { getCategoryMeta } = useCategoryContext();
  const scrollRef = useRef<ScrollView>(null);
  const [gridWidth, setGridWidth] = useState(0);

  const handleGridLayout = useCallback((e: LayoutChangeEvent) => {
    setGridWidth(e.nativeEvent.layout.width);
  }, []);

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

  // 시간 이벤트의 위치 계산 + 겹침 감지 컬럼 배치
  const timedBlocks = useMemo(() => {
    const blocks = timedSchedules.map(s => {
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
        meta: getCategoryMeta(s.schedule.category),
        startMinutes,
        endMinutes: startMinutes + duration,
        column: 0,
        totalColumns: 1,
      };
    });

    // 시작 시간순 정렬
    blocks.sort(
      (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes
    );

    // 겹침 그룹 분류 및 컬럼 배치
    const groups: (typeof blocks)[] = [];
    for (const block of blocks) {
      let placed = false;
      for (const group of groups) {
        if (
          group.some(
            g =>
              g.startMinutes < block.endMinutes &&
              block.startMinutes < g.endMinutes
          )
        ) {
          group.push(block);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([block]);
    }

    for (const group of groups) {
      // 각 블록에 컬럼 배정 (greedy)
      const columns: (typeof blocks)[] = [];
      for (const block of group) {
        let col = 0;
        while (col < columns.length) {
          if (
            columns[col].every(
              b =>
                b.endMinutes <= block.startMinutes ||
                block.endMinutes <= b.startMinutes
            )
          )
            break;
          col++;
        }
        block.column = col;
        if (!columns[col]) columns[col] = [];
        columns[col].push(block);
      }
      const totalCols = columns.length;
      for (const block of group) {
        block.totalColumns = totalCols;
      }
    }

    return blocks;
  }, [timedSchedules, getCategoryMeta]);

  // 초기 스크롤: 첫 이벤트 또는 현재 시간 근처로
  useEffect(() => {
    const scrollToHour =
      timedBlocks.length > 0
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
    <View className="flex-1 pt-2">
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
        contentContainerStyle={{
          height: 24 * HOUR_HEIGHT + HOUR_HEIGHT,
          paddingTop: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ position: 'relative' }} onLayout={handleGridLayout}>
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
                  ((dayjs().hour() * 60 + dayjs().minute()) / 60) * HOUR_HEIGHT,
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
          {gridWidth > 0 &&
            timedBlocks.map(
              ({ instance, top, height, meta, column, totalColumns }) => {
                const gridStart = TIME_LABEL_WIDTH + 4;
                const gridEnd = 16;
                const availableWidth = gridWidth - gridStart - gridEnd;
                const gap = 2;
                const colWidth =
                  (availableWidth - gap * (totalColumns - 1)) / totalColumns;
                const blockLeft = gridStart + column * (colWidth + gap);
                const isBlockCompleted =
                  instance.completionStatus === 'completed';

                return (
                  <Pressable
                    key={`${instance.schedule.id}-${instance.occurrenceDate}`}
                    onPress={() => onPressSchedule(instance)}
                    style={{
                      position: 'absolute',
                      top,
                      left: blockLeft,
                      width: colWidth,
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
                      style={{
                        color: colors.foreground,
                        textDecorationLine: isBlockCompleted
                          ? 'line-through'
                          : 'none',
                      }}
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
                );
              }
            )}
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
  const { getCategoryMeta } = useCategoryContext();
  const [expanded, setExpanded] = useState(false);
  const canExpand = schedules.length > MAX_COLLAPSED;
  const visible = expanded ? schedules : schedules.slice(0, MAX_COLLAPSED);

  return (
    <View className=" pb-2">
      <View className="gap-1.5 px-4">
        {visible.map(s => {
          const meta = getCategoryMeta(s.schedule.category);
          const isItemCompleted = s.completionStatus === 'completed';
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
                style={
                  isItemCompleted
                    ? { textDecorationLine: 'line-through' }
                    : undefined
                }
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
          {expanded ? (
            <ChevronUp size={10} color={colors.primary} />
          ) : (
            <ChevronDown size={10} color={colors.primary} />
          )}
        </Pressable>
      )}

      <View className="border-b border-border mt-1" />
    </View>
  );
}
