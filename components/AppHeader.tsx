import { useRouter } from 'expo-router';
import { Bell, Check, ChevronDown, PawPrint, Plus } from 'lucide-react-native';
import React, { createRef, useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePets } from '@/contexts/PetContext';
import { useUnreadNotificationCount } from '@/hooks/useNotificationHistory';
import { removeShare } from '@/services/sharing';

const ACTION_WIDTH = 72;

function SwipeAction({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: ACTION_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Typography variant="body-sm" className="font-semibold" style={{ color }}>
        {label}
      </Typography>
    </Pressable>
  );
}

interface AppHeaderProps {
  rightActions?: React.ReactNode;
}

export function AppHeader({ rightActions }: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pets, sharedPets, selectedPet, selectPet, refreshPets } = usePets();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const unreadCount = useUnreadNotificationCount();
  const [sheetVisible, setSheetVisible] = useState(false);
  const closeSheet = useCallback(() => setSheetVisible(false), []);
  const swipeableRefsMap = useRef<
    Map<string, React.RefObject<SwipeableMethods | null>>
  >(new Map());

  const getSwipeableRef = (id: string) => {
    if (!swipeableRefsMap.current.has(id)) {
      swipeableRefsMap.current.set(id, createRef<SwipeableMethods | null>());
    }
    return swipeableRefsMap.current.get(id)!;
  };

  const closeOtherSwipeables = (currentId: string) => {
    swipeableRefsMap.current.forEach((ref, id) => {
      if (id !== currentId) ref.current?.close();
    });
  };

  return (
    <>
      <View className="px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center justify-between">
          {/* 반려동물 선택 */}
          <Pressable
            className="flex-row items-center gap-3 mr-3 min-h-[44px] pr-1 flex-shrink w-fit"
            onPress={() => setSheetVisible(true)}
            accessibilityLabel={`반려동물 선택: ${selectedPet?.name ?? '미등록'}`}
            accessibilityRole="button"
          >
            {selectedPet?.profile_image ? (
              <Image
                source={{ uri: selectedPet.profile_image }}
                className="w-9 h-9 rounded-full bg-surface"
              />
            ) : (
              <View className="w-9 h-9 rounded-full bg-surface items-center justify-center">
                <PawPrint size={18} color={colors.mutedForeground} />
              </View>
            )}
            <Typography className="font-semibold" variant="body-xl">
              {selectedPet?.name ?? '반려동물을 등록해주세요'}
            </Typography>
            <ChevronDown size={12} color={colors.mutedForeground} />
          </Pressable>

          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={() => router.push('/notifications')}
              className="w-10 h-10 items-center justify-center"
              accessibilityLabel="알림"
              accessibilityRole="button"
            >
              <Bell size={18} color={colors.foreground} />
              {unreadCount > 0 && (
                <View
                  className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full items-center justify-center px-1"
                  style={{ backgroundColor: colors.error }}
                >
                  <Typography
                    variant="body-sm"
                    className="text-white font-bold"
                    style={{ fontSize: 10, lineHeight: 14 }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Typography>
                </View>
              )}
            </Pressable>
            {rightActions}
          </View>
        </View>
      </View>

      {/* 반려동물 선택 바텀시트 */}
      <BottomSheet visible={sheetVisible} onClose={closeSheet}>
        <View className="gap-2">
          <Typography className="font-semibold mb-1" variant="body-lg">
            반려동물 선택
          </Typography>

          {pets.map(pet => (
            <ReanimatedSwipeable
              key={pet.id}
              ref={getSwipeableRef(pet.id)}
              friction={2}
              rightThreshold={40}
              overshootRight={false}
              onSwipeableWillOpen={() => closeOtherSwipeables(pet.id)}
              renderRightActions={() => (
                <SwipeAction
                  label="수정"
                  color={colors.primary}
                  onPress={() => {
                    getSwipeableRef(pet.id).current?.close();
                    setSheetVisible(false);
                    router.push({
                      pathname: '/edit-pet',
                      params: { petId: pet.id },
                    });
                  }}
                />
              )}
            >
              <Pressable
                className={`flex-row items-center gap-3 p-3 rounded-xl ${
                  selectedPet?.id === pet.id ? 'bg-surface' : ''
                }`}
                style={{ backgroundColor: colors.surfaceElevated }}
                onPress={() => {
                  selectPet(pet);
                  setSheetVisible(false);
                }}
              >
                {pet.profile_image ? (
                  <Image
                    source={{ uri: pet.profile_image }}
                    className="w-10 h-10 rounded-full bg-surface"
                  />
                ) : (
                  <View className="w-10 h-10 rounded-full bg-surface items-center justify-center">
                    <PawPrint size={18} color={colors.mutedForeground} />
                  </View>
                )}
                <Typography className="flex-1">{pet.name}</Typography>
                {selectedPet?.id === pet.id && (
                  <Check size={16} color={colors.primary} />
                )}
              </Pressable>
            </ReanimatedSwipeable>
          ))}

          <Pressable
            className="flex-row items-center gap-3 p-3 rounded-xl"
            onPress={() => {
              setSheetVisible(false);
              router.push('/add-pet');
            }}
          >
            <View className="w-10 h-10 rounded-full bg-surface items-center justify-center">
              <Plus size={16} color={colors.mutedForeground} />
            </View>
            <Typography className="text-muted-foreground">
              반려동물 추가하기
            </Typography>
          </Pressable>

          {/* 공유받은 반려동물 */}
          {sharedPets.length > 0 && (
            <>
              <View className="h-px bg-border my-1" />
              <Typography
                className="text-muted-foreground ml-1"
                variant="body-sm"
              >
                공유받은 반려동물
              </Typography>
              {sharedPets.map(pet => (
                <ReanimatedSwipeable
                  key={pet.id}
                  ref={getSwipeableRef(`shared_${pet.id}`)}
                  friction={2}
                  rightThreshold={40}
                  overshootRight={false}
                  onSwipeableWillOpen={() =>
                    closeOtherSwipeables(`shared_${pet.id}`)
                  }
                  renderRightActions={() => (
                    <SwipeAction
                      label="나가기"
                      color={colors.error}
                      onPress={() => {
                        getSwipeableRef(`shared_${pet.id}`).current?.close();
                        Alert.alert(
                          '공유 캘린더 나가기',
                          `${pet.name} 캘린더에서 나가시겠습니까?`,
                          [
                            { text: '취소', style: 'cancel' },
                            {
                              text: '나가기',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await removeShare(pet.shareId);
                                  await refreshPets();
                                  setSheetVisible(false);
                                } catch {
                                  Alert.alert('오류', '나가기에 실패했습니다');
                                }
                              },
                            },
                          ]
                        );
                      }}
                    />
                  )}
                >
                  <Pressable
                    className={`flex-row items-center gap-3 p-3 rounded-xl ${
                      selectedPet?.id === pet.id ? 'bg-surface' : ''
                    }`}
                    style={{ backgroundColor: colors.surfaceElevated }}
                    onPress={() => {
                      selectPet(pet);
                      setSheetVisible(false);
                    }}
                  >
                    {pet.profile_image ? (
                      <Image
                        source={{ uri: pet.profile_image }}
                        className="w-10 h-10 rounded-full bg-surface"
                      />
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-surface items-center justify-center">
                        <PawPrint size={18} color={colors.mutedForeground} />
                      </View>
                    )}
                    <View className="flex-1">
                      <Typography>{pet.name}</Typography>
                      <Typography
                        className="text-muted-foreground"
                        variant="body-sm"
                      >
                        {pet.ownerNickname}님의 캘린더
                      </Typography>
                    </View>
                    {selectedPet?.id === pet.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </Pressable>
                </ReanimatedSwipeable>
              ))}
            </>
          )}
        </View>
      </BottomSheet>
    </>
  );
}
