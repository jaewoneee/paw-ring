import { useAuth } from "@/hooks/useAuth";
import { Alert, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

export default function MyScreen() {
  const { user, userProfile, logout } = useAuth();

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
            // 로그아웃 실패 시 무시 (거의 발생하지 않음)
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
        <Typography className="text-2xl font-bold">마이</Typography>

        <Card>
          <CardHeader>
            <CardTitle>{userProfile?.nickname ?? "사용자"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Typography className="text-gray-500">
              {user?.email ?? ""}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>설정</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              <Button variant="outline">알림 설정</Button>
              <Button variant="outline">앱 정보</Button>
              <Button variant="outline" onPress={handleLogout}>
                로그아웃
              </Button>
            </View>
          </CardContent>
        </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
