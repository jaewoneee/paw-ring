import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Screen } from '@/components/ui/Screen';
import { Typography } from '@/components/ui/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePets } from '@/contexts/PetContext';
import { useAuth } from '@/hooks/useAuth';
import { createPet } from '@/services/pet';
import type { PetSpecies } from '@/types/pet';
import { formatDate } from '@/utils/date';

const SPECIES_OPTIONS: { label: string; value: PetSpecies }[] = [
  { label: '강아지', value: 'dog' },
  { label: '고양이', value: 'cat' },
];

export default function AddPetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshPets } = usePets();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies | undefined>();
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [tempDate, setTempDate] = useState<Date>(new Date());

  const handleDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      if (date) {
        setBirthDate(date);
        if (errors.birthDate) {
          setErrors(prev => ({ ...prev, birthDate: '' }));
        }
      }
      setShowDatePicker(false);
    } else if (date) {
      setTempDate(date);
    }
  };

  const handleDateConfirm = () => {
    setBirthDate(tempDate);
    if (errors.birthDate) {
      setErrors(prev => ({ ...prev, birthDate: '' }));
    }
    setShowDatePicker(false);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    if (!species) {
      newErrors.species = '반려동물 종류를 선택해주세요';
    }
    if (!birthDate) {
      newErrors.birthDate = '생년월일을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user || !species || !birthDate) return;

    setSubmitting(true);
    try {
      const dateStr = birthDate.toISOString().split('T')[0]; // YYYY-MM-DD
      await createPet({
        owner_id: user.uid,
        name: name.trim(),
        species,
        birth_date: dateStr,
        // TODO: profile_image — Supabase Storage 연동 후 추가
      });
      await refreshPets();
      router.back();
    } catch (err) {
      console.error('[AddPet] 등록 실패:', err);
      Alert.alert('오류', '반려동물 등록에 실패했습니다. 다시 시도해주세요.');
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
            <Typography variant="body-lg" className="font-semibold">
              반려동물 정보를 입력하세요
            </Typography>

            {/* 프로필 사진 (선택) */}
            <View className="items-center">
              <Pressable
                onPress={handlePickImage}
                className="w-24 h-24 rounded-full bg-surface border border-border items-center justify-center overflow-hidden"
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    className="w-full h-full"
                  />
                ) : (
                  <View className="items-center gap-1">
                    <FontAwesome name="camera" size={24} color={colors.mutedForeground} />
                  </View>
                )}
              </Pressable>
            </View>

            {/* 반려동물 종류 (필수) */}
            <RadioGroup
              label="종류"
              options={SPECIES_OPTIONS}
              value={species}
              onChange={v => {
                setSpecies(v);
                if (errors.species) {
                  setErrors(prev => ({ ...prev, species: '' }));
                }
              }}
              error={!!errors.species}
              errorMessage={errors.species}
            />

            {/* 이름 (필수) */}
            <Input
              label="이름"
              placeholder="반려동물 이름"
              value={name}
              onChangeText={text => {
                setName(text);
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              error={!!errors.name}
              errorMessage={errors.name}
            />

            {/* 생년월일 (필수) */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.foreground,
                }}
              >
                생년월일
              </Text>
              <Pressable
                onPress={() => {
                  setTempDate(birthDate ?? new Date());
                  setShowDatePicker(true);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: errors.birthDate ? colors.error : colors.border,
                  backgroundColor: errors.birthDate ? (colorScheme === 'dark' ? '#450a0a' : '#fef2f2') : colors.surfaceElevated,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: birthDate ? colors.foreground : colors.mutedForeground,
                  }}
                >
                  {birthDate
                    ? formatDate(birthDate)
                    : '생년월일을 선택해주세요'}
                </Text>
              </Pressable>
              {errors.birthDate ? (
                <Text style={{ fontSize: 12, color: colors.error, marginLeft: 4 }}>
                  {errors.birthDate}
                </Text>
              ) : null}
            </View>

            <Button onPress={handleSubmit} loading={submitting}>등록하기</Button>
          </View>
        </CardContent>
      </Card>

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
            생년월일 선택
          </Text>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={handleDateChange}
            themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
            locale="ko-KR"
            style={{ alignSelf: 'center', width: '100%' }}
          />
          <Button onPress={handleDateConfirm}>확인</Button>
        </View>
      </BottomSheet>
      </ScrollView>
    </Screen>
  );
}
