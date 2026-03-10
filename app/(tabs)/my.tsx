import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { Typography } from "@/components/ui/Typography";
import { Screen } from "@/components/ui/Screen";
import { getFirebaseErrorMessage } from "@/utils/validation";

// ─── 로컬 MenuItem 컴포넌트 ───

interface MenuItemProps {
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
}

function MenuItem({
  label,
  onPress,
  rightElement,
  showChevron = false,
  destructive = false,
}: MenuItemProps) {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Pressable
      className="flex-row items-center justify-between py-3.5 px-4"
      onPress={onPress}
    >
      <Typography
        className={destructive ? "text-error" : ""}
      >
        {label}
      </Typography>
      {rightElement ??
        (showChevron && (
          <FontAwesome
            name="chevron-right"
            size={14}
            color={colors.mutedForeground}
          />
        ))}
    </Pressable>
  );
}

function Separator() {
  return <View className="h-px bg-border mx-4" />;
}

// ─── 메인 화면 ───

export default function MyScreen() {
  const router = useRouter();
  const { user, userProfile, logout, updateProfile, deleteAccount } =
    useAuth();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [notificationEnabled, setNotificationEnabled] = useState(
    userProfile?.notification_enabled ?? true
  );
  const [deleting, setDeleting] = useState(false);
  const [pendingGoogleDelete, setPendingGoogleDelete] = useState(false);
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  // ─── 구글 재인증 (회원 탈퇴용) ───
  const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId;
  const googleRedirectUri = googleIosClientId
    ? `${googleIosClientId.split(".").reverse().join(".")}:/oauthredirect`
    : "";
  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
  };
  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleIosClientId ?? "",
      redirectUri: googleRedirectUri,
      scopes: ["openid", "profile", "email"],
      responseType: "code",
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    if (!pendingGoogleDelete || googleResponse?.type !== "success") return;
    const code = googleResponse.params?.code;
    if (!code || !googleRequest?.codeVerifier || !googleRedirectUri) return;

    setPendingGoogleDelete(false);
    setDeleting(true);

    AuthSession.exchangeCodeAsync(
      {
        clientId: googleIosClientId!,
        code,
        redirectUri: googleRedirectUri,
        extraParams: { code_verifier: googleRequest.codeVerifier },
      },
      discovery
    )
      .then((tokenResponse) => {
        const idToken = tokenResponse.idToken;
        if (!idToken) throw new Error("ID Token을 받지 못했습니다.");
        return deleteAccount({ type: "google", idToken });
      })
      .catch((err: any) => {
        const code = err?.code ?? "";
        Alert.alert("탈퇴 실패", getFirebaseErrorMessage(code));
      })
      .finally(() => setDeleting(false));
  }, [googleResponse, pendingGoogleDelete, googleRequest, googleRedirectUri, deleteAccount]);

  // ─── 알림 토글 ───
  const handleToggleNotification = async (value: boolean) => {
    setNotificationEnabled(value);
    try {
      await updateProfile({ notification_enabled: value });
    } catch {
      setNotificationEnabled(!value);
    }
  };

  // ─── 로그아웃 ───
  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("정말 로그아웃하시겠습니까?")) {
        logout();
      }
      return;
    }

    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch {
            // 로그아웃 실패 시 무시
          }
        },
      },
    ]);
  };

  // ─── 회원 탈퇴 ───
  const handleDeleteAccount = () => {
    if (Platform.OS === "web") {
      // 웹은 네이티브 앱 전용이므로 간단 처리
      return;
    }

    Alert.alert(
      "회원 탈퇴",
      "모든 데이터가 삭제되며 복구할 수 없습니다.\n정말 탈퇴하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴하기",
          style: "destructive",
          onPress: () => {
            if (userProfile?.provider === "email") {
              promptPasswordForDeletion();
            } else {
              setPendingGoogleDelete(true);
              googlePromptAsync();
            }
          },
        },
      ]
    );
  };

  const promptPasswordForDeletion = () => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "비밀번호 확인",
        "보안을 위해 비밀번호를 입력해주세요.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "탈퇴하기",
            style: "destructive",
            onPress: (password?: string) => {
              if (password) {
                performDeleteAccount(password);
              }
            },
          },
        ],
        "secure-text"
      );
    } else {
      // Android: Alert.prompt 미지원 → 간단한 모달 대체
      setShowPasswordModal(true);
    }
  };

  const performDeleteAccount = async (password: string) => {
    setDeleting(true);
    try {
      await deleteAccount({ type: "email", password });
    } catch (err: any) {
      const code = err?.code ?? "";
      const message = getFirebaseErrorMessage(code);
      Alert.alert("탈퇴 실패", message);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Android 비밀번호 입력 모달 상태 ───
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  return (
    <Screen edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-4 gap-4">
          <Typography variant="h2">마이</Typography>

          {/* 프로필 섹션 */}
          <Card>
            <Pressable
              className="flex-row items-center px-4 py-4 gap-3"
              onPress={() => router.push("/settings/profile")}
            >
              {userProfile?.profile_image ? (
                <Image
                  source={{ uri: userProfile.profile_image! }}
                  className="w-14 h-14 rounded-full bg-surface"
                />
              ) : (
                <View className="w-14 h-14 rounded-full bg-surface items-center justify-center">
                  <FontAwesome
                    name="user"
                    size={24}
                    color={colors.mutedForeground}
                  />
                </View>
              )}
              <View className="flex-1">
                <Typography className="font-semibold text-lg">
                  {userProfile?.nickname ?? "사용자"}
                </Typography>
                <Typography className="text-muted-foreground" variant="body-sm">
                  {user?.email ?? ""}
                </Typography>
              </View>
              <FontAwesome
                name="chevron-right"
                size={14}
                color={colors.mutedForeground}
              />
            </Pressable>
          </Card>

          {/* 알림 섹션 */}
          <View className="gap-2">
            <Typography variant="body-sm" className="text-muted-foreground ml-1">
              알림
            </Typography>
            <Card>
              <MenuItem
                label="전체 알림"
                rightElement={
                  <Switch
                    value={notificationEnabled}
                    onValueChange={handleToggleNotification}
                  />
                }
              />
            </Card>
          </View>

          {/* 계정 섹션 */}
          <View className="gap-2">
            <Typography variant="body-sm" className="text-muted-foreground ml-1">
              계정
            </Typography>
            <Card>
              {userProfile?.provider === "email" && (
                <>
                  <MenuItem
                    label="비밀번호 변경"
                    showChevron
                    onPress={() => router.push("/settings/change-password")}
                  />
                  <Separator />
                </>
              )}
              <MenuItem
                label="로그아웃"
                destructive
                onPress={handleLogout}
              />
              <Separator />
              <MenuItem
                label="회원 탈퇴"
                destructive
                onPress={handleDeleteAccount}
              />
            </Card>
          </View>

          {/* DEV: 초대 테스트 */}
          {__DEV__ && (
            <View className="gap-2">
              <Typography variant="body-sm" className="text-muted-foreground ml-1">
                개발 테스트
              </Typography>
              <Card>
                <MenuItem
                  label="초대 수락 테스트"
                  showChevron
                  onPress={() => {
                    Alert.prompt(
                      "초대 테스트",
                      "invite ID를 입력하세요",
                      [
                        { text: "취소", style: "cancel" },
                        {
                          text: "이동",
                          onPress: (id?: string) => {
                            if (id?.trim()) {
                              router.push({
                                pathname: "/invite/[inviteId]",
                                params: { inviteId: id.trim() },
                              });
                            }
                          },
                        },
                      ],
                      "plain-text"
                    );
                  }}
                />
              </Card>
            </View>
          )}

          {/* 정보 섹션 */}
          <View className="gap-2">
            <Typography variant="body-sm" className="text-muted-foreground ml-1">
              정보
            </Typography>
            <Card>
              <MenuItem
                label="이용약관"
                showChevron
                onPress={() => {
                  Alert.alert("안내", "이용약관은 준비중입니다.");
                }}
              />
              <Separator />
              <MenuItem
                label="개인정보 처리방침"
                showChevron
                onPress={() => {
                  Alert.alert("안내", "개인정보 처리방침은 준비중입니다.");
                }}
              />
              <Separator />
              <MenuItem
                label="오픈소스 라이선스"
                showChevron
                onPress={() => {
                  Alert.alert("안내", "오픈소스 라이선스는 준비중입니다.");
                }}
              />
              <Separator />
              <MenuItem
                label="앱 버전"
                rightElement={
                  <Typography className="text-muted-foreground" variant="body-sm">
                    v{appVersion}
                  </Typography>
                }
              />
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Android 비밀번호 입력 모달 (Alert.prompt 대체) */}
      {showPasswordModal && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="bg-background rounded-2xl p-6 mx-8 gap-4 w-80">
            <Typography className="font-semibold text-lg">
              비밀번호 확인
            </Typography>
            <Typography className="text-muted-foreground" variant="body-sm">
              보안을 위해 비밀번호를 입력해주세요.
            </Typography>
            <TextInput
              className="font-sans border border-border rounded-xl px-4 py-3 text-base text-foreground bg-surface-elevated"
              placeholder="비밀번호"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              autoCapitalize="none"
            />
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 py-3 rounded-xl border border-border items-center"
                onPress={() => {
                  setShowPasswordModal(false);
                  setDeletePassword("");
                }}
              >
                <Typography>취소</Typography>
              </Pressable>
              <Pressable
                className="flex-1 py-3 rounded-xl bg-error items-center"
                onPress={() => {
                  setShowPasswordModal(false);
                  if (deletePassword) {
                    performDeleteAccount(deletePassword);
                  }
                  setDeletePassword("");
                }}
              >
                <Typography className="text-white font-semibold">
                  탈퇴하기
                </Typography>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}
