import { useState } from "react";
import { Alert, Image, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import { Screen } from "@/components/ui/Screen";
import { validateNickname, getFirebaseErrorMessage } from "@/utils/validation";

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, updateProfile } = useAuth();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [nickname, setNickname] = useState(userProfile?.nickname ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nicknameError, setNicknameError] = useState("");

  const handleSave = async () => {
    setError("");
    setNicknameError("");

    const result = validateNickname(nickname);
    if (!result.isValid) {
      setNicknameError(result.error!);
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ nickname: nickname.trim() });
      router.back();
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err?.code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-4 gap-6">
          {/* 프로필 이미지 */}
          <View className="items-center gap-3 py-4">
            {userProfile?.profile_image ? (
              <Image
                source={{ uri: userProfile.profile_image }}
                className="w-24 h-24 rounded-full bg-surface"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-surface items-center justify-center">
                <FontAwesome
                  name="user"
                  size={40}
                  color={colors.mutedForeground}
                />
              </View>
            )}
            <Button
              variant="ghost"
              size="small"
              onPress={() => {
                Alert.alert("안내", "프로필 사진 변경은 준비중입니다.");
              }}
            >
              사진 변경
            </Button>
          </View>

          {/* 에러 메시지 */}
          {error ? (
            <View className="bg-red-50 dark:bg-red-950 border border-error rounded-xl px-4 py-3">
              <Typography className="text-error text-center" variant="body-sm">
                {error}
              </Typography>
            </View>
          ) : null}

          {/* 닉네임 입력 */}
          <Input
            label="닉네임"
            placeholder="2~20자 닉네임을 입력하세요"
            value={nickname}
            onChangeText={(text) => {
              setNickname(text);
              if (nicknameError) setNicknameError("");
            }}
            error={!!nicknameError}
            errorMessage={nicknameError}
          />

          {/* 이메일 (읽기 전용) */}
          <View className="gap-1.5">
            <Typography className="font-medium text-foreground">
              이메일
            </Typography>
            <View className="border border-border rounded-xl px-4 py-3 bg-surface">
              <Typography className="text-muted-foreground">
                {userProfile?.email ?? ""}
              </Typography>
            </View>
          </View>

          {/* 저장 버튼 */}
          <Button onPress={handleSave} loading={loading}>
            저장
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}
