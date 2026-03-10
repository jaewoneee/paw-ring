import { useState } from "react";
import { ActionSheetIOS, Alert, Image, Platform, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera, User } from 'lucide-react-native';

import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import { Screen } from "@/components/ui/Screen";
import { validateNickname, getFirebaseErrorMessage } from "@/utils/validation";
import {
  uploadUserProfileImage,
  deleteUserProfileImage,
} from "@/services/user";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, updateProfile } = useAuth();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [nickname, setNickname] = useState(userProfile?.nickname ?? "");
  const [profileImage, setProfileImage] = useState<string | null>(
    userProfile?.profile_image ?? null
  );
  const [imageChanged, setImageChanged] = useState(false);
  const [imageDeleted, setImageDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nicknameError, setNicknameError] = useState("");

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      setImageChanged(true);
      setImageDeleted(false);
    }
  };

  const handleDeleteImage = () => {
    setProfileImage(null);
    setImageChanged(true);
    setImageDeleted(true);
  };

  const handleChangePhoto = () => {
    const hasImage = !!profileImage;

    if (Platform.OS === "ios") {
      const options = hasImage
        ? ["사진 선택", "사진 삭제", "취소"]
        : ["사진 선택", "취소"];
      const cancelIndex = hasImage ? 2 : 1;
      const destructiveIndex = hasImage ? 1 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
        (index) => {
          if (index === 0) handlePickImage();
          else if (hasImage && index === 1) handleDeleteImage();
        }
      );
    } else {
      // Android
      if (hasImage) {
        Alert.alert("프로필 사진", undefined, [
          { text: "사진 선택", onPress: handlePickImage },
          { text: "사진 삭제", style: "destructive", onPress: handleDeleteImage },
          { text: "취소", style: "cancel" },
        ]);
      } else {
        handlePickImage();
      }
    }
  };

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
      let newImageUrl: string | null = userProfile?.profile_image ?? null;

      if (imageChanged) {
        // 기존 이미지 Storage에서 삭제
        if (userProfile?.profile_image) {
          try {
            await deleteUserProfileImage(userProfile.profile_image);
          } catch {
            // 기존 이미지 삭제 실패는 무시
          }
        }

        if (imageDeleted) {
          newImageUrl = null;
        } else if (profileImage) {
          newImageUrl = await uploadUserProfileImage(user!.uid, profileImage);
        }
      }

      await updateProfile({
        nickname: nickname.trim(),
        profile_image: newImageUrl,
      });
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
          <View className="items-center py-4">
            <Pressable onPress={handleChangePhoto}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-24 h-24 rounded-full bg-surface"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-surface items-center justify-center">
                  <User size={40} color={colors.mutedForeground} />
                </View>
              )}
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-background">
                <Camera size={14} color="#fff" />
              </View>
            </Pressable>
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
