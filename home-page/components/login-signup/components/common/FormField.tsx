import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormFieldProps } from '../../types/auth';
import { COLORS } from '../../constants/colors';

export default function FormField({
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={styles.fieldWrap}>
      <View
        style={[
          styles.inputRow,
          isFocused && styles.inputRowFocused,
          Boolean(error) && styles.inputRowError,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isFocused ? COLORS.PURPLE : COLORS.PURPLE_LIGHT}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TEXT_PLACEHOLDER}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={10}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={isFocused ? COLORS.PURPLE : COLORS.PURPLE_LIGHT}
            />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: 9,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: COLORS.PURPLE_BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: COLORS.PURPLE_INPUT_BG,
  },
  inputRowFocused: {
    borderColor: COLORS.PURPLE,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  inputRowError: {
    borderColor: COLORS.ERROR,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    height: '100%',
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 11.5,
    marginTop: 3,
    marginLeft: 4,
  },
});
