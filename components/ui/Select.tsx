import { ChevronDown } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, View, type LayoutRectangle } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export interface SelectOption<T extends string = string> {
  key: T;
  label: string;
}

interface SelectProps<T extends string = string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  width?: number;
}

export function Select<T extends string = string>({
  options,
  value,
  onChange,
  width = 160,
}: SelectProps<T>) {
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const anchorRef = useRef<View>(null);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const selectedLabel = options.find(o => o.key === value)?.label ?? '';

  const open = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, width: w, height: h });
      setVisible(true);
    });
  }, []);

  const close = useCallback(() => setVisible(false), []);

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        <Pressable
          onPress={open}
          className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
          style={{ backgroundColor: colors.surfaceElevated }}
        >
          <Typography variant="body-lg" className="font-medium">
            {selectedLabel}
          </Typography>
          <ChevronDown size={14} color={colors.mutedForeground} />
        </Pressable>
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
          accessibilityLabel="셀렉트 닫기"
        >
          {anchor && (
            <View
              className="absolute rounded-xl overflow-hidden"
              style={{
                top: anchor.y + anchor.height + 4,
                left: anchor.x,
                minWidth: width,
                backgroundColor: colors.surfaceElevated,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {options.map(o => (
                <Pressable
                  key={o.key}
                  onPress={() => {
                    onChange(o.key);
                    close();
                  }}
                  className="px-4 py-3"
                  style={
                    value === o.key
                      ? { backgroundColor: colors.surface }
                      : undefined
                  }
                >
                  <Typography
                    variant="body-lg"
                    style={
                      value === o.key
                        ? { color: colors.primary, fontWeight: '600' }
                        : undefined
                    }
                  >
                    {o.label}
                  </Typography>
                </Pressable>
              ))}
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}
