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
import type { Schedule } from '@/types/schedule';

import { ScheduleItem } from './ScheduleItem';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const CARD_HEIGHT = 65;
const COLLAPSED_VISIBLE = 45;
const EXPANDED_GAP = 6;

interface StackedScheduleListProps {
  schedules: Schedule[];
  onPressSchedule: (schedule: Schedule) => void;
  onCompleteSchedule?: (schedule: Schedule) => void;
}

export function StackedScheduleList({
  schedules,
  onPressSchedule,
  onCompleteSchedule,
}: StackedScheduleListProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expanded, setExpanded] = useState(false);

  const animValues = useRef<Animated.Value[]>([]);

  // Sync animated values with schedule count
  if (animValues.current.length !== schedules.length) {
    animValues.current = schedules.map(
      (_, i) => animValues.current[i] ?? new Animated.Value(0)
    );
  }

  // Reset to collapsed when schedules change
  useEffect(() => {
    setExpanded(false);
    animValues.current.forEach(a => a.setValue(0));
  }, [schedules.length]);

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

  // Single schedule: no stacking needed
  if (schedules.length === 1) {
    const { cardColor, textColor } = getColors(0);

    return (
      <ScheduleItem
        schedule={schedules[0]}
        variant="stacked"
        cardColor={cardColor}
        textColor={textColor}
        onPress={() => onPressSchedule(schedules[0])}
        onComplete={onCompleteSchedule}
      />
    );
  }

  const collapsedHeight =
    CARD_HEIGHT + (schedules.length - 1) * COLLAPSED_VISIBLE;
  const expandedHeight =
    schedules.length * CARD_HEIGHT + (schedules.length - 1) * EXPANDED_GAP;

  return (
    <View>
      <View
        style={{
          height: expanded ? expandedHeight : collapsedHeight,
        }}
      >
        {schedules.map((schedule, index) => {
          const { cardColor, textColor } = getColors(index);

          const collapsedOffset =
            (schedules.length - 1 - index) * COLLAPSED_VISIBLE;
          const expandedOffset =
            (schedules.length - 1 - index) * (CARD_HEIGHT + EXPANDED_GAP);

          const translateY =
            animValues.current[index]?.interpolate({
              inputRange: [0, 1],
              outputRange: [0, expandedOffset - collapsedOffset],
            }) ?? 0;

          return (
            <Animated.View
              key={schedule.id}
              style={{
                position: 'absolute',
                top: collapsedOffset,
                left: 0,
                right: 0,
                zIndex: schedules.length - index,
                transform: [{ translateY }],
              }}
            >
              <ScheduleItem
                schedule={schedule}
                variant="stacked"
                cardColor={cardColor}
                textColor={textColor}
                onPress={() => {
                  if (!expanded) {
                    toggleExpand();
                  } else {
                    onPressSchedule(schedule);
                  }
                }}
                onComplete={onCompleteSchedule}
              />
            </Animated.View>
          );
        })}
      </View>

      {expanded && schedules.length > 1 && (
        <Pressable onPress={toggleExpand} className="items-center py-2">
          <Typography variant="small" className="text-muted-foreground">
            접기
          </Typography>
        </Pressable>
      )}
      {/* 
      {!expanded && schedules.length > 1 && (
        <Pressable onPress={toggleExpand} className="items-center pt-2">
          <Typography variant="small" className="text-muted-foreground">
            {schedules.length}개 일정 보기
          </Typography>
        </Pressable>
      )} */}
    </View>
  );
}
