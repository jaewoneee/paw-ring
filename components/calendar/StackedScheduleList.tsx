import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  UIManager,
  View,
} from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import { CARD_COLORS } from '@/constants/Schedule';
import type { ScheduleInstance } from '@/types/schedule';

import { ScheduleItem } from './ScheduleItem';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const CARD_HEIGHT = 82;
const COLLAPSED_VISIBLE = 30;
const EXPANDED_GAP = 8;
/** 이 개수 이하면 모두 펼쳐서 표시 */
const VISIBLE_COUNT = 3;

interface StackedScheduleListProps {
  instances: ScheduleInstance[];
  onPressSchedule: (instance: ScheduleInstance) => void;
  onCompleteSchedule?: (instance: ScheduleInstance) => void;
}

export function StackedScheduleList({
  instances,
  onPressSchedule,
  onCompleteSchedule,
}: StackedScheduleListProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expanded, setExpanded] = useState(false);
  const needsStack = instances.length > VISIBLE_COUNT;

  // 스택 영역에 해당하는 아이템만 애니메이션
  const stackedCount = needsStack ? instances.length - VISIBLE_COUNT : 0;
  const animValues = useRef<Animated.Value[]>([]);

  if (animValues.current.length !== stackedCount) {
    animValues.current = Array.from(
      { length: stackedCount },
      (_, i) => animValues.current[i] ?? new Animated.Value(0)
    );
  }

  useEffect(() => {
    setExpanded(false);
    animValues.current.forEach(a => a.setValue(0));
  }, [instances.length]);

  const toggleExpand = useCallback(() => {
    const toValue = expanded ? 0 : 1;

    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );

    const animations = animValues.current.map(anim =>
      Animated.spring(anim, {
        toValue,
        damping: 18,
        stiffness: 200,
        mass: 0.8,
        useNativeDriver: true,
      })
    );

    Animated.stagger(40, animations).start();
    setExpanded(!expanded);
  }, [expanded]);

  const getColors = (index: number) => {
    const c = CARD_COLORS[index % CARD_COLORS.length];
    const mode = isDark ? 'dark' : 'light';
    return { cardColor: c[mode].bg, textColor: c[mode].text };
  };

  // 3개 이하: 스택 없이 모두 표시
  if (!needsStack) {
    return (
      <View style={{ gap: EXPANDED_GAP }}>
        {instances.map((inst, index) => {
          const { cardColor, textColor } = getColors(index);

          return (
            <ScheduleItem
              key={`${inst.schedule.id}-${inst.occurrenceDate}`}
              schedule={inst.schedule}
              occurrenceDate={inst.occurrenceDate}
              completionStatus={inst.completionStatus}
              variant="stacked"
              cardColor={cardColor}
              textColor={textColor}
              onPress={() => onPressSchedule(inst)}
              onComplete={onCompleteSchedule ? (() => onCompleteSchedule(inst)) : undefined}
            />
          );
        })}
      </View>
    );
  }

  // 4개 이상: 처음 3개 펼침 + 나머지 스택
  const visibleItems = instances.slice(0, VISIBLE_COUNT);
  const stackedItems = instances.slice(VISIBLE_COUNT);

  const visibleHeight = VISIBLE_COUNT * CARD_HEIGHT + (VISIBLE_COUNT - 1) * EXPANDED_GAP;
  const stackCollapsedHeight = stackedItems.length * COLLAPSED_VISIBLE;
  const stackExpandedHeight = stackedItems.length * CARD_HEIGHT + stackedItems.length * EXPANDED_GAP;

  const totalHeight = visibleHeight + (expanded ? stackExpandedHeight : stackCollapsedHeight);

  return (
    <View>
      <View style={{ height: totalHeight }}>
        {/* 항상 보이는 상위 N개 */}
        {visibleItems.map((inst, index) => {
          const { cardColor, textColor } = getColors(index);

          return (
            <View
              key={`${inst.schedule.id}-${inst.occurrenceDate}`}
              style={{
                position: 'absolute',
                top: index * (CARD_HEIGHT + EXPANDED_GAP),
                left: 0,
                right: 0,
                zIndex: instances.length - index,
              }}
            >
              <ScheduleItem
                schedule={inst.schedule}
                occurrenceDate={inst.occurrenceDate}
                completionStatus={inst.completionStatus}
                variant="stacked"
                cardColor={cardColor}
                textColor={textColor}
                onPress={() => onPressSchedule(inst)}
                onComplete={onCompleteSchedule ? (() => onCompleteSchedule(inst)) : undefined}
              />
            </View>
          );
        })}

        {/* 스택 영역 (3번째 카드 아래) */}
        {stackedItems.map((inst, stackIndex) => {
          const globalIndex = VISIBLE_COUNT + stackIndex;
          const { cardColor, textColor } = getColors(globalIndex);

          const collapsedTop = visibleHeight + stackIndex * COLLAPSED_VISIBLE;
          const expandedTop = visibleHeight + stackIndex * (CARD_HEIGHT + EXPANDED_GAP);

          const translateY =
            animValues.current[stackIndex]?.interpolate({
              inputRange: [0, 1],
              outputRange: [0, expandedTop - collapsedTop],
            }) ?? 0;

          return (
            <Animated.View
              key={`${inst.schedule.id}-${inst.occurrenceDate}`}
              style={{
                position: 'absolute',
                top: collapsedTop,
                left: 0,
                right: 0,
                zIndex: instances.length - globalIndex,
                transform: [{ translateY }],
              }}
            >
              <ScheduleItem
                schedule={inst.schedule}
                occurrenceDate={inst.occurrenceDate}
                completionStatus={inst.completionStatus}
                variant="stacked"
                cardColor={cardColor}
                textColor={textColor}
                onPress={() => {
                  if (!expanded) {
                    toggleExpand();
                  } else {
                    onPressSchedule(inst);
                  }
                }}
                onComplete={onCompleteSchedule ? (() => onCompleteSchedule(inst)) : undefined}
              />
            </Animated.View>
          );
        })}
      </View>

      {expanded && (
        <Pressable onPress={toggleExpand} className="items-center py-2">
          <Typography variant="small" className="text-muted-foreground">
            접기
          </Typography>
        </Pressable>
      )}
    </View>
  );
}
