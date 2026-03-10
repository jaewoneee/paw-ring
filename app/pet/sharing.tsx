import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { User, X } from 'lucide-react-native';

import { useAuth } from "@/hooks/useAuth";
import { useCalendarMembers } from "@/hooks/useCalendarMembers";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent } from "@/components/ui/Card";
import { updateMemberRole, removeShare } from "@/services/sharing";
import { createInviteLink } from "@/services/invite";
import type { ShareRole, CalendarShareWithDetails } from "@/types/sharing";

export default function SharingScreen() {
  const { petId, petName } = useLocalSearchParams<{
    petId: string;
    petName: string;
  }>();
  const { user, userProfile } = useAuth();
  const { members, isLoading, refresh } = useCalendarMembers(petId);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [linkLoading, setLinkLoading] = useState(false);

  const acceptedMembers = members.filter((m) => m.status === "accepted");
  const pendingMembers = members.filter((m) => m.status === "pending");

  const handleChangeRole = (member: CalendarShareWithDetails) => {
    const newRole: ShareRole = member.role === "viewer" ? "editor" : "viewer";
    const roleLabel = newRole === "editor" ? "편집 가능" : "열람만";

    Alert.alert(
      "권한 변경",
      `${member.shared_user.nickname}님의 권한을 "${roleLabel}"(으)로 변경할까요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "변경",
          onPress: async () => {
            try {
              await updateMemberRole(member.id, newRole);
              refresh();
            } catch {
              Alert.alert("오류", "권한 변경에 실패했습니다");
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member: CalendarShareWithDetails) => {
    Alert.alert(
      "멤버 내보내기",
      `${member.shared_user.nickname}님을 내보내시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "내보내기",
          style: "destructive",
          onPress: async () => {
            try {
              await removeShare(member.id);
              refresh();
            } catch {
              Alert.alert("오류", "멤버 내보내기에 실패했습니다");
            }
          },
        },
      ]
    );
  };

  const handleShareLink = async () => {
    if (!petId || !user) return;
    setLinkLoading(true);
    try {
      const invite = await createInviteLink(petId, user.uid);
      const link = `pawring://invite/${invite.id}`;
      await Share.share({
        message: `${petName ?? "반려동물"} 캘린더에 초대합니다!\n${link}`,
      });
    } catch {
      Alert.alert("오류", "초대 링크 생성에 실패했습니다");
    } finally {
      setLinkLoading(false);
    }
  };

  const renderMemberRow = (
    member: CalendarShareWithDetails,
    isPending = false
  ) => {
    const roleLabel =
      member.role === "editor" ? "편집" : "열람";

    return (
      <View
        key={member.id}
        className="flex-row items-center py-3 px-1"
      >
        {/* 프로필 이미지 */}
        {member.shared_user.profile_image ? (
          <Image
            source={{ uri: member.shared_user.profile_image }}
            className="w-10 h-10 rounded-full bg-surface"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-surface items-center justify-center">
            <User size={18} color={colors.mutedForeground} />
          </View>
        )}

        {/* 이름 + 상태 */}
        <View className="flex-1 ml-3">
          <Text className="text-base font-medium text-foreground">
            {member.shared_user.nickname}
          </Text>
          {isPending ? (
            <Text className="text-sm text-warning">대기중</Text>
          ) : null}
        </View>

        {/* 권한 변경 버튼 */}
        <Pressable
          onPress={() => handleChangeRole(member)}
          className="px-3 py-1.5 rounded-lg bg-surface mr-2"
        >
          <Text className="text-sm text-muted-foreground">{roleLabel}</Text>
        </Pressable>

        {/* 내보내기 버튼 */}
        <Pressable onPress={() => handleRemoveMember(member)}>
          <X size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
    );
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="p-4 gap-6">
          {/* 소유자 */}
          <View>
            <Typography variant="body-sm" className="text-muted-foreground mb-2 ml-1">
              소유자
            </Typography>
            <Card>
              <CardContent>
                <View className="flex-row items-center">
                  {userProfile?.profile_image ? (
                    <Image
                      source={{ uri: userProfile.profile_image }}
                      className="w-10 h-10 rounded-full bg-surface"
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-surface items-center justify-center">
                      <User size={18} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-medium text-foreground">
                      {userProfile?.nickname ?? "나"}
                    </Text>
                  </View>
                  <Text className="text-sm text-primary font-medium">
                    소유자
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* 멤버 목록 */}
          <View>
            <Typography variant="body-sm" className="text-muted-foreground mb-2 ml-1">
              멤버 ({acceptedMembers.length + pendingMembers.length})
            </Typography>
            {isLoading ? (
              <ActivityIndicator className="py-8" />
            ) : acceptedMembers.length === 0 && pendingMembers.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography className="text-muted-foreground text-center py-4">
                    아직 공유된 멤버가 없습니다
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  {acceptedMembers.map((m) => renderMemberRow(m))}
                  {pendingMembers.map((m) => renderMemberRow(m, true))}
                </CardContent>
              </Card>
            )}
          </View>

          {/* 초대 버튼 */}
          <Button
            onPress={handleShareLink}
            loading={linkLoading}
          >
            초대 링크 공유
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}
