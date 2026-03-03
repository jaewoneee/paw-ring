import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Typography } from '@/components/ui/Typography';
import type { PetSpecies } from '@/types/pet';
import { formatDate } from '@/utils/date';

const SPECIES_OPTIONS: { label: string; value: PetSpecies }[] = [
  { label: '강아지', value: 'dog' },
  { label: '고양이', value: 'cat' },
];

export default function AddPetScreen() {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies | undefined>();
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = () => {
    if (!validate()) return;
    // TODO: submit logic
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
      <Card>
        <CardContent>
          <View className="gap-5">
            <Typography className="text-lg font-semibold">
              반려동물 정보를 입력하세요
            </Typography>

            {/* 프로필 사진 (선택) */}
            <View className="items-center">
              <Pressable
                onPress={handlePickImage}
                className="w-24 h-24 rounded-full bg-gray-100 border border-gray-300 items-center justify-center overflow-hidden"
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    className="w-full h-full"
                  />
                ) : (
                  <View className="items-center gap-1">
                    <FontAwesome name="camera" size={24} color="#9ca3af" />
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
                  color: '#374151',
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
                  borderColor: errors.birthDate ? '#f87171' : '#d1d5db',
                  backgroundColor: errors.birthDate ? '#fef2f2' : '#fff',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: birthDate ? '#000' : '#9ca3af',
                  }}
                >
                  {birthDate
                    ? formatDate(birthDate)
                    : '생년월일을 선택해주세요'}
                </Text>
              </Pressable>
              {errors.birthDate ? (
                <Text style={{ fontSize: 12, color: '#ef4444', marginLeft: 4 }}>
                  {errors.birthDate}
                </Text>
              ) : null}
            </View>

            <Button onPress={handleSubmit}>등록하기</Button>
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
              color: '#111',
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
            themeVariant="light"
            locale="ko-KR"
            style={{ alignSelf: 'center', width: '100%' }}
          />
          <Button onPress={handleDateConfirm}>확인</Button>
        </View>
      </BottomSheet>
      </ScrollView>
    </SafeAreaView>
  );
}
