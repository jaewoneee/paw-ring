import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent } from "@/components/ui/Card";

export default function CalendarScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          <Typography className="text-2xl font-bold">캘린더</Typography>

          <Card>
            <CardContent>
              <View className="items-center py-8 gap-3">
                <FontAwesome name="calendar" size={32} color="#9ca3af" />
                <Typography className="text-gray-400 text-sm text-center">
                  반려동물을 등록하면{"\n"}일정을 관리할 수 있어요
                </Typography>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
