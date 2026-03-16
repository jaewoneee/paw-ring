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
} from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { StackedScheduleList } from '@/components/calendar/StackedScheduleList';
import { HomeScheduleSkeleton } from '@/components/ui/Skeleton';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { queryKeys } from '@/hooks/queryKeys';
import { completeSchedule, getUpcomingSchedules } from '@/services/schedule';
import type { Schedule } from '@/types/schedule';
import dayjs from '@/utils/dayjs';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { selectedPet } = usePets();
  const { colorScheme } = useColorScheme();
  const isLoggedIn = !!user;
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

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

  const greeting = userProfile?.nickname
    ? `${userProfile.nickname}님, 안녕하세요!`
    : '안녕하세요!';

  return (
    <Screen>
      <AppHeader />

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
    </Screen>
  );
}
