import { Check, Pipette } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import ColorPicker, { HueSlider, Panel1 } from 'reanimated-color-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORY_COLOR_PRESETS } from '@/constants/Schedule';
import { useCategoryContext } from '@/contexts/CategoryContext';

export default function CategoryEditScreen() {
  const router = useRouter();
  const { id, name: initName, color: initColor } = useLocalSearchParams<{
    id?: string;
    name?: string;
    color?: string;
  }>();

  const isEditing = !!id;
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { categories, addCategory, editCategory } = useCategoryContext();

  const [name, setName] = useState(initName ?? '');
  const [selectedColor, setSelectedColor] = useState(initColor ?? CATEGORY_COLOR_PRESETS[0]);
  const [showCustomPicker, setShowCustomPicker] = useState(
    !!initColor && !CATEGORY_COLOR_PRESETS.includes(initColor)
  );
  const [showPickerSheet, setShowPickerSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('오류', '카테고리 이름을 입력해주세요');
      return;
    }

    const isDuplicate = categories.some(
      c => c.name === trimmed && c.id !== id
    );
    if (isDuplicate) {
      Alert.alert('오류', '이미 같은 이름의 카테고리가 있습니다');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await editCategory(id, { name: trimmed, color: selectedColor });
      } else {
        await addCategory({ name: trimmed, color: selectedColor });
      }
      router.back();
    } catch (err) {
      console.error('[CategoryEdit] save failed:', err);
      Alert.alert('오류', '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 이름 */}
        <Input
          label="이름"
          placeholder="카테고리 이름"
          value={name}
          onChangeText={setName}
          autoFocus={!isEditing}
          autoCapitalize="none"
        />

        {/* 색상 */}
        <View style={{ gap: 8 }}>
          <Typography variant="body-sm" className="font-medium">
            색상
          </Typography>
          <View className="flex-row flex-wrap gap-4">
            {CATEGORY_COLOR_PRESETS.map(color => {
              const isActive = selectedColor === color && !showCustomPicker;
              return (
                <Pressable
                  key={color}
                  onPress={() => {
                    setSelectedColor(color);
                    setShowCustomPicker(false);
                  }}
                  accessibilityLabel={`색상 ${color} ${isActive ? '선택됨' : '선택'}`}
                  accessibilityRole="radio"
                  className="size-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: color,
                    borderWidth: isActive ? 3 : 0,
                    borderColor: colors.foreground,
                  }}
                >
                  {isActive && <Check size={14} color="#FFFFFF" />}
                </Pressable>
              );
            })}

            {/* 커스텀 색상 버튼 */}
            <Pressable
              onPress={() => setShowPickerSheet(true)}
              accessibilityLabel="커스텀 색상 선택"
              accessibilityRole="button"
              className="size-8 rounded-full items-center justify-center"
              style={{
                borderWidth: showCustomPicker ? 3 : 2,
                borderColor: showCustomPicker ? colors.foreground : colors.border,
                backgroundColor: showCustomPicker ? selectedColor : colors.surface,
              }}
            >
              {showCustomPicker ? (
                <Check size={14} color="#FFFFFF" />
              ) : (
                <Pipette size={14} color={colors.mutedForeground} />
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={{ padding: 16, paddingBottom: 32 }}>
        <Button onPress={handleSave} loading={saving}>
          저장
        </Button>
      </View>

      {/* 커스텀 컬러 피커 바텀시트 */}
      <BottomSheet
        visible={showPickerSheet}
        onClose={() => setShowPickerSheet(false)}
      >
        <View style={{ gap: 16 }}>
          <Typography variant="body-lg" className="font-semibold text-center">
            색상 선택
          </Typography>
          <ColorPicker
            value={selectedColor}
            onChangeJS={({ hex }) => setSelectedColor(hex)}
          >
            <Panel1 style={{ height: 180, borderRadius: 12 }} />
            <HueSlider
              style={{ marginTop: 12, borderRadius: 8 }}
              thumbColor="#FFFFFF"
              thumbShape="pill"
            />
          </ColorPicker>
          <Button
            onPress={() => {
              setShowCustomPicker(true);
              setShowPickerSheet(false);
            }}
          >
            선택
          </Button>
        </View>
      </BottomSheet>
    </Screen>
  );
}
