import { View, ScrollView } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function CalendarScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Screen>
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          <Typography variant="h2">캘린더</Typography>

          <Card>
            <CardContent>
              <View className="items-center py-8 gap-3">
                <FontAwesome name="calendar" size={32} color={colors.mutedForeground} />
                <Typography variant="body-sm" className="text-muted-foreground text-center">
                  반려동물을 등록하면{"\n"}일정을 관리할 수 있어요
                </Typography>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
