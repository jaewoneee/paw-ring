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
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { StackedScheduleList } from '@/components/calendar/StackedScheduleList';
import { HomeScheduleSkeleton } from '@/components/ui/Skeleton';

import { queryKeys } from '@/hooks/queryKeys';
import { completeSchedule, getWeekScheduleInstances, uncompleteSchedule } from '@/services/schedule';
import type { ScheduleInstance } from '@/types/schedule';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { selectedPet } = usePets();
  const { colorScheme } = useColorScheme();
  const isLoggedIn = !!user;
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const queryClient = useQueryClient();
  const weekQueryKey = selectedPet?.id
    ? queryKeys.schedules.weekInstances(selectedPet.id)
    : ['schedules', 'week-instances', 'disabled'] as const;

  const {
    data: weekInstances = [],
    isPending,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: weekQueryKey,
    queryFn: () => getWeekScheduleInstances(selectedPet!.id),
    enabled: !!selectedPet?.id,
    staleTime: 30 * 1000,
  });

  const isScheduleLoading = isPending && !!selectedPet?.id;
  const scheduleError = queryError ? '일정을 불러오지 못했습니다' : null;

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCompleteSchedule = useCallback(
    async (instance: ScheduleInstance) => {
      if (!user) return;
      const { schedule, occurrenceDate, completionStatus } = instance;
      const wasCompleted = completionStatus === 'completed';
      const newStatus = wasCompleted ? null : ('completed' as const);

      // 낙관적 업데이트
      queryClient.setQueryData<ScheduleInstance[]>(weekQueryKey, (prev) =>
        prev?.map(inst =>
          inst.schedule.id === schedule.id && inst.occurrenceDate === occurrenceDate
            ? { ...inst, completionStatus: newStatus }
            : inst
        )
      );

      try {
        if (wasCompleted) {
          await uncompleteSchedule(schedule.id, occurrenceDate);
        } else {
          await completeSchedule(schedule.id, occurrenceDate, user.uid);
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
        if (selectedPet?.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.activityFeed.byPet(selectedPet.id) });
        }
      } catch {
        // 실패 시 롤백
        queryClient.setQueryData<ScheduleInstance[]>(weekQueryKey, (prev) =>
          prev?.map(inst =>
            inst.schedule.id === schedule.id && inst.occurrenceDate === occurrenceDate
              ? { ...inst, completionStatus: completionStatus ?? null }
              : inst
          )
        );
        Alert.alert('오류', '완료 상태 변경에 실패했습니다.');
      }
    },
    [user, queryClient, weekQueryKey, selectedPet?.id]
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

          {/* 이번 주 일정 */}
          <View className="gap-1">
            <Typography variant="body-xl" className="font-semibold">
              이번 주 일정
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
              weekInstances.length === 0 ? (
              <Card>
                <CardContent>
                  <View className="items-center py-4 gap-2">
                    <Calendar size={24} color={colors.mutedForeground} />
                    <Typography
                      variant="body-sm"
                      className="text-muted-foreground text-center"
                    >
                      {isLoggedIn
                        ? '이번 주 등록된 일정이 없어요\n일정을 추가해보세요'
                        : '로그인 후 일정을 확인할 수 있어요'}
                    </Typography>
                  </View>
                </CardContent>
              </Card>
            ) : (
              <StackedScheduleList
                instances={weekInstances}
                onPressSchedule={inst =>
                  router.push({
                    pathname: '/schedule-detail',
                    params: { id: inst.schedule.id },
                  })
                }
                onCompleteSchedule={handleCompleteSchedule}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
