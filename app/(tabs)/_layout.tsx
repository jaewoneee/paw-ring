import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useAuth } from "@/hooks/useAuth";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
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
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme === "dark" ? "dark" : "light"].tint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "건강",
          tabBarIcon: ({ color }) => <TabBarIcon name="heart" color={color} />,
        }}
        listeners={requireAuth}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: "다이어리",
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
        listeners={requireAuth}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarIcon: ({ color }) => <TabBarIcon name="paw" color={color} />,
        }}
        listeners={requireAuth}
      />
    </Tabs>
  );
}
