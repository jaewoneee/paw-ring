import dayjs, { formatTime12, toLocalISOString } from '@/utils/dayjs';
import { CategoryIcon } from '@/utils/categoryIcon';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Switch } from '@/components/ui/Switch';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  ALL_DAY_REMINDER_OPTIONS,
  DAY_OF_WEEK_OPTIONS,
  RECURRENCE_END_OPTIONS,
  RECURRENCE_FREQUENCY_OPTIONS,
  TIMED_REMINDER_OPTIONS,
} from '@/constants/Schedule';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { usePets } from '@/contexts/PetContext';
import { useAuth } from '@/hooks/useAuth';
import { createSchedule } from '@/services/schedule';
import type {
  RecurrenceFrequency,
  ReminderType,
} from '@/types/schedule';
import { formatDate } from '@/utils/date';
import { buildRRule } from '@/utils/rrule';

export default function AddScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { user } = useAuth();
  const { selectedPet } = usePets();
  const { categories } = useCategoryContext();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const initialDate = params.date ? dayjs(params.date).toDate() : new Date();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(() => categories[0]?.id ?? '');

  // 카테고리 로드 후 기본값 설정
  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0].id);
    }
  }, [categories, category]);
  const [date, setDate] = useState<Date>(initialDate);
  const [time, setTime] = useState<Date>(new Date());
  const [isAllDay, setIsAllDay] = useState(true);
  const [reminder, setReminder] = useState<ReminderType>('none');
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCompletable, setIsCompletable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // End date
  const [endDate, setEndDate] = useState<Date>(initialDate);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempEndDate, setTempEndDate] = useState<Date>(initialDate);

  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState<RecurrenceFrequency>('daily');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'date'>(
    'never'
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date>(
    dayjs().add(1, 'month').toDate()
  );
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] =
    useState(false);
  const [tempRecurrenceEndDate, setTempRecurrenceEndDate] = useState<Date>(
    dayjs().add(1, 'month').toDate()
  );

  const [endTime, setEndTime] = useState<Date>(dayjs().add(1, 'hour').toDate());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(initialDate);
  const [tempTime, setTempTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(
    dayjs().add(1, 'hour').toDate()
  );

  const handleDateChange = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') {
      if (d) setDate(d);
      setShowDatePicker(false);
    } else if (d) {
      setTempDate(d);
    }
  };

  const handleStartTimeChange = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') {
      if (d) setTime(d);
      setShowStartTimePicker(false);
    } else if (d) {
      setTempTime(d);
    }
  };

  const handleEndTimeChange = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') {
      if (d) setEndTime(d);
      setShowEndTimePicker(false);
    } else if (d) {
      setTempEndTime(d);
    }
  };

  const handleEndDateChange = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') {
      if (d) setEndDate(d);
      setShowEndDatePicker(false);
    } else if (d) {
      setTempEndDate(d);
    }
  };

  const handleRecurrenceEndDateChange = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') {
      if (d) setRecurrenceEndDate(d);
      setShowRecurrenceEndDatePicker(false);
    } else if (d) {
      setTempRecurrenceEndDate(d);
    }
  };

  const toggleDayOfWeek = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = '제목을 입력해주세요';
    if (dayjs(endDate).isBefore(dayjs(date), 'day')) {
      newErrors.endDate = '종료 날짜는 시작 날짜 이후여야 합니다';
    }
    if (
      isRecurring &&
      recurrenceEndType === 'date' &&
      dayjs(recurrenceEndDate).isBefore(dayjs(date), 'day')
    ) {
      newErrors.recurrenceEndDate = '반복 종료일은 시작 날짜 이후여야 합니다';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user || !selectedPet) return;

    setSubmitting(true);
    try {
      const startDate = isAllDay
        ? toLocalISOString(dayjs(date).startOf('day'))
        : toLocalISOString(
            dayjs(date)
              .hour(time.getHours())
              .minute(time.getMinutes())
              .second(0)
          );

      const computedEndDate = isAllDay
        ? toLocalISOString(dayjs(endDate).endOf('day'))
        : toLocalISOString(
            dayjs(endDate)
              .hour(endTime.getHours())
              .minute(endTime.getMinutes())
              .second(0)
          );

      const rrule = isRecurring
        ? buildRRule({
            frequency: recurrenceFrequency,
            selectedDays:
              recurrenceFrequency === 'weekly' ? selectedDays : undefined,
            endDate:
              recurrenceEndType === 'date'
                ? toLocalISOString(dayjs(recurrenceEndDate).endOf('day'))
                : undefined,
          })
        : undefined;

      await createSchedule({
        pet_id: selectedPet.id,
        owner_id: user.uid,
        title: title.trim(),
        category,
        memo: memo.trim() || undefined,
        start_date: startDate,
        end_date: computedEndDate,
        is_all_day: isAllDay,
        is_completable: isCompletable,
        reminder,
        is_recurring: isRecurring || undefined,
        rrule,
        recurrence_end_date:
          isRecurring && recurrenceEndType === 'date'
            ? toLocalISOString(dayjs(recurrenceEndDate).endOf('day'))
            : undefined,
      });

      router.back();
    } catch (err) {
      console.error('[AddSchedule] failed:', err);
      Alert.alert('오류', '일정 추가에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBlock: 8,
          gap: 16,
          borderWidth: 0,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Card style={{ borderWidth: 0 }}>
          <CardContent>
            <View className="gap-5">
              {/* 제목 */}
              <Input
                label="제목"
                placeholder="일정 제목을 입력하세요"
                value={title}
                onChangeText={t => {
                  setTitle(t);
                  if (errors.title) setErrors(p => ({ ...p, title: '' }));
                }}
                error={!!errors.title}
                errorMessage={errors.title}
              />

              {/* 카테고리 */}
              <View style={{ gap: 6 }}>
                <Typography variant="body-sm" className="font-medium">카테고리</Typography>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map(cat => {
                    const isActive = category === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setCategory(cat.id)}
                        className="flex-row items-center gap-1.5 px-3 py-2 rounded-full border"
                        style={{
                          borderColor: isActive ? cat.color : colors.border,
                          backgroundColor: isActive
                            ? cat.color + '15'
                            : 'transparent',
                        }}
                      >
                        <CategoryIcon
                          name={cat.icon}
                          size={12}
                          color={isActive ? cat.color : colors.mutedForeground}
                        />
                        <Typography
                          variant="caption"
                          style={{
                            color: isActive
                              ? cat.color
                              : colors.mutedForeground,
                            fontWeight: isActive ? '600' : '400',
                          }}
                        >
                          {cat.name}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* ── 날짜/시간 ── */}
              <View className="border-b border-border" />

              {/* 시작 날짜 */}
              <View style={{ gap: 6 }}>
                <Typography variant="body-sm" className="font-medium">시작 날짜</Typography>
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
                  <Typography>{formatDate(date)}</Typography>
                </Pressable>
              </View>

              {/* 종료 날짜 (반복 일정이 아닐 때만 표시) */}
              {!isRecurring && (
              <View style={{ gap: 6 }}>
                <Typography variant="body-sm" className="font-medium">종료 날짜</Typography>
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
                  <Typography>{formatDate(endDate)}</Typography>
                </Pressable>
                {errors.endDate && (
                  <Typography variant="small" style={{ color: '#EF4444' }}>
                    {errors.endDate}
                  </Typography>
                )}
              </View>
              )}

              {/* 종일 토글 */}
              <View className="flex-row items-center justify-between">
                <Typography variant="body-md">종일</Typography>
                <Switch
                  value={isAllDay}
                  onValueChange={v => {
                    setIsAllDay(v);
                    setReminder('none');
                  }}
                />
              </View>

              {/* 시작 시간 / 종료 시간 (종일이 아닐 때) */}
              {!isAllDay && (
                <View style={{ gap: 6 }}>
                  <Typography variant="body-sm" className="font-medium">시간</Typography>
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => {
                        setTempTime(time);
                        setShowStartTimePicker(true);
                      }}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceElevated,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                      }}
                    >
                      <Typography variant="small" className="text-muted-foreground" style={{ marginBottom: 2 }}>시작</Typography>
                      <Typography>{formatTime12(time)}</Typography>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setTempEndTime(endTime);
                        setShowEndTimePicker(true);
                      }}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceElevated,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                      }}
                    >
                      <Typography variant="small" className="text-muted-foreground" style={{ marginBottom: 2 }}>종료</Typography>
                      <Typography>{formatTime12(endTime)}</Typography>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ── 반복 ── */}
              <View className="border-b border-border" />

              {/* 반복 토글 */}
              <View className="flex-row items-center justify-between">
                <Typography variant="body-md">반복</Typography>
                <Switch
                  value={isRecurring}
                  onValueChange={v => {
                    setIsRecurring(v);
                    if (!v) {
                      setRecurrenceFrequency('daily');
                      setSelectedDays([]);
                      setRecurrenceEndType('never');
                    }
                  }}
                />
              </View>

              {/* 반복 주기 */}
              {isRecurring && (
                <View style={{ gap: 6 }}>
                  <Typography variant="body-sm" className="font-medium">반복 주기</Typography>
                  <View className="flex-row flex-wrap gap-2">
                    {RECURRENCE_FREQUENCY_OPTIONS.map(opt => {
                      const isActive = recurrenceFrequency === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => {
                            setRecurrenceFrequency(opt.value);
                            if (opt.value !== 'weekly') setSelectedDays([]);
                          }}
                          className="px-3 py-2 rounded-full border"
                          style={{
                            borderColor: isActive
                              ? colors.primary
                              : colors.border,
                            backgroundColor: isActive
                              ? colors.primary + '15'
                              : 'transparent',
                          }}
                        >
                          <Typography
                            variant="caption"
                            style={{
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
                              fontWeight: isActive ? '600' : '400',
                            }}
                          >
                            {opt.label}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 요일 선택 (매주일 때) */}
              {isRecurring && recurrenceFrequency === 'weekly' && (
                <View style={{ gap: 6 }}>
                  <Typography variant="body-sm" className="font-medium">요일 선택</Typography>
                  <View className="flex-row gap-2">
                    {DAY_OF_WEEK_OPTIONS.map(day => {
                      const isActive = selectedDays.includes(day.value);
                      return (
                        <Pressable
                          key={day.value}
                          onPress={() => toggleDayOfWeek(day.value)}
                          accessibilityLabel={`${day.label}요일 ${isActive ? '선택됨' : '선택'}`}
                          accessibilityRole="checkbox"
                          className="w-10 h-10 rounded-full items-center justify-center border"
                          style={{
                            borderColor: isActive
                              ? colors.primary
                              : colors.border,
                            backgroundColor: isActive
                              ? colors.primary + '15'
                              : 'transparent',
                          }}
                        >
                          <Typography
                            variant="caption"
                            style={{
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
                              fontWeight: isActive ? '600' : '400',
                            }}
                          >
                            {day.label}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 반복 종료 */}
              {isRecurring && (
                <View style={{ gap: 6 }}>
                  <Typography variant="body-sm" className="font-medium">반복 종료</Typography>
                  <View className="flex-row flex-wrap gap-2">
                    {RECURRENCE_END_OPTIONS.map(opt => {
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
                              ? colors.primary + '15'
                              : 'transparent',
                          }}
                        >
                          <Typography
                            variant="caption"
                            style={{
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
                              fontWeight: isActive ? '600' : '400',
                            }}
                          >
                            {opt.label}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </View>
                  {recurrenceEndType === 'date' && (
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
                      <Typography>{formatDate(recurrenceEndDate)}</Typography>
                    </Pressable>
                  )}
                  {errors.recurrenceEndDate && (
                    <Typography variant="small" style={{ color: '#EF4444' }}>
                      {errors.recurrenceEndDate}
                    </Typography>
                  )}
                </View>
              )}

              {/* ── 옵션 ── */}
              <View className="border-b border-border" />

              {/* 완료 체크 토글 */}
              <View className="flex-row items-center justify-between">
                <Typography variant="body-md">완료 체크</Typography>
                <Switch
                  value={isCompletable}
                  onValueChange={setIsCompletable}
                />
              </View>

              {/* 알림 */}
              <View className="flex-row items-center justify-between">
                <Typography variant="body-md">알림</Typography>
                <Switch
                  value={reminder !== 'none'}
                  onValueChange={v => {
                    if (v) {
                      setReminder(isAllDay ? 'same_day_9am' : 'on_time');
                    } else {
                      setReminder('none');
                    }
                  }}
                />
              </View>
              {reminder !== 'none' && (
                <View className="flex-row flex-wrap gap-2">
                  {(isAllDay
                    ? ALL_DAY_REMINDER_OPTIONS
                    : TIMED_REMINDER_OPTIONS
                  )
                    .filter(opt => opt.value !== 'none')
                    .map(opt => {
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
                              ? colors.primary + '15'
                              : 'transparent',
                          }}
                        >
                          <Typography
                            variant="caption"
                            style={{
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
                              fontWeight: isActive ? '600' : '400',
                            }}
                          >
                            {opt.label}
                          </Typography>
                        </Pressable>
                      );
                    })}
                </View>
              )}

              {/* ── 메모 ── */}
              <View className="border-b border-border" />

              <View style={{ gap: 6 }}>
                <Typography variant="body-sm" className="font-medium">메모</Typography>
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
                    fontFamily: 'Pretendard',
                    color: colors.foreground,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              <Button onPress={handleSubmit} loading={submitting}>
                저장
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
            <Typography variant="body-lg" className="font-semibold text-center">
              시작 날짜 선택
            </Typography>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              locale="ko-KR"
              style={{ alignSelf: 'center', width: '100%' }}
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
            <Typography variant="body-lg" className="font-semibold text-center">
              종료 날짜 선택
            </Typography>
            <DateTimePicker
              value={tempEndDate}
              mode="date"
              display="spinner"
              onChange={handleEndDateChange}
              minimumDate={date}
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              locale="ko-KR"
              style={{ alignSelf: 'center', width: '100%' }}
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

        {/* 시작 시간 피커 */}
        <BottomSheet
          visible={showStartTimePicker}
          onClose={() => setShowStartTimePicker(false)}
        >
          <View style={{ gap: 12 }}>
            <Typography variant="body-lg" className="font-semibold text-center">
              시작 시간 선택
            </Typography>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              onChange={handleStartTimeChange}
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              locale="ko-KR"
              style={{ alignSelf: 'center', width: '100%' }}
            />
            <Button
              onPress={() => {
                setTime(tempTime);
                // 같은 날짜이고 종료 시간이 시작 시간보다 이전이면 종료 시간을 시작 시간으로 보정
                if (
                  dayjs(date).isSame(dayjs(endDate), 'day') &&
                  dayjs(endTime).hour() * 60 + dayjs(endTime).minute() <
                    dayjs(tempTime).hour() * 60 + dayjs(tempTime).minute()
                ) {
                  setEndTime(tempTime);
                }
                setShowStartTimePicker(false);
              }}
            >
              확인
            </Button>
          </View>
        </BottomSheet>

        {/* 종료 시간 피커 */}
        <BottomSheet
          visible={showEndTimePicker}
          onClose={() => setShowEndTimePicker(false)}
        >
          <View style={{ gap: 12 }}>
            <Typography variant="body-lg" className="font-semibold text-center">
              종료 시간 선택
            </Typography>
            <DateTimePicker
              value={tempEndTime}
              mode="time"
              display="spinner"
              onChange={handleEndTimeChange}
              minimumDate={
                dayjs(date).isSame(dayjs(endDate), 'day') ? time : undefined
              }
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              locale="ko-KR"
              style={{ alignSelf: 'center', width: '100%' }}
            />
            <Button
              onPress={() => {
                setEndTime(tempEndTime);
                setShowEndTimePicker(false);
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
            <Typography variant="body-lg" className="font-semibold text-center">
              반복 종료 날짜 선택
            </Typography>
            <DateTimePicker
              value={tempRecurrenceEndDate}
              mode="date"
              display="spinner"
              onChange={handleRecurrenceEndDateChange}
              minimumDate={date}
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              locale="ko-KR"
              style={{ alignSelf: 'center', width: '100%' }}
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
