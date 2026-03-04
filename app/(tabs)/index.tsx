import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePets } from '@/contexts/PetContext';
import { useAuth } from '@/hooks/useAuth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { createRef, useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFocusEffect } from '@react-navigation/native';

import { StackedScheduleList } from '@/components/calendar/StackedScheduleList';
import { getUpcomingSchedules } from '@/services/schedule';
import type { Schedule } from '@/types/schedule';

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
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useAuth();
  const { pets, selectedPet, selectPet } = usePets();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isLoggedIn = !!user;
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!selectedPet?.id) {
        setUpcomingSchedules([]);
        return;
      }
      getUpcomingSchedules(selectedPet.id)
        .then(setUpcomingSchedules)
        .catch(() => setUpcomingSchedules([]));
    }, [selectedPet?.id])
  );

  const [sheetVisible, setSheetVisible] = useState(false);
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

  const greeting = userProfile?.nickname
    ? `${userProfile.nickname}님, 안녕하세요!`
    : '안녕하세요!';

  return (
    <Screen>
      {/* 상단 헤더: 반려동물 선택 + 알림/다크모드 */}
      <View className="px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center justify-between">
          <Pressable
            className="flex-row items-center gap-3 flex-1 mr-3"
            onPress={() => setSheetVisible(true)}
          >
            {selectedPet?.profile_image ? (
              <Image
                source={{ uri: selectedPet.profile_image }}
                className="w-9 h-9 rounded-full bg-surface"
              />
            ) : (
              <View className="w-9 h-9 rounded-full bg-surface items-center justify-center">
                <FontAwesome
                  name="paw"
                  size={18}
                  color={colors.mutedForeground}
                />
              </View>
            )}
            <Typography className="font-semibold">
              {selectedPet?.name ?? '반려동물을 등록해주세요'}
            </Typography>
            <FontAwesome
              name="chevron-down"
              size={12}
              color={colors.mutedForeground}
            />
          </Pressable>

          <View className="flex-row items-center gap-1">
            <Pressable
              className="w-9 h-9 rounded-full items-center justify-center"
              onPress={() => {
                /* TODO: 알림 화면 이동 */
              }}
            >
              <FontAwesome name="bell-o" size={20} color={colors.foreground} />
            </Pressable>
            <Pressable
              className="w-9 h-9 rounded-full items-center justify-center"
              onPress={toggleColorScheme}
            >
              <FontAwesome
                name={isDark ? 'sun-o' : 'moon-o'}
                size={20}
                color={colors.foreground}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="p-4 gap-5">
          {/* 인사말 */}
          <View className="gap-1">
            <Typography variant="h2">{greeting}</Typography>
            <Typography className="text-muted-foreground" variant="body-lg">
              오늘도 반려동물과 행복한 하루 되세요!
            </Typography>
          </View>

          {/* 로그인 안내 카드 (비로그인 시) */}
          {!isLoggedIn && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="items-center gap-3 py-5">
                <Typography className="text-center" variant="body-lg">
                  로그인하고{'\n'}내 반려동물을 등록해보세요!
                </Typography>
                <View className="flex-row gap-3 mt-1">
                  <Button
                    onPress={() => router.push('/(auth)/login')}
                    className="flex-1"
                  >
                    로그인
                  </Button>
                  <Button
                    variant="outline"
                    onPress={() => router.push('/(auth)/register')}
                    className="flex-1"
                  >
                    회원가입
                  </Button>
                </View>
              </CardContent>
            </Card>
          )}

          {/* 다가오는 일정 */}
          <View className="gap-2">
            <Typography variant="body-xl" className="font-semibold">
              다가오는 일정
            </Typography>
            {!isLoggedIn || !selectedPet || upcomingSchedules.length === 0 ? (
              <Card>
                <CardContent>
                  <View className="items-center py-4 gap-2">
                    <FontAwesome
                      name="calendar"
                      size={24}
                      color={colors.mutedForeground}
                    />
                    <Typography
                      variant="body-sm"
                      className="text-muted-foreground text-center"
                    >
                      {isLoggedIn
                        ? '등록된 일정이 없어요\n일정을 추가해보세요'
                        : '로그인 후 일정을 확인할 수 있어요'}
                    </Typography>
                  </View>
                </CardContent>
              </Card>
            ) : (
              <StackedScheduleList
                schedules={upcomingSchedules}
                onPressSchedule={(s) =>
                  router.push({
                    pathname: '/schedule-detail',
                    params: { id: s.id },
                  })
                }
              />
            )}
          </View>

          {/* 내 반려동물 */}
          {/* <View className="gap-2">
            <Typography variant="body-lg" className="font-semibold">
              내 반려동물
            </Typography>
            <Card>
              <CardContent>
                <View className="items-center py-4 gap-3">
                  <FontAwesome name="paw" size={24} color={colors.mutedForeground} />
                  <Typography variant="body-sm" className="text-muted-foreground text-center">
                    {isLoggedIn
                      ? "아직 등록된 반려동물이 없어요"
                      : "로그인 후 반려동물을 등록할 수 있어요"}
                  </Typography>
                  {isLoggedIn && (
                    <Button
                      variant="outline"
                      onPress={() => router.push("/add-pet")}
                    >
                      반려동물 등록하기
                    </Button>
                  )}
                </View>
              </CardContent>
            </Card>
          </View> */}
        </View>
      </ScrollView>

      {/* 반려동물 선택 바텀시트 */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      >
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
                    <FontAwesome
                      name="paw"
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </View>
                )}
                <Typography className="flex-1">{pet.name}</Typography>
                {selectedPet?.id === pet.id && (
                  <FontAwesome name="check" size={16} color={colors.primary} />
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
              <FontAwesome
                name="plus"
                size={16}
                color={colors.mutedForeground}
              />
            </View>
            <Typography className="text-muted-foreground">
              반려동물 추가하기
            </Typography>
          </Pressable>
        </View>
      </BottomSheet>
    </Screen>
  );
}
