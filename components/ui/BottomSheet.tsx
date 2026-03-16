import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const CLOSE_DURATION = 260;

export function BottomSheet({
  visible,
  onClose,
  children,
  className,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const overlay = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const sheetHeight = useRef(600); // 측정 전 충분히 큰 기본값

  const animateClose = (onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(overlay, {
        toValue: 0,
        duration: CLOSE_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: sheetHeight.current,
        duration: CLOSE_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(onDone);
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(sheetHeight.current);
      overlay.setValue(0);
      Animated.parallel([
        Animated.timing(overlay, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 25,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      animateClose(() => setMounted(false));
    }
  }, [visible]);

  const handleClose = () => {
    animateClose(() => {
      setMounted(false);
      onClose();
    });
  };

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* 오버레이 - 전체 화면 */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0,0,0,0.4)', opacity: overlay },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* 시트 - 하단 고정 */}
      <Animated.View
        style={{
          transform: [{ translateY }],
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
        className={`bg-surface-elevated rounded-t-2xl pb-10 px-4 pt-3 min-h-[30vh] ${className || ''}`}
        onLayout={e => {
          sheetHeight.current = e.nativeEvent.layout.height;
        }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <View className="w-10 h-1 bg-border-strong rounded-full self-center mb-4" />
              {children}
            </View>
          </TouchableWithoutFeedback>
        </GestureHandlerRootView>
      </Animated.View>
    </Modal>
  );
}
