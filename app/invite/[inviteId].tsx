import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Typography } from "@/components/ui/Typography";
import { getInviteById, acceptInviteLink } from "@/services/invite";
import type { InviteWithDetails } from "@/types/sharing";

export default function InviteAcceptScreen() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [invite, setInvite] = useState<InviteWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!inviteId) return;
    (async () => {
      try {
        const data = await getInviteById(inviteId);
        if (!data) {
          setError("존재하지 않는 초대입니다");
        } else if (new Date(data.expires_at) < new Date()) {
          setError("초대가 만료되었습니다. 소유자에게 새 초대를 요청해주세요");
        } else {
          setInvite(data);
        }
      } catch {
        setError("초대 정보를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [inviteId]);

  const handleAccept = async () => {
    if (!inviteId || !user) return;
    setAcceptLoading(true);
    try {
      await acceptInviteLink(inviteId, user.uid);
      Alert.alert("수락 완료", `${invite?.pet.name} 캘린더에 참여했습니다!`, [
        { text: "확인", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (err: any) {
      Alert.alert("오류", err?.message ?? "수락에 실패했습니다");
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleReject = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center p-6 gap-4">
          <FontAwesome name="warning" size={48} color={colors.mutedForeground} />
          <Typography className="text-muted-foreground text-center text-lg">
            {error}
          </Typography>
          <Button variant="outline" onPress={() => router.replace("/(tabs)")}>
            홈으로 돌아가기
          </Button>
        </View>
      </Screen>
    );
  }

  const roleLabel = invite?.role === "editor" ? "편집 가능" : "열람만";

  return (
    <Screen>
      <View className="flex-1 items-center justify-center p-6 gap-6">
        {/* 반려동물 이미지 */}
        {invite?.pet.profile_image ? (
          <Image
            source={{ uri: invite.pet.profile_image }}
            className="w-24 h-24 rounded-full bg-surface"
          />
        ) : (
          <View className="w-24 h-24 rounded-full bg-surface items-center justify-center">
            <FontAwesome name="paw" size={40} color={colors.primary} />
          </View>
        )}

        {/* 초대 메시지 */}
        <View className="items-center gap-2">
          <Text className="text-xl font-semibold text-foreground text-center">
            {invite?.owner.nickname}님이
          </Text>
          <Text className="text-xl font-semibold text-foreground text-center">
            {invite?.pet.name}의 캘린더에
          </Text>
          <Text className="text-xl font-semibold text-foreground text-center">
            초대했습니다
          </Text>
        </View>

        {/* 권한 표시 */}
        <View className="bg-surface px-4 py-2 rounded-full">
          <Text className="text-muted-foreground">
            권한: {roleLabel}
          </Text>
        </View>

        {/* 버튼 */}
        <View className="w-full gap-3 mt-4">
          <Button onPress={handleAccept} loading={acceptLoading}>
            수락하기
          </Button>
          <Button variant="outline" onPress={handleReject}>
            거절하기
          </Button>
        </View>
      </View>
    </Screen>
  );
}
