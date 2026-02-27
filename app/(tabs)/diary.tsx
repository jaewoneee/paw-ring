import { View, ScrollView } from "react-native";
import { Typography, Card, CardHeader, CardTitle, CardContent } from "theo-kit-native";

export default function DiaryScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 gap-4">
        <Typography className="text-2xl font-bold">다이어리</Typography>

        <Card>
          <CardHeader>
            <CardTitle>오늘의 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <Typography className="text-gray-500">
              반려동물의 일상을 기록해보세요.
            </Typography>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
