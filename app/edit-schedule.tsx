import { Text } from '@/components/ui/Text';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import dayjs, { formatTime24 } from '@/utils/dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
  CATEGORIES,
  CATEGORY_META,
  DAY_OF_WEEK_OPTIONS,
  RECURRENCE_END_OPTIONS,
  RECURRENCE_FREQUENCY_OPTIONS,
  TIMED_REMINDER_OPTIONS,
} from '@/constants/Schedule';
import {
  getScheduleById,
  updateSchedule,
  updateScheduleThisAndFollowing,
  updateScheduleThisOnly,
} from '@/services/schedule';
import type {
  RecurrenceFrequency,
  ReminderType,
  Schedule,
  ScheduleCategory,
} from '@/types/schedule';
import { formatDate } from '@/utils/date';
import { buildRRule, parseRRule } from '@/utils/rrule';

export default function EditScheduleScreen() {
  const router = useRouter();
  const { id, editMode, occurrenceDate } = useLocalSearchParams<{
    id: string;
    editMode?: 'single' | 'following';
    occurrenceDate?: string;
  }>();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ScheduleCategory>('other');
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [reminder, setReminder] = useState<ReminderType>('none');
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCompletable, setIsCompletable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // End date
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempEndDate, setTempEndDate] = useState<Date>(new Date());

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
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(
    dayjs().add(1, 'hour').toDate()
  );

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
      setIsCompletable(data.is_completable ?? false);
      setMemo(data.memo ?? '');

      // Restore end date & end time
      if (data.end_date) {
        setEndDate(dayjs(data.end_date).toDate());
        setEndTime(dayjs(data.end_date).toDate());
      } else {
        setEndDate(dayjs(data.start_date).toDate());
      }

      // Restore recurrence
      if (data.is_recurring && data.rrule) {
        setIsRecurring(true);
        const parsed = parseRRule(data.rrule);
        setRecurrenceFrequency(parsed.frequency);
        setSelectedDays(parsed.selectedDays);

        if (data.recurrence_end_date) {
          setRecurrenceEndType('date');
          setRecurrenceEndDate(dayjs(data.recurrence_end_date).toDate());
        } else {
          setRecurrenceEndType('never');
        }
      }
    } catch (err) {
      console.error('[EditSchedule] fetch failed:', err);
      Alert.alert('오류', '일정을 불러올 수 없습니다.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

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
    if (!validate() || !id) return;

    setSubmitting(true);
    try {
      const startDate = isAllDay
        ? dayjs(date).startOf('day').toISOString()
        : dayjs(date)
            .hour(time.getHours())
            .minute(time.getMinutes())
            .second(0)
            .toISOString();

      const computedEndDate = isAllDay
        ? dayjs(endDate).endOf('day').toISOString()
        : dayjs(endDate)
            .hour(endTime.getHours())
            .minute(endTime.getMinutes())
            .second(0)
            .toISOString();

      const rrule = isRecurring
        ? buildRRule({
            frequency: recurrenceFrequency,
            selectedDays:
              recurrenceFrequency === 'weekly' ? selectedDays : undefined,
            endDate:
              recurrenceEndType === 'date'
                ? dayjs(recurrenceEndDate).endOf('day').toISOString()
                : undefined,
          })
        : null;

      if (editMode === 'single' && occurrenceDate) {
        // 이 일정만 수정: 예외 레코드 생성
        await updateScheduleThisOnly(id, occurrenceDate, {
          title: title.trim(),
          category,
          memo: memo.trim() || null,
          start_date: startDate,
          end_date: computedEndDate,
          is_all_day: isAllDay,
          is_completable: isCompletable,
          reminder,
        });
      } else if (editMode === 'following' && occurrenceDate && schedule) {
        // 이후 모든 일정 수정: 원본 종료 + 새 스케줄 생성
        await updateScheduleThisAndFollowing(id, occurrenceDate, {
          pet_id: schedule.pet_id,
          owner_id: schedule.owner_id,
          title: title.trim(),
          category,
          memo: memo.trim() || undefined,
          start_date: startDate,
          end_date: computedEndDate,
          is_all_day: isAllDay,
          is_completable: isCompletable,
          reminder,
          is_recurring: isRecurring,
          rrule: rrule ?? undefined,
          recurrence_end_date:
            isRecurring && recurrenceEndType === 'date'
              ? dayjs(recurrenceEndDate).endOf('day').toISOString()
              : undefined,
        });
      } else {
        // 일반 수정 (비반복 스케줄)
        await updateSchedule(id, {
          title: title.trim(),
          category,
          memo: memo.trim() || null,
          start_date: startDate,
          end_date: computedEndDate,
          is_all_day: isAllDay,
          is_completable: isCompletable,
          reminder,
          is_recurring: isRecurring,
          rrule,
          recurrence_end_date:
            isRecurring && recurrenceEndType === 'date'
              ? dayjs(recurrenceEndDate).endOf('day').toISOString()
              : null,
        });
      }

      router.back();
    } catch (err) {
      console.error('[EditSchedule] update failed:', err);
      Alert.alert('오류', '일정 수정에 실패했습니다. 다시 시도해주세요.');
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
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBlock: 8, gap: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Card>
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
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.foreground,
                  }}
                >
                  카테고리
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
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
                            ? meta.color + '15'
                            : 'transparent',
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
                            fontWeight: isActive ? '600' : '400',
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
                    fontWeight: '500',
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
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.foreground,
                  }}
                >
                  종료 날짜
                </Text>
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
                {errors.endDate && (
                  <Text style={{ fontSize: 12, color: '#EF4444' }}>
                    {errors.endDate}
                  </Text>
                )}
              </View>

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

              {/* 완료 체크 토글 */}
              <View className="flex-row items-center justify-between">
                <Typography variant="body-md">완료 체크</Typography>
                <Switch
                  value={isCompletable}
                  onValueChange={setIsCompletable}
                />
              </View>

              {/* 시작 시간 / 종료 시간 */}
              {!isAllDay && (
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: colors.foreground,
                    }}
                  >
                    시간
                  </Text>
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
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.mutedForeground,
                          marginBottom: 2,
                        }}
                      >
                        시작
                      </Text>
                      <Text style={{ fontSize: 16, color: colors.foreground }}>
                        {formatTime24(time)}
                      </Text>
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
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.mutedForeground,
                          marginBottom: 2,
                        }}
                      >
                        종료
                      </Text>
                      <Text style={{ fontSize: 16, color: colors.foreground }}>
                        {formatTime24(endTime)}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

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
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: colors.foreground,
                    }}
                  >
                    반복 주기
                  </Text>
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
                          <Text
                            style={{
                              fontSize: 13,
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
                              fontWeight: isActive ? '600' : '400',
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
              {isRecurring && recurrenceFrequency === 'weekly' && (
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: colors.foreground,
                    }}
                  >
                    요일 선택
                  </Text>
                  <View className="flex-row gap-2">
                    {DAY_OF_WEEK_OPTIONS.map(day => {
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
                              ? colors.primary + '15'
                              : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
                              fontWeight: isActive ? '600' : '400',
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
                      fontWeight: '500',
                      color: colors.foreground,
                    }}
                  >
                    반복 종료
                  </Text>
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
                          <Text
                            style={{
                              fontSize: 13,
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
                              fontWeight: isActive ? '600' : '400',
                            }}
                          >
                            {opt.label}
                          </Text>
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
                      <Text style={{ fontSize: 16, color: colors.foreground }}>
                        {formatDate(recurrenceEndDate)}
                      </Text>
                    </Pressable>
                  )}
                  {errors.recurrenceEndDate && (
                    <Text style={{ fontSize: 12, color: '#EF4444' }}>
                      {errors.recurrenceEndDate}
                    </Text>
                  )}
                </View>
              )}

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
                          <Text
                            style={{
                              fontSize: 13,
                              color: isActive
                                ? colors.primary
                                : colors.mutedForeground,
                              fontWeight: isActive ? '600' : '400',
                            }}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                </View>
              )}

              {/* 메모 */}
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
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
                    fontFamily: 'Pretendard',
                    color: colors.foreground,
                    minHeight: 80,
                    textAlignVertical: 'top',
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
                fontWeight: '600',
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              시작 날짜 선택
            </Text>
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
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.foreground,
                textAlign: 'center',
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
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              시작 시간 선택
            </Text>
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
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              종료 시간 선택
            </Text>
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
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.foreground,
                textAlign: 'center',
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
