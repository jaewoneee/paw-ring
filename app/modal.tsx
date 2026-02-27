import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { Typography, Input, Button, Card, CardContent } from "theo-kit-native";

export default function AddPetModal() {
  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Card>
        <CardContent>
          <View className="gap-4">
            <Typography className="text-lg font-semibold">
              반려동물 정보를 입력하세요
            </Typography>
            <Input placeholder="이름" />
            <Input placeholder="종류 (예: 골든 리트리버)" />
            <Input placeholder="나이" keyboardType="numeric" />
            <Button>등록하기</Button>
          </View>
        </CardContent>
      </Card>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}
