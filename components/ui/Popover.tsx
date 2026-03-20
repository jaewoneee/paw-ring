import React, { useCallback, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  type LayoutRectangle,
  type ViewStyle,
} from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface PopoverProps {
  trigger: (props: { onPress: () => void }) => React.ReactNode;
  children: React.ReactNode;
  width?: number;
}

export function Popover({ trigger, children, width = 200 }: PopoverProps) {
  const [visible, setVisible] = useState(false);
  const [anchorLayout, setAnchorLayout] = useState<LayoutRectangle | null>(
    null
  );
  const anchorRef = useRef<View>(null);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const open = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      setAnchorLayout({ x, y, width: w, height: h });
      setVisible(true);
    });
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const popoverStyle: ViewStyle | undefined = anchorLayout
    ? {
        position: 'absolute',
        top: anchorLayout.y + anchorLayout.height + 8,
        left: Math.max(8, anchorLayout.x + anchorLayout.width - width),
      }
    : undefined;

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        {trigger({ onPress: open })}
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable
          className="flex-1"
          onPress={close}
          accessibilityLabel="팝오버 닫기"
        >
          {popoverStyle && (
            <View
              style={[
                popoverStyle,
                {
                  width,
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 12,
                  paddingVertical: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
            >
              {children}
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}

interface PopoverItemProps {
  label: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
}

export function PopoverItem({ label, icon, right, onPress }: PopoverItemProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 gap-3"
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.surface : 'transparent',
      })}
    >
      {icon}
      <Typography variant="body-sm" className="flex-1">
        {label}
      </Typography>
      {right}
    </Pressable>
  );
}
