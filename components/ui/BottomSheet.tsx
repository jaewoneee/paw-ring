import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const overlay = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(300);
      overlay.setValue(0);
      Animated.parallel([
        Animated.timing(overlay, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 25,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(overlay, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* 오버레이 - 전체 화면 */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.4)", opacity: overlay },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* 시트 - 하단 고정 */}
      <Animated.View
        style={{
          transform: [{ translateY }],
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }}
        className="bg-white rounded-t-2xl pb-8 px-4 pt-3 min-h-[30vh]"
      >
        <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />
        {children}
      </Animated.View>
    </Modal>
  );
}
