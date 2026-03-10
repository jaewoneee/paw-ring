import React from "react";
import { Tabs, useRouter } from "expo-router";
import { Home, Calendar, User } from "lucide-react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import TabBar from "@/components/ui/TabBar";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  const router = useRouter();

  const requireAuth = {
    tabPress: (e: { preventDefault: () => void }) => {
      if (!user) {
        e.preventDefault();
        router.push("/(auth)/login");
      }
    },
  };

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme === "dark" ? "dark" : "light"].primary,
        tabBarStyle: { position: "absolute" },
        headerShown: false,
        animation: "fade",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "캘린더",
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size ?? 24} />,
        }}
        listeners={requireAuth}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: "마이",
          tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 24} />,
        }}
        listeners={requireAuth}
      />
    </Tabs>
  );
}
