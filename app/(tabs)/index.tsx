import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Typography,
} from "theo-kit-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 gap-4">
        <Typography className="text-2xl font-bold">내 반려동물</Typography>

        <Card>
          <CardHeader>
            <CardTitle>아직 등록된 반려동물이 없어요</CardTitle>
          </CardHeader>
          <CardContent>
            <Typography className="text-gray-500">
              반려동물을 등록하고 건강 관리를 시작하세요.
            </Typography>
          </CardContent>
        </Card>

        <Button onPress={() => router.push("/modal")}>
          반려동물 등록하기
        </Button>
      </View>
    </ScrollView>
  );
}
