import { View, ScrollView } from "react-native";
import { Typography, Card, CardHeader, CardTitle, CardContent } from "theo-kit-native";

export default function HealthScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 gap-4">
        <Typography className="text-2xl font-bold">건강 기록</Typography>

        <Card>
          <CardHeader>
            <CardTitle>건강 체크</CardTitle>
          </CardHeader>
          <CardContent>
            <Typography className="text-gray-500">
              반려동물을 먼저 등록해주세요.
            </Typography>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
