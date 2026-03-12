import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { usePets } from "@/contexts/PetContext";
import { useCategoryContext } from "@/contexts/CategoryContext";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import dayjs, { formatISODate } from "@/utils/dayjs";
import type { ActivityFeedItem } from "@/types/schedule";

/** 날짜를 "오늘" / "어제" / "M월 D일 (요일)" 로 포맷 */
function formatDateLabel(dateStr: string): string {
  const today = formatISODate(dayjs());
  const yesterday = formatISODate(dayjs().subtract(1, "day"));

  if (dateStr === today) return "오늘";
  if (dateStr === yesterday) return "어제";
  return dayjs(dateStr).format("M월 D일 (dd)");
}

/** 활동 피드 아이템을 날짜별로 그룹핑 */
function groupByDate(items: ActivityFeedItem[]) {
  const groups: { date: string; label: string; items: ActivityFeedItem[] }[] = [];

  for (const item of items) {
    const date = item.completion_date;
    const last = groups[groups.length - 1];
    if (last && last.date === date) {
      last.items.push(item);
    } else {
      groups.push({ date, label: formatDateLabel(date), items: [item] });
    }
  }

  return groups;
}

export default function ActivityFeedScreen() {
  const router = useRouter();
  const { selectedPet } = usePets();
  const { getCategoryMeta } = useCategoryContext();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const isShared = selectedPet && "isShared" in selectedPet;
  const { activities, isLoading, error, refetch } = useActivityFeed(selectedPet?.id);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const groups = groupByDate(activities);

  // FlatList용 데이터: 날짜 헤더 + 아이템을 플랫하게
  type FlatItem =
    | { type: "header"; date: string; label: string }
    | { type: "item"; data: ActivityFeedItem };

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
    const category = getCategoryMeta(data.category_id);
    const time = dayjs(data.completed_at).format("HH:mm");

    return (
      <Pressable
        className="flex-row items-center px-4 py-3 gap-3"
        onPress={() =>
          router.push({
            pathname: "/schedule-detail",
            params: { id: data.schedule_id },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`${data.schedule_title} ${time} 완료`}
      >
        {/* 카테고리 색상 도트 */}
        <View
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />

        {/* 제목 */}
        <Typography className="flex-1" variant="body-md" numberOfLines={1}>
          {data.schedule_title}
        </Typography>

        {/* 완료자 (공유 캘린더인 경우) */}
        {isShared && (
          <Typography variant="body-sm" className="text-muted-foreground">
            {data.completed_by_nickname}
          </Typography>
        )}

        {/* 완료 시각 */}
        <Typography variant="body-sm" className="text-muted-foreground">
          {time}
        </Typography>
      </Pressable>
    );
  };

  return (
    <Screen>
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
          <Typography className="text-muted-foreground text-center">
            아직 완료된 활동이 없어요{"\n"}스케줄을 완료하면 여기에 기록돼요
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
