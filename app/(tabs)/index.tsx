import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePets } from '@/contexts/PetContext';
import { useAuth } from '@/hooks/useAuth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { createRef, useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFocusEffect } from '@react-navigation/native';

import { StackedScheduleList } from '@/components/calendar/StackedScheduleList';
import { completeSchedule, getUpcomingSchedules } from '@/services/schedule';
import { removeShare } from '@/services/sharing';
import type { SharedPet } from '@/contexts/PetContext';
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
  const { pets, sharedPets, selectedPet, selectPet, refreshPets } = usePets();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isLoggedIn = !!user;
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUpcomingSchedules = useCallback(async () => {
    if (!selectedPet?.id) {
      setUpcomingSchedules([]);
      setScheduleError(null);
      return;
    }
    setScheduleError(null);
    try {
      const schedules = await getUpcomingSchedules(selectedPet.id);
      setUpcomingSchedules(schedules);
    } catch (err) {
      console.warn("[home] 일정 로딩 실패:", err);
      setUpcomingSchedules([]);
      setScheduleError("일정을 불러오지 못했습니다");
    }
  }, [selectedPet?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchUpcomingSchedules();
    }, [fetchUpcomingSchedules])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUpcomingSchedules();
    setRefreshing(false);
  }, [fetchUpcomingSchedules]);

  const handleCompleteSchedule = useCallback(
    async (schedule: Schedule) => {
      if (!user) return;
      const scheduleDate = schedule.start_date.split('T')[0];
      // Optimistic: remove from list immediately
      setUpcomingSchedules(prev => prev.filter(s => s.id !== schedule.id));
      try {
        await completeSchedule(schedule.id, scheduleDate, user.uid);
      } catch {
        // Rollback on failure
        setUpcomingSchedules(prev =>
          [...prev, schedule].sort((a, b) =>
            a.start_date.localeCompare(b.start_date)
          )
        );
      }
    },
    [user]
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
              className="w-11 h-11 rounded-full items-center justify-center"
              accessibilityLabel="알림"
              accessibilityRole="button"
              onPress={() => {
                /* TODO: 알림 화면 이동 */
              }}
            >
              <FontAwesome name="bell-o" size={20} color={colors.foreground} />
            </Pressable>
            <Pressable
              className="w-11 h-11 rounded-full items-center justify-center"
              accessibilityLabel={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              accessibilityRole="button"
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
          <View className="gap-1">
            <Typography variant="body-xl" className="font-semibold">
              다가오는 일정
            </Typography>
            {scheduleError ? (
              <Pressable onPress={fetchUpcomingSchedules}>
                <Card>
                  <CardContent>
                    <View className="items-center py-4 gap-2">
                      <FontAwesome
                        name="exclamation-circle"
                        size={24}
                        color={colors.error}
                      />
                      <Typography
                        variant="body-sm"
                        className="text-center"
                        style={{ color: colors.error }}
                      >
                        {scheduleError}
                      </Typography>
                      <Typography
                        variant="body-sm"
                        className="text-muted-foreground"
                      >
                        탭하여 다시 시도
                      </Typography>
                    </View>
                  </CardContent>
                </Card>
              </Pressable>
            ) : !isLoggedIn || !selectedPet || upcomingSchedules.length === 0 ? (
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
                onPressSchedule={s =>
                  router.push({
                    pathname: '/schedule-detail',
                    params: { id: s.id },
                  })
                }
                onCompleteSchedule={handleCompleteSchedule}
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

          {/* 공유받은 반려동물 */}
          {sharedPets.length > 0 && (
            <>
              <View className="h-px bg-border my-1" />
              <Typography className="text-muted-foreground ml-1" variant="body-sm">
                공유받은 반려동물
              </Typography>
              {sharedPets.map(pet => (
                <ReanimatedSwipeable
                  key={pet.id}
                  ref={getSwipeableRef(`shared_${pet.id}`)}
                  friction={2}
                  rightThreshold={40}
                  overshootRight={false}
                  onSwipeableWillOpen={() => closeOtherSwipeables(`shared_${pet.id}`)}
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
                        <FontAwesome
                          name="paw"
                          size={18}
                          color={colors.mutedForeground}
                        />
                      </View>
                    )}
                    <View className="flex-1">
                      <Typography>{pet.name}</Typography>
                      <Typography className="text-muted-foreground" variant="body-sm">
                        {pet.ownerNickname}님의 캘린더
                      </Typography>
                    </View>
                    {selectedPet?.id === pet.id && (
                      <FontAwesome name="check" size={16} color={colors.primary} />
                    )}
                  </Pressable>
                </ReanimatedSwipeable>
              ))}
            </>
          )}
        </View>
      </BottomSheet>
    </Screen>
  );
}
