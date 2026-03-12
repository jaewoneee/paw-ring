import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePets } from '@/contexts/PetContext';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  Moon,
  PawPrint,
  Plus,
  Sun,
} from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createRef, useCallback, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackedScheduleList } from '@/components/calendar/StackedScheduleList';
import { HomeScheduleSkeleton } from '@/components/ui/Skeleton';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { queryKeys } from '@/hooks/queryKeys';
import { completeSchedule, getUpcomingSchedules } from '@/services/schedule';
import { removeShare } from '@/services/sharing';
import type { Schedule } from '@/types/schedule';
import dayjs from '@/utils/dayjs';

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
      <Typography
        variant="body-sm"
        className="font-semibold"
        style={{ color: '#fff' }}
      >
        {label}
      </Typography>
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

  const queryClient = useQueryClient();
  const upcomingQueryKey = selectedPet?.id
    ? queryKeys.schedules.upcoming(selectedPet.id)
    : ['schedules', 'upcoming', 'disabled'] as const;

  const {
    data: upcomingSchedules = [],
    isPending,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: upcomingQueryKey,
    queryFn: () => getUpcomingSchedules(selectedPet!.id),
    enabled: !!selectedPet?.id,
    staleTime: 30 * 1000,
  });

  const isScheduleLoading = isPending && !!selectedPet?.id;
  const scheduleError = queryError ? '일정을 불러오지 못했습니다' : null;

  const { getCategoryMeta } = useCategoryContext();
  const { activities, isLoading: isActivityLoading } = useActivityFeed(selectedPet?.id, 5);
  const isShared = selectedPet && 'isShared' in selectedPet;

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCompleteSchedule = useCallback(
    async (schedule: Schedule) => {
      if (!user) return;
      const scheduleDate = schedule.start_date.split('T')[0];
      // Optimistic: remove from list immediately
      queryClient.setQueryData<Schedule[]>(upcomingQueryKey, (prev) =>
        prev?.filter(s => s.id !== schedule.id)
      );
      try {
        await completeSchedule(schedule.id, scheduleDate, user.uid);
        // 캘린더 월간 데이터 + 활동 피드 무효화
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.activityFeed.byPet(selectedPet!.id) });
      } catch {
        // Rollback on failure
        queryClient.setQueryData<Schedule[]>(upcomingQueryKey, (prev) =>
          prev
            ? [...prev, schedule].sort((a, b) => a.start_date.localeCompare(b.start_date))
            : [schedule]
        );
      }
    },
    [user, queryClient, upcomingQueryKey]
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
            className="flex-row items-center gap-3 w-fit mr-3"
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
            <Typography className="font-semibold" variant="body-lg">
              {selectedPet?.name ?? '반려동물을 등록해주세요'}
            </Typography>
            <ChevronDown size={12} color={colors.mutedForeground} />
          </Pressable>

          <View className="flex-row items-center gap-1">
            {/* TODO: 원격 알림(Phase 2) 구현 시 알림 내역 화면과 함께 활성화
            <Pressable
              className="w-11 h-11 rounded-full items-center justify-center"
              accessibilityLabel="알림"
              accessibilityRole="button"
              onPress={() => router.push('/notifications')}
            >
              <Bell size={20} color={colors.foreground} />
            </Pressable>
            */}
            <Pressable
              className="w-11 h-11 rounded-full items-center justify-center"
              accessibilityLabel={
                isDark ? '라이트 모드로 전환' : '다크 모드로 전환'
              }
              accessibilityRole="button"
              onPress={toggleColorScheme}
            >
              {isDark ? (
                <Sun size={20} color={colors.foreground} />
              ) : (
                <Moon size={20} color={colors.foreground} />
              )}
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
            {isScheduleLoading && !refreshing ? (
              <HomeScheduleSkeleton />
            ) : scheduleError ? (
              <Pressable onPress={() => refetch()}>
                <Card>
                  <CardContent>
                    <View className="items-center py-4 gap-2">
                      <AlertCircle size={24} color={colors.error} />
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
            ) : !isLoggedIn ||
              !selectedPet ||
              upcomingSchedules.length === 0 ? (
              <Card>
                <CardContent>
                  <View className="items-center py-4 gap-2">
                    <Calendar size={24} color={colors.mutedForeground} />
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

          {/* 최근 활동 */}
          {isLoggedIn && selectedPet && activities.length > 0 && (
            <View className="gap-1">
              <View className="flex-row items-center justify-between">
                <Typography variant="body-xl" className="font-semibold">
                  최근 활동
                </Typography>
                <Pressable
                  onPress={() => router.push('/activity-feed')}
                  accessibilityLabel="활동 기록 전체 보기"
                  accessibilityRole="button"
                >
                  <Typography variant="body-sm" style={{ color: colors.primary }}>
                    전체 보기
                  </Typography>
                </Pressable>
              </View>
              <Card>
                <CardContent className="py-2">
                  {activities.map((item, index) => {
                    const category = getCategoryMeta(item.category_id);
                    const time = dayjs(item.completed_at).format('HH:mm');
                    return (
                      <Pressable
                        key={item.id}
                        className={`flex-row items-center py-2.5 gap-3 ${
                          index < activities.length - 1 ? 'border-b border-border' : ''
                        }`}
                        onPress={() =>
                          router.push({
                            pathname: '/schedule-detail',
                            params: { id: item.schedule_id },
                          })
                        }
                      >
                        <View
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <Typography className="flex-1" variant="body-sm" numberOfLines={1}>
                          {item.schedule_title}
                        </Typography>
                        {isShared && (
                          <Typography variant="caption" className="text-muted-foreground">
                            {item.completed_by_nickname}
                          </Typography>
                        )}
                        <Typography variant="caption" className="text-muted-foreground">
                          {time}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </CardContent>
              </Card>
            </View>
          )}
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
    </Screen>
  );
}
