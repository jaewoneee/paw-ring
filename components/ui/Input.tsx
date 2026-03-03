import type { KeyboardTypeOptions } from 'react-native';
import { Text, TextInput, View } from 'react-native';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  error?: boolean;
  errorMessage?: string;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  error,
  errorMessage,
}: InputProps) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className=" font-medium text-gray-700">{label}</Text>
      ) : null}
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
        }`}
        placeholder={placeholder}
        placeholderClassName="text-base!"
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
      {error && errorMessage ? (
        <Text className="text-sm text-red-500 ml-1">{errorMessage}</Text>
      ) : null}
    </View>
  );
}
