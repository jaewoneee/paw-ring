import FontAwesome from "@expo/vector-icons/FontAwesome";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/ui/Text";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Switch } from "@/components/ui/Switch";
import { Typography } from "@/components/ui/Typography";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  CATEGORIES,
  CATEGORY_META,
  DAY_OF_WEEK_OPTIONS,
  RECURRENCE_END_OPTIONS,
  RECURRENCE_FREQUENCY_OPTIONS,
  REMINDER_OPTIONS,
} from "@/constants/Schedule";
import { getScheduleById, updateSchedule } from "@/services/schedule";
import type {
  RecurrenceFrequency,
  ReminderType,
  Schedule,
  ScheduleCategory,
} from "@/types/schedule";
import { formatDate } from "@/utils/date";
import { buildRRule, parseRRule } from "@/utils/rrule";

export default function EditScheduleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ScheduleCategory>("other");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [reminder, setReminder] = useState<ReminderType>("none");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // End date
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempEndDate, setTempEndDate] = useState<Date>(new Date());

  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState<RecurrenceFrequency>("daily");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [recurrenceEndType, setRecurrenceEndType] = useState<"never" | "date">(
    "never"
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date>(
    dayjs().add(1, "month").toDate()
  );
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] =
    useState(false);
  const [tempRecurrenceEndDate, setTempRecurrenceEndDate] = useState<Date>(
    dayjs().add(1, "month").toDate()
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  const fetchSchedule = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getScheduleById(id);
      setSchedule(data);
      setTitle(data.title);
      setCategory(data.category);
      setDate(dayjs(data.start_date).toDate());
      setTime(dayjs(data.start_date).toDate());
      setIsAllDay(data.is_all_day);
      setReminder(data.reminder);
      setMemo(data.memo ?? "");

      // Restore end date
      if (data.end_date) {
        setEndDate(dayjs(data.end_date).toDate());
      }

      // Restore recurrence
      if (data.is_recurring && data.rrule) {
        setIsRecurring(true);
        const parsed = parseRRule(data.rrule);
        setRecurrenceFrequency(parsed.frequency);
        setSelectedDays(parsed.selectedDays);

        if (data.recurrence_end_date) {
          setRecurrenceEndType("date");
          setRecurrenceEndDate(dayjs(data.recurrence_end_date).toDate());
        } else {
          setRecurrenceEndType("never");
        }
      }
    } catch (err) {
      console.error("[EditSchedule] fetch failed:", err);
      Alert.alert("오류", "일정을 불러올 수 없습니다.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

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

  const handleEndDateChange = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === "android") {
      if (d) setEndDate(d);
      setShowEndDatePicker(false);
    } else if (d) {
      setTempEndDate(d);
    }
  };

  const handleRecurrenceEndDateChange = (
    _: DateTimePickerEvent,
    d?: Date
  ) => {
    if (Platform.OS === "android") {
      if (d) setRecurrenceEndDate(d);
      setShowRecurrenceEndDatePicker(false);
    } else if (d) {
      setTempRecurrenceEndDate(d);
    }
  };

  const toggleDayOfWeek = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "제목을 입력해주세요";
    if (endDate && dayjs(endDate).isBefore(dayjs(date), "day")) {
      newErrors.endDate = "종료 날짜는 시작 날짜 이후여야 합니다";
    }
    if (
      isRecurring &&
      recurrenceEndType === "date" &&
      dayjs(recurrenceEndDate).isBefore(dayjs(date), "day")
    ) {
      newErrors.recurrenceEndDate =
        "반복 종료일은 시작 날짜 이후여야 합니다";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !id) return;

    setSubmitting(true);
    try {
      const startDate = isAllDay
        ? dayjs(date).startOf("day").toISOString()
        : dayjs(date)
            .hour(time.getHours())
            .minute(time.getMinutes())
            .second(0)
            .toISOString();

      const computedEndDate = endDate
        ? isAllDay
          ? dayjs(endDate).endOf("day").toISOString()
          : dayjs(endDate)
              .hour(time.getHours())
              .minute(time.getMinutes())
              .second(0)
              .toISOString()
        : null;

      const rrule = isRecurring
        ? buildRRule({
            frequency: recurrenceFrequency,
            selectedDays:
              recurrenceFrequency === "weekly" ? selectedDays : undefined,
            endDate:
              recurrenceEndType === "date"
                ? dayjs(recurrenceEndDate).endOf("day").toISOString()
                : undefined,
          })
        : null;

      await updateSchedule(id, {
        title: title.trim(),
        category,
        memo: memo.trim() || null,
        start_date: startDate,
        end_date: computedEndDate,
        is_all_day: isAllDay,
        reminder,
        is_recurring: isRecurring,
        rrule,
        recurrence_end_date:
          isRecurring && recurrenceEndType === "date"
            ? dayjs(recurrenceEndDate).endOf("day").toISOString()
            : null,
      });

      router.back();
    } catch (err) {
      console.error("[EditSchedule] update failed:", err);
      Alert.alert("오류", "일정 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Typography className="text-muted-foreground">로딩 중...</Typography>
        </View>
      </Screen>
    );
  }

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
                          backgroundColor: isActive
                            ? meta.color + "15"
                            : "transparent",
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
                            color: isActive
                              ? meta.color
                              : colors.mutedForeground,
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

              {/* 시작 날짜 */}
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.foreground,
                  }}
                >
                  시작 날짜
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

              {/* 종료 날짜 */}
              <View style={{ gap: 6 }}>
                <View className="flex-row items-center justify-between">
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: colors.foreground,
                    }}
                  >
                    종료 날짜
                  </Text>
                  <Pressable
                    onPress={() =>
                      setEndDate(
                        endDate
                          ? null
                          : dayjs(date).add(1, "day").toDate()
                      )
                    }
                  >
                    <Text style={{ fontSize: 13, color: colors.primary }}>
                      {endDate ? "제거" : "추가"}
                    </Text>
                  </Pressable>
                </View>
                {endDate && (
                  <Pressable
                    onPress={() => {
                      setTempEndDate(endDate);
                      setShowEndDatePicker(true);
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
                      {formatDate(endDate)}
                    </Text>
                  </Pressable>
                )}
                {errors.endDate && (
                  <Text style={{ fontSize: 12, color: "#EF4444" }}>
                    {errors.endDate}
                  </Text>
                )}
              </View>

              {/* 종일 토글 */}
              <View className="flex-row items-center justify-between">
                <Typography variant="body-md">종일</Typography>
                <Switch value={isAllDay} onValueChange={setIsAllDay} />
              </View>

              {/* 시간 */}
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

              {/* 반복 토글 */}
              <View className="flex-row items-center justify-between">
                <Typography variant="body-md">반복</Typography>
                <Switch
                  value={isRecurring}
                  onValueChange={(v) => {
                    setIsRecurring(v);
                    if (!v) {
                      setRecurrenceFrequency("daily");
                      setSelectedDays([]);
                      setRecurrenceEndType("never");
                    }
                  }}
                />
              </View>

              {/* 반복 주기 */}
              {isRecurring && (
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: colors.foreground,
                    }}
                  >
                    반복 주기
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {RECURRENCE_FREQUENCY_OPTIONS.map((opt) => {
                      const isActive = recurrenceFrequency === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => {
                            setRecurrenceFrequency(opt.value);
                            if (opt.value !== "weekly") setSelectedDays([]);
                          }}
                          className="px-3 py-2 rounded-full border"
                          style={{
                            borderColor: isActive
                              ? colors.primary
                              : colors.border,
                            backgroundColor: isActive
                              ? colors.primary + "15"
                              : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
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
              )}

              {/* 요일 선택 (매주일 때) */}
              {isRecurring && recurrenceFrequency === "weekly" && (
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: colors.foreground,
                    }}
                  >
                    요일 선택
                  </Text>
                  <View className="flex-row gap-2">
                    {DAY_OF_WEEK_OPTIONS.map((day) => {
                      const isActive = selectedDays.includes(day.value);
                      return (
                        <Pressable
                          key={day.value}
                          onPress={() => toggleDayOfWeek(day.value)}
                          className="w-9 h-9 rounded-full items-center justify-center border"
                          style={{
                            borderColor: isActive
                              ? colors.primary
                              : colors.border,
                            backgroundColor: isActive
                              ? colors.primary + "15"
                              : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
                              fontWeight: isActive ? "600" : "400",
                            }}
                          >
                            {day.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 반복 종료 */}
              {isRecurring && (
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: colors.foreground,
                    }}
                  >
                    반복 종료
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {RECURRENCE_END_OPTIONS.map((opt) => {
                      const isActive = recurrenceEndType === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => setRecurrenceEndType(opt.value)}
                          className="px-3 py-2 rounded-full border"
                          style={{
                            borderColor: isActive
                              ? colors.primary
                              : colors.border,
                            backgroundColor: isActive
                              ? colors.primary + "15"
                              : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
                              fontWeight: isActive ? "600" : "400",
                            }}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {recurrenceEndType === "date" && (
                    <Pressable
                      onPress={() => {
                        setTempRecurrenceEndDate(recurrenceEndDate);
                        setShowRecurrenceEndDatePicker(true);
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceElevated,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        marginTop: 4,
                      }}
                    >
                      <Text
                        style={{ fontSize: 16, color: colors.foreground }}
                      >
                        {formatDate(recurrenceEndDate)}
                      </Text>
                    </Pressable>
                  )}
                  {errors.recurrenceEndDate && (
                    <Text style={{ fontSize: 12, color: "#EF4444" }}>
                      {errors.recurrenceEndDate}
                    </Text>
                  )}
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
                          borderColor: isActive
                            ? colors.primary
                            : colors.border,
                          backgroundColor: isActive
                            ? colors.primary + "15"
                            : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: isActive
                              ? colors.primary
                              : colors.mutedForeground,
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
                    fontFamily: "Pretendard",
                    color: colors.foreground,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                />
              </View>

              <Button onPress={handleSubmit} loading={submitting}>
                수정 완료
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* 시작 날짜 피커 */}
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
              시작 날짜 선택
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

        {/* 종료 날짜 피커 */}
        <BottomSheet
          visible={showEndDatePicker}
          onClose={() => setShowEndDatePicker(false)}
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
              종료 날짜 선택
            </Text>
            <DateTimePicker
              value={tempEndDate}
              mode="date"
              display="spinner"
              onChange={handleEndDateChange}
              minimumDate={date}
              themeVariant={colorScheme === "dark" ? "dark" : "light"}
              locale="ko-KR"
              style={{ alignSelf: "center", width: "100%" }}
            />
            <Button
              onPress={() => {
                setEndDate(tempEndDate);
                setShowEndDatePicker(false);
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

        {/* 반복 종료 날짜 피커 */}
        <BottomSheet
          visible={showRecurrenceEndDatePicker}
          onClose={() => setShowRecurrenceEndDatePicker(false)}
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
              반복 종료 날짜 선택
            </Text>
            <DateTimePicker
              value={tempRecurrenceEndDate}
              mode="date"
              display="spinner"
              onChange={handleRecurrenceEndDateChange}
              minimumDate={date}
              themeVariant={colorScheme === "dark" ? "dark" : "light"}
              locale="ko-KR"
              style={{ alignSelf: "center", width: "100%" }}
            />
            <Button
              onPress={() => {
                setRecurrenceEndDate(tempRecurrenceEndDate);
                setShowRecurrenceEndDatePicker(false);
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
