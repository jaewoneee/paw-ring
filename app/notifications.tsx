import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useNotificationHistory } from "@/hooks/useNotificationHistory";
import type { AppNotification, NotificationType } from "@/types/notification";
import dayjs, { formatISODate } from "@/utils/dayjs";

const TYPE_ICONS: Record<string, string> = {
  schedule_reminder: "🔔",
  share_invite: "👥",
  share_accepted: "🤝",
};

type FilterType = "all" | NotificationType;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "schedule_reminder", label: "스케줄" },
  { key: "share_invite", label: "공유 초대" },
  { key: "share_accepted", label: "공유 수락" },
];

function formatTimeLabel(dateStr: string): string {
  const now = dayjs();
  const date = dayjs(dateStr);
  const diffMin = now.diff(date, "minute");

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = now.diff(date, "hour");
  if (diffHour < 24) return `${diffHour}시간 전`;

  return date.format("M월 D일");
}

function formatDateLabel(dateStr: string): string {
  const today = formatISODate(dayjs());
  const yesterday = formatISODate(dayjs().subtract(1, "day"));
  const date = formatISODate(dayjs(dateStr));

  if (date === today) return "오늘";
  if (date === yesterday) return "어제";
  return dayjs(dateStr).format("M월 D일 (dd)");
}

function groupByDate(items: AppNotification[]) {
  const groups: { date: string; label: string; items: AppNotification[] }[] = [];

  for (const item of items) {
    const date = formatISODate(dayjs(item.created_at));
    const last = groups[groups.length - 1];
    if (last && last.date === date) {
      last.items.push(item);
    } else {
      groups.push({ date, label: formatDateLabel(item.created_at), items: [item] });
    }
  }

  return groups;
}

function navigateToNotification(
  router: ReturnType<typeof useRouter>,
  notification: AppNotification,
) {
  const { type, data } = notification;

  switch (type) {
    case "schedule_reminder":
      if (data.scheduleId) {
        router.push({
          pathname: "/schedule-detail",
          params: {
            id: data.scheduleId as string,
            ...(data.occurrenceDate ? { occurrenceDate: data.occurrenceDate as string } : {}),
          },
        });
      }
      break;
    case "share_invite":
      if (data.inviteId) {
        router.push({
          pathname: "/invite/[inviteId]",
          params: { inviteId: data.inviteId as string },
        });
      }
      break;
    case "share_accepted":
      // 캘린더 탭으로 이동
      router.push("/(tabs)/calendar");
      break;
  }
}

export default function NotificationsScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const router = useRouter();
  const { notifications, isLoading, error, refetch, markAsRead, markAllAsRead } =
    useNotificationHistory();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const hasUnread = notifications.some((n) => !n.is_read);
  const filtered = useMemo(
    () => filter === "all" ? notifications : notifications.filter((n) => n.type === filter),
    [notifications, filter],
  );
  const groups = groupByDate(filtered);

  type FlatItem =
    | { type: "header"; date: string; label: string }
    | { type: "item"; data: AppNotification };

  const flatData: FlatItem[] = [];
  for (const group of groups) {
    flatData.push({ type: "header", date: group.date, label: group.label });
    for (const item of group.items) {
      flatData.push({ type: "item", data: item });
    }
  }

  const renderItem = ({ item }: { item: FlatItem }) => {
    if (item.type === "header") {
      return (
        <View className="px-4 pt-5 pb-2">
          <Typography variant="body-sm" className="text-muted-foreground font-semibold">
            {item.label}
          </Typography>
        </View>
      );
    }

    const { data } = item;
    const icon = TYPE_ICONS[data.type] ?? "🔔";

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
            variant="body-md"
            className={!data.is_read ? "font-semibold" : ""}
          >
            {data.title}
          </Typography>
          {data.body && (
            <Typography variant="body-sm" className="text-muted-foreground">
              {data.body}
            </Typography>
          )}
          <Typography variant="small" className="text-muted-foreground">
            {formatTimeLabel(data.created_at)}
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
        <Typography variant="h3">알림</Typography>
        {hasUnread && (
          <Pressable onPress={markAllAsRead}>
            <Typography variant="body-sm" style={{ color: colors.primary }}>
              전체 읽음
            </Typography>
          </Pressable>
        )}
      </View>

      {/* 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        className="pb-2"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className="rounded-full px-3 py-1.5"
              style={{
                backgroundColor: active ? colors.primary : colors.surface,
              }}
            >
              <Typography
                variant="body-sm"
                className="font-medium"
                style={{ color: active ? "#fff" : colors.mutedForeground }}
              >
                {f.label}
              </Typography>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Typography className="text-muted-foreground">불러오는 중...</Typography>
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
            {filter === "all" ? "아직 알림이 없어요" : "해당 알림이 없어요"}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={flatData}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.type === "header" ? `h-${item.date}` : `i-${item.data.id}`
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </Screen>
  );
}
