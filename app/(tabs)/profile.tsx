import { View, ScrollView } from "react-native";
import { Typography, Card, CardHeader, CardTitle, CardContent, Button } from "theo-kit-native";

export default function ProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 gap-4">
        <Typography className="text-2xl font-bold">프로필</Typography>

        <Card>
          <CardHeader>
            <CardTitle>설정</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              <Button variant="outline">알림 설정</Button>
              <Button variant="outline">앱 정보</Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
