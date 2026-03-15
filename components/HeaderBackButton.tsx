import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable } from "react-native";

export function HeaderBackButton() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      style={{
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ChevronLeft size={24} color={colors.foreground} />
    </Pressable>
  );
}
