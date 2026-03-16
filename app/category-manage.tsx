import { Trash2 } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { usePets } from '@/contexts/PetContext';
import { MIN_CATEGORY_COUNT } from '@/hooks/useCategories';
import type { ScheduleCategoryItem } from '@/types/schedule';
import { canDeleteCategory, canEditCategory, getDisplayCategories } from '@/utils/permissions';

export default function CategoryManageScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { categories, allCategories, removeCategory } = useCategoryContext();
  const { selectedPet } = usePets();

  const displayCategories = getDisplayCategories(selectedPet, categories, allCategories);
  const canEdit = canEditCategory(selectedPet);
  const canDelete = canDeleteCategory(selectedPet, displayCategories.length, MIN_CATEGORY_COUNT);

  const handleDelete = (cat: ScheduleCategoryItem) => {
    if (!canEdit || !canDelete) {
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
          <Typography
            variant="body-sm"
            className="text-muted-foreground font-medium px-1"
          >
            카테고리
          </Typography>
          {displayCategories.length > 0 ? (
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.surfaceElevated }}
            >
              {displayCategories.map((cat, i) => (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    if (!canEdit) return;
                    router.push({
                      pathname: '/category-edit',
                      params: { id: cat.id, name: cat.name, color: cat.color },
                    });
                  }}
                  className="flex-row items-center px-4 py-3"
                  style={
                    i < displayCategories.length - 1
                      ? {
                          borderBottomWidth: 0.5,
                          borderBottomColor: colors.border,
                        }
                      : undefined
                  }
                >
                  <View
                    className="size-3 rounded-full mr-3"
                    style={{ backgroundColor: cat.color }}
                  />

                  <Typography variant="body-md" className="flex-1">
                    {cat.name}
                  </Typography>
                  {!!canEdit && (
                    <Pressable
                      onPress={() => handleDelete(cat)}
                      hitSlop={8}
                      className="mr-3"
                      style={!canDelete ? { opacity: 0.3 } : undefined}
                    >
                      <Trash2 size={16} color={colors.mutedForeground} />
                    </Pressable>
                  )}
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

        {!!canEdit && (
          <Button onPress={() => router.push('/category-edit')}>
            + 카테고리 추가
          </Button>
        )}
      </ScrollView>
    </Screen>
  );
}
