import { View, ScrollView } from "react-native";
import { Typography } from "@/components/ui/Typography";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function AddPetScreen() {
  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
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
    </ScrollView>
  );
}
