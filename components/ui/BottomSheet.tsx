import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const CLOSE_THRESHOLD = 0.15;
const VELOCITY_THRESHOLD = 500;
const SPRING_SNAP = { damping: 25, stiffness: 300 };
const CLOSE_DURATION = 260;

export function BottomSheet({
  visible,
  onClose,
  children,
  className,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(0);
  const sheetHeight = useSharedValue(600);

  // visible이 유일한 진실의 원천 (single source of truth)
  // - 열기: visible=true → mount + 열기 애니메이션
  // - 닫기: visible=false → 닫기 애니메이션 + setTimeout으로 unmount
  // - setTimeout cleanup으로 재오픈 시 stale unmount 방지
  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withSequence(
        withTiming(sheetHeight.value, { duration: 0 }),
        withTiming(0, { duration: 300 }),
      );
    } else if (mounted) {
      translateY.value = withTiming(sheetHeight.value, { duration: CLOSE_DURATION });
      const timer = setTimeout(() => setMounted(false), CLOSE_DURATION + 50);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // 제스처/오버레이 → 그냥 onClose만 호출. 나머지는 effect가 처리.
  const handleClose = useCallback(() => onClose(), [onClose]);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd(e => {
      const shouldClose =
        e.translationY > sheetHeight.value * CLOSE_THRESHOLD ||
        e.velocityY > VELOCITY_THRESHOLD;

      if (shouldClose) {
        // 닫기 애니메이션을 먼저 시작 (즉각 반응) → onClose로 상태 동기화
        translateY.value = withTiming(sheetHeight.value, { duration: CLOSE_DURATION });
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, SPRING_SNAP);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, sheetHeight.value],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* 오버레이 */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0,0,0,0.4)' },
          overlayStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* 시트 */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            },
            sheetStyle,
          ]}
          className={`bg-surface-elevated rounded-t-2xl pb-10 px-4 pt-3 min-h-[30vh] ${className || ''}`}
          onLayout={e => {
            sheetHeight.value = e.nativeEvent.layout.height;
          }}
        >
          <View className="w-10 h-1 bg-border-strong rounded-full self-center mb-4" />
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}
