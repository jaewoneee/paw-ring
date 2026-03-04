import type { KeyboardTypeOptions } from 'react-native';
import { TextInput, View } from 'react-native';
import { Text } from './Text';

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
        <Text className="font-medium text-foreground">{label}</Text>
      ) : null}
      <TextInput
        className={`font-sans border rounded-xl px-4 py-3 text-base! text-foreground ${
          error
            ? 'border-error bg-red-50 dark:bg-red-950'
            : 'border-border bg-surface-elevated'
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
        <Text className="text-sm text-error ml-1">{errorMessage}</Text>
      ) : null}
    </View>
  );
}
