import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import TabBar from "@/components/ui/TabBar";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size ?? 24} style={{ marginBottom: -3 }} {...props} />;
}

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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color, size }) => <TabBarIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "캘린더",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="calendar" color={color} size={size} />
          ),
        }}
        listeners={requireAuth}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: "마이",
          tabBarIcon: ({ color, size }) => <TabBarIcon name="user" color={color} size={size} />,
        }}
        listeners={requireAuth}
      />
    </Tabs>
  );
}
