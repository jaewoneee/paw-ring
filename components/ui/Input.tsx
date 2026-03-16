import { forwardRef } from 'react';
import { Keyboard, TextInput, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native';
import { Text } from './Text';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onBlur?: TextInputProps['onBlur'];
  onFocus?: TextInputProps['onFocus'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: TextInputProps['returnKeyType'];
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoFocus?: boolean;
  editable?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  error?: boolean;
  errorMessage?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    placeholder,
    value,
    onChangeText,
    onBlur,
    onFocus,
    onSubmitEditing,
    keyboardType,
    returnKeyType,
    secureTextEntry,
    autoCapitalize = 'none',
    autoFocus,
    editable,
    maxLength,
    multiline,
    numberOfLines,
    error,
    errorMessage,
  },
  ref
) {
  const handleBlur: TextInputProps['onBlur'] = (e) => {
    Keyboard.dismiss();
    onBlur?.(e);
  };

  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="font-medium text-foreground">{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
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
        onBlur={handleBlur}
        onFocus={onFocus}
        onSubmitEditing={onSubmitEditing}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        editable={editable}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
      {error && errorMessage ? (
        <Text className="text-sm text-error ml-1">{errorMessage}</Text>
      ) : null}
    </View>
  );
});
