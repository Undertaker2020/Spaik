import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { IconEye, IconEyeOff } from '@tabler/icons-react-native';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function AuthInput({ label, error, isPassword, style, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const c = useColors();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={isPassword && !visible}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setVisible(v => !v)}
            style={styles.eyeBtn}
            hitSlop={8}
          >
            {visible
              ? <IconEye size={18} color={c.textMuted} />
              : <IconEyeOff size={18} color={c.textMuted} />}
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wrapper: { marginBottom: 14 },
    label: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: '500',
      marginBottom: 6,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    inputWrapError: { borderColor: c.danger },
    input: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: c.textPrimary,
    },
    eyeBtn: { paddingRight: 14 },
    errorText: { fontSize: 12, color: c.danger, marginTop: 4 },
  });
