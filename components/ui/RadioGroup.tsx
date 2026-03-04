import { Pressable, View } from 'react-native';
import { Text } from './Text';

interface RadioOption<T extends string> {
  label: string;
  value: T;
}

interface RadioGroupProps<T extends string> {
  label?: string;
  options: RadioOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  error?: boolean;
  errorMessage?: string;
}

export function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  errorMessage,
}: RadioGroupProps<T>) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="font-medium text-foreground">{label}</Text>
      ) : null}
      <View className="flex-row gap-3">
        {options.map(option => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange?.(option.value)}
              className={`flex-1 flex-row items-center justify-center rounded-xl border py-3 px-4 ${
                selected
                  ? 'border-primary bg-primary'
                  : error
                    ? 'border-error bg-red-50'
                    : 'border-border bg-surface-elevated'
              }`}
            >
              <Text
                className={`text-base font-medium ${
                  selected ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error && errorMessage ? (
        <Text className="text-sm text-error ml-1">{errorMessage}</Text>
      ) : null}
    </View>
  );
}
