import { Check, Pipette, Trash2 } from 'lucide-react-native';
import { CategoryIcon } from '@/utils/categoryIcon';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import ColorPicker, { HueSlider, Panel1 } from 'reanimated-color-picker';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORY_COLOR_PRESETS } from '@/constants/Schedule';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { MIN_CATEGORY_COUNT } from '@/hooks/useCategories';
import type { ScheduleCategoryItem } from '@/types/schedule';

export default function CategoryManageScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { categories, addCategory, editCategory, removeCategory } =
    useCategoryContext();

  const [showSheet, setShowSheet] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ScheduleCategoryItem | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(
    CATEGORY_COLOR_PRESETS[0]
  );
  const [saving, setSaving] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const openAdd = () => {
    setEditingCategory(null);
    setName('');
    setSelectedColor(CATEGORY_COLOR_PRESETS[0]);
    setShowCustomPicker(false);
    setShowSheet(true);
  };

  const openEdit = (cat: ScheduleCategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedColor(cat.color);
    setShowCustomPicker(!CATEGORY_COLOR_PRESETS.includes(cat.color));
    setShowSheet(true);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('오류', '카테고리 이름을 입력해주세요');
      return;
    }

    const isDuplicate = categories.some(
      (c) =>
        c.name === trimmed && c.id !== editingCategory?.id
    );
    if (isDuplicate) {
      Alert.alert('오류', '이미 같은 이름의 카테고리가 있습니다');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await editCategory(editingCategory.id, {
          name: trimmed,
          color: selectedColor,
        });
      } else {
        await addCategory({ name: trimmed, color: selectedColor });
      }
      setShowSheet(false);
    } catch (err) {
      console.error('[CategoryManage] save failed:', err);
      Alert.alert('오류', '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const canDelete = categories.length > MIN_CATEGORY_COUNT;

  const handleDelete = (cat: ScheduleCategoryItem) => {
    if (!canDelete) {
      Alert.alert('삭제 불가', '카테고리는 최소 1개 이상 있어야 합니다.');
      return;
    }

    Alert.alert(
      '카테고리 삭제',
      `"${cat.name}" 카테고리를 삭제할까요?\n이 카테고리를 사용 중인 스케줄은 "기타"로 표시됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCategory(cat.id);
            } catch (err) {
              console.error('[CategoryManage] delete failed:', err);
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 24 }}
      >
        {/* 카테고리 목록 */}
        <View style={{ gap: 8 }}>
          <Typography variant="body-sm" className="text-muted-foreground font-medium px-1">
            카테고리
          </Typography>
          {categories.length > 0 ? (
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.surfaceElevated }}
            >
              {categories.map((cat, i) => (
                <Pressable
                  key={cat.id}
                  onPress={() => openEdit(cat)}
                  className="flex-row items-center px-4 py-3"
                  style={
                    i < categories.length - 1
                      ? {
                          borderBottomWidth: 0.5,
                          borderBottomColor: colors.border,
                        }
                      : undefined
                  }
                >
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    <CategoryIcon
                      name={cat.icon}
                      size={11}
                      color={cat.color}
                    />
                  </View>
                  <Typography variant="body-md" className="flex-1">
                    {cat.name}
                  </Typography>
                  <Pressable
                    onPress={() => handleDelete(cat)}
                    hitSlop={8}
                    className="mr-3"
                    style={!canDelete ? { opacity: 0.3 } : undefined}
                  >
                    <Trash2 size={16} color={colors.mutedForeground} />
                  </Pressable>
                  <View
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </Pressable>
              ))}
            </View>
          ) : (
            <View
              className="items-center py-6 rounded-xl"
              style={{ backgroundColor: colors.surfaceElevated }}
            >
              <Typography variant="body-sm" className="text-muted-foreground">
                카테고리가 없어요
              </Typography>
            </View>
          )}
        </View>

        <Button onPress={openAdd}>
          + 카테고리 추가
        </Button>
      </ScrollView>

      {/* 추가/수정 바텀시트 */}
      <BottomSheet visible={showSheet} onClose={() => setShowSheet(false)}>
        <View style={{ gap: 16 }}>
          <Typography variant="body-lg" className="font-semibold text-center">
            {editingCategory ? '카테고리 수정' : '카테고리 추가'}
          </Typography>

          {/* 이름 입력 */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.foreground,
              }}
            >
              이름
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="카테고리 이름"
              placeholderTextColor={colors.mutedForeground}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                fontFamily: 'Pretendard',
                color: colors.foreground,
              }}
            />
          </View>

          {/* 색상 선택 */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.foreground,
              }}
            >
              색상
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {CATEGORY_COLOR_PRESETS.map((color) => {
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
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: color,
                      borderWidth: isActive ? 3 : 0,
                      borderColor: colors.foreground,
                    }}
                  >
                    {isActive && (
                      <Check size={14} color="#FFFFFF" />
                    )}
                  </Pressable>
                );
              })}
              {/* 커스텀 색상 버튼 */}
              <Pressable
                onPress={() => setShowCustomPicker(true)}
                accessibilityLabel="커스텀 색상 선택"
                accessibilityRole="button"
                className="w-10 h-10 rounded-full items-center justify-center overflow-hidden"
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

            {/* 커스텀 색상 피커 */}
            {showCustomPicker && (
              <View style={{ gap: 12, marginTop: 8 }}>
                <ColorPicker
                  value={selectedColor}
                  onChangeJS={({ hex }) => setSelectedColor(hex)}
                >
                  <Panel1 style={{ height: 150, borderRadius: 12 }} />
                  <HueSlider
                    style={{ marginTop: 12, borderRadius: 8 }}
                    thumbColor="#FFFFFF"
                    thumbShape="pill"
                  />
                </ColorPicker>
              </View>
            )}
          </View>

          <Button onPress={handleSave} loading={saving}>
            저장
          </Button>
        </View>
      </BottomSheet>
    </Screen>
  );
}
