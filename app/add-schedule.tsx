import FontAwesome from "@expo/vector-icons/FontAwesome";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Switch } from "@/components/ui/Switch";
import { Typography } from "@/components/ui/Typography";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { CATEGORIES, CATEGORY_META, REMINDER_OPTIONS } from "@/constants/Schedule";
import { usePets } from "@/contexts/PetContext";
import { useAuth } from "@/hooks/useAuth";
import { createSchedule } from "@/services/schedule";
import type { ReminderType, ScheduleCategory } from "@/types/schedule";
import { formatDate } from "@/utils/date";

export default function AddScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { user } = useAuth();
  const { selectedPet } = usePets();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const initialDate = params.date ? dayjs(params.date).toDate() : new Date();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ScheduleCategory>("other");
  const [date, setDate] = useState<Date>(initialDate);
  const [time, setTime] = useState<Date>(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [reminder, setReminder] = useState<ReminderType>("none");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(initialDate);
  const [tempTime, setTempTime] = useState(new Date());

  const handleDateChange = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === "android") {
      if (d) setDate(d);
      setShowDatePicker(false);
    } else if (d) {
      setTempDate(d);
    }
  };

  const handleTimeChange = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === "android") {
      if (d) setTime(d);
      setShowTimePicker(false);
    } else if (d) {
      setTempTime(d);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "제목을 입력해주세요";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user || !selectedPet) return;

    setSubmitting(true);
    try {
      // start_date 조합: 날짜 + 시간
      const startDate = isAllDay
        ? dayjs(date).startOf("day").toISOString()
        : dayjs(date)
            .hour(time.getHours())
            .minute(time.getMinutes())
            .second(0)
            .toISOString();

      await createSchedule({
        pet_id: selectedPet.id,
        owner_id: user.uid,
        title: title.trim(),
        category,
        memo: memo.trim() || undefined,
        start_date: startDate,
        is_all_day: isAllDay,
        reminder,
      });

      router.back();
    } catch (err) {
      console.error("[AddSchedule] failed:", err);
      Alert.alert("오류", "일정 추가에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <CardContent>
            <View className="gap-5">
              {/* 제목 */}
              <Input
                label="제목"
                placeholder="일정 제목을 입력하세요"
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  if (errors.title) setErrors((p) => ({ ...p, title: "" }));
                }}
                error={!!errors.title}
                errorMessage={errors.title}
              />

              {/* 카테고리 */}
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.foreground,
                  }}
                >
                  카테고리
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const isActive = category === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className="flex-row items-center gap-1.5 px-3 py-2 rounded-full border"
                        style={{
                          borderColor: isActive ? meta.color : colors.border,
                          backgroundColor: isActive ? meta.color + "15" : "transparent",
                        }}
                      >
                        <FontAwesome
                          name={meta.icon as any}
                          size={12}
                          color={isActive ? meta.color : colors.mutedForeground}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            color: isActive ? meta.color : colors.mutedForeground,
                            fontWeight: isActive ? "600" : "400",
                          }}
                        >
                          {meta.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 날짜 */}
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.foreground,
                  }}
                >
                  날짜
                </Text>
                <Pressable
                  onPress={() => {
                    setTempDate(date);
                    setShowDatePicker(true);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ fontSize: 16, color: colors.foreground }}>
                    {formatDate(date)}
                  </Text>
                </Pressable>
              </View>

              {/* 종일 토글 */}
              <View className="flex-row items-center justify-between">
                <Typography variant="body-md">종일</Typography>
                <Switch value={isAllDay} onValueChange={setIsAllDay} />
              </View>

              {/* 시간 (종일이 아닐 때) */}
              {!isAllDay && (
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: colors.foreground,
                    }}
                  >
                    시간
                  </Text>
                  <Pressable
                    onPress={() => {
                      setTempTime(time);
                      setShowTimePicker(true);
                    }}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceElevated,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <Text style={{ fontSize: 16, color: colors.foreground }}>
                      {dayjs(time).format("HH:mm")}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* 알림 */}
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.foreground,
                  }}
                >
                  알림
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {REMINDER_OPTIONS.map((opt) => {
                    const isActive = reminder === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setReminder(opt.value)}
                        className="px-3 py-2 rounded-full border"
                        style={{
                          borderColor: isActive ? colors.primary : colors.border,
                          backgroundColor: isActive ? colors.primary + "15" : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: isActive ? colors.primary : colors.mutedForeground,
                            fontWeight: isActive ? "600" : "400",
                          }}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 메모 */}
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.foreground,
                  }}
                >
                  메모
                </Text>
                <TextInput
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="메모를 입력하세요 (선택)"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: colors.foreground,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                />
              </View>

              <Button onPress={handleSubmit} loading={submitting}>
                저장
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* 날짜 피커 */}
        <BottomSheet
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
        >
          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.foreground,
                textAlign: "center",
              }}
            >
              날짜 선택
            </Text>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              themeVariant={colorScheme === "dark" ? "dark" : "light"}
              locale="ko-KR"
              style={{ alignSelf: "center", width: "100%" }}
            />
            <Button
              onPress={() => {
                setDate(tempDate);
                setShowDatePicker(false);
              }}
            >
              확인
            </Button>
          </View>
        </BottomSheet>

        {/* 시간 피커 */}
        <BottomSheet
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
        >
          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.foreground,
                textAlign: "center",
              }}
            >
              시간 선택
            </Text>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              themeVariant={colorScheme === "dark" ? "dark" : "light"}
              locale="ko-KR"
              style={{ alignSelf: "center", width: "100%" }}
            />
            <Button
              onPress={() => {
                setTime(tempTime);
                setShowTimePicker(false);
              }}
            >
              확인
            </Button>
          </View>
        </BottomSheet>
      </ScrollView>
    </Screen>
  );
}
