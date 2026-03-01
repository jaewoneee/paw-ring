import { View, ScrollView } from "react-native";
import {
  Typography,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "theo-kit-native";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileScreen() {
  const { user, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // 로그아웃 실패 시 무시 (거의 발생하지 않음)
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 gap-4">
        <Typography className="text-2xl font-bold">프로필</Typography>

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
  );
}
