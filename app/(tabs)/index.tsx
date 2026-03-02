import { View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { useAuth } from "@/hooks/useAuth";

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const isLoggedIn = !!user;

  const greeting = userProfile?.nickname
    ? `${userProfile.nickname}님, 안녕하세요!`
    : "안녕하세요!";

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 gap-5">
        {/* 인사말 */}
        <View className="gap-1">
          <Typography className="text-2xl font-bold">{greeting}</Typography>
          <Typography className="text-gray-500">
            오늘도 반려동물과 함께하세요
          </Typography>
        </View>

        {/* 로그인 안내 카드 (비로그인 시) */}
        {!isLoggedIn && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="items-center gap-3 py-5">
              <FontAwesome name="paw" size={32} color="#d97706" />
              <Typography className="text-base font-semibold text-center">
                로그인하고{"\n"}내 반려동물을 등록해보세요!
              </Typography>
              <View className="flex-row gap-3 mt-1">
                <Button
                  onPress={() => router.push("/(auth)/login")}
                  className="flex-1"
                >
                  로그인
                </Button>
                <Button
                  variant="outline"
                  onPress={() => router.push("/(auth)/register")}
                  className="flex-1"
                >
                  회원가입
                </Button>
              </View>
            </CardContent>
          </Card>
        )}

        {/* 다가오는 일정 */}
        <View className="gap-2">
          <Typography className="text-lg font-semibold">
            다가오는 일정
          </Typography>
          <Card>
            <CardContent>
              {isLoggedIn ? (
                <View className="items-center py-4 gap-2">
                  <FontAwesome name="calendar" size={24} color="#9ca3af" />
                  <Typography className="text-gray-400 text-sm text-center">
                    등록된 일정이 없어요{"\n"}일정을 추가해보세요
                  </Typography>
                </View>
              ) : (
                <View className="items-center py-4 gap-2">
                  <FontAwesome name="calendar" size={24} color="#d1d5db" />
                  <Typography className="text-gray-400 text-sm text-center">
                    로그인 후 일정을 확인할 수 있어요
                  </Typography>
                </View>
              )}
            </CardContent>
          </Card>
        </View>

        {/* 내 반려동물 */}
        <View className="gap-2">
          <Typography className="text-lg font-semibold">
            내 반려동물
          </Typography>
          {isLoggedIn ? (
            <Card>
              <CardContent>
                <View className="items-center py-4 gap-3">
                  <FontAwesome name="paw" size={24} color="#9ca3af" />
                  <Typography className="text-gray-400 text-sm text-center">
                    아직 등록된 반려동물이 없어요
                  </Typography>
                  <Button
                    variant="outline"
                    onPress={() => router.push("/modal")}
                  >
                    반려동물 등록하기
                  </Button>
                </View>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <View className="items-center py-4 gap-2">
                  <FontAwesome name="paw" size={24} color="#d1d5db" />
                  <Typography className="text-gray-400 text-sm text-center">
                    로그인 후 반려동물을 등록할 수 있어요
                  </Typography>
                </View>
              </CardContent>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
