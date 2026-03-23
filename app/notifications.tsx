import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Select } from '@/components/ui/Select';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationHistory } from '@/hooks/useNotificationHistory';
import { seedNotifications } from '@/scripts/seedNotifications';
import type { AppNotification, NotificationType } from '@/types/notification';
import dayjs, {
  formatDateLabel,
  formatISODate,
  formatRelativeTime,
} from '@/utils/dayjs';

const TYPE_ICONS: Record<string, string> = {
  schedule_reminder: '🔔',
  share_invite: '👥',
  share_accepted: '🤝',
};

type FilterType = 'all' | NotificationType;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'schedule_reminder', label: '스케줄' },
  { key: 'share_invite', label: '공유 초대' },
  { key: 'share_accepted', label: '공유 수락' },
];

function groupByDate(items: AppNotification[]) {
  const groups: { date: string; label: string; items: AppNotification[] }[] =
    [];

  for (const item of items) {
    const date = formatISODate(dayjs(item.created_at));
    const last = groups[groups.length - 1];
    if (last && last.date === date) {
      last.items.push(item);
    } else {
      groups.push({
        date,
        label: formatDateLabel(item.created_at),
        items: [item],
      });
    }
  }

  return groups;
}

function navigateToNotification(
  router: ReturnType<typeof useRouter>,
  notification: AppNotification
) {
  const { type, data } = notification;

  switch (type) {
    case 'schedule_reminder':
      if (data.scheduleId) {
        router.push({
          pathname: '/schedule-detail',
          params: {
            id: data.scheduleId as string,
            ...(data.occurrenceDate
              ? { occurrenceDate: data.occurrenceDate as string }
              : {}),
          },
        });
      }
      break;
    case 'share_invite':
      if (data.inviteId) {
        router.push({
          pathname: '/invite/[inviteId]',
          params: { inviteId: data.inviteId as string },
        });
      }
      break;
    case 'share_accepted':
      // 캘린더 탭으로 이동
      router.push('/(tabs)/calendar');
      break;
  }
}

export default function NotificationsScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const {
    notifications,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useNotificationHistory();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const hasUnread = notifications.some(n => !n.is_read);
  const filtered = useMemo(
    () =>
      filter === 'all'
        ? notifications
        : notifications.filter(n => n.type === filter),
    [notifications, filter]
  );
  const groups = groupByDate(filtered);

  type FlatItem =
    | { type: 'header'; date: string; label: string }
    | { type: 'item'; data: AppNotification };

  const flatData: FlatItem[] = [];
  for (const group of groups) {
    flatData.push({ type: 'header', date: group.date, label: group.label });
    for (const item of group.items) {
      flatData.push({ type: 'item', data: item });
    }
  }

  const renderItem = ({ item }: { item: FlatItem }) => {
    if (item.type === 'header') {
      return (
        <View className="px-4 pt-5 pb-2">
          <Typography
            variant="h3"
            className="text-muted-foreground font-semibold"
          >
            {item.label}
          </Typography>
        </View>
      );
    }

    const { data } = item;
    const icon = TYPE_ICONS[data.type] ?? '🔔';

    return (
      <Pressable
        className="flex-row items-start px-4 py-3 gap-3"
        style={!data.is_read ? { backgroundColor: colors.surface } : undefined}
        onPress={() => {
          if (!data.is_read) markAsRead(data.id);
          navigateToNotification(router, data);
        }}
      >
        <Typography variant="body-lg" className="mt-0.5">
          {icon}
        </Typography>
        <View className="flex-1 gap-0.5">
          <Typography
            variant="body-xl"
            className={!data.is_read ? 'font-semibold' : ''}
          >
            {data.title}
          </Typography>
          {data.body && (
            <Typography variant="body-md" className="text-muted-foreground">
              {data.body}
            </Typography>
          )}
          <Typography variant="body-md" className="text-muted-foreground">
            {formatRelativeTime(data.created_at)}
          </Typography>
        </View>
        {!data.is_read && (
          <View
            className="w-2 h-2 rounded-full mt-2"
            style={{ backgroundColor: colors.primary }}
          />
        )}
      </Pressable>
    );
  };

  return (
    <Screen>
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Select options={FILTERS} value={filter} onChange={setFilter} />

        <View className="flex-row items-center gap-3">
          {__DEV__ && (
            <Pressable
              onPress={async () => {
                if (!user) return;
                await seedNotifications(user.uid);
                refetch();
              }}
            >
              <Typography
                variant="body-sm"
                style={{ color: colors.mutedForeground }}
              >
                [DEV] 더미
              </Typography>
            </Pressable>
          )}
          {hasUnread && (
            <Pressable onPress={markAllAsRead}>
              <Typography variant="body-sm" style={{ color: colors.primary }}>
                전체 읽음
              </Typography>
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Typography className="text-muted-foreground">
            불러오는 중...
          </Typography>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-2">
          <Typography className="text-muted-foreground">{error}</Typography>
          <Pressable onPress={() => refetch()}>
            <Typography style={{ color: colors.primary }}>다시 시도</Typography>
          </Pressable>
        </View>
      ) : flatData.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <Typography className="text-4xl">🔔</Typography>
          <Typography className="text-muted-foreground text-center">
            {filter === 'all' ? '아직 알림이 없어요' : '해당 알림이 없어요'}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={flatData}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `h-${item.date}` : `i-${item.data.id}`
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </Screen>
  );
}
