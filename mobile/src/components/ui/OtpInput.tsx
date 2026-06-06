import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  StyleSheet,
} from 'react-native';
import { COLORS } from '@/src/libs/constants/colors';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  length?: number;
  autoFocus?: boolean;
}

/**
 * Segmented one-time-code input — a row of digit cells backed by a single
 * hidden TextInput. Styled to match the app's auth inputs (card cells, accent
 * highlight on the active cell, blinking caret).
 */
export function OtpInput({
  value,
  onChangeText,
  label,
  hint,
  error,
  length = 6,
  autoFocus,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const caretOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!focused) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(caretOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(caretOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [focused, caretOpacity]);

  const digits = value.split('');
  const filledCount = value.length;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length }).map((_, i) => {
          const char = digits[i] ?? '';
          const isActive =
            focused && (i === filledCount || (filledCount === length && i === length - 1));

          return (
            <View
              key={i}
              style={[
                styles.cell,
                char ? styles.cellFilled : null,
                isActive ? styles.cellActive : null,
                error ? styles.cellError : null,
              ]}
            >
              {char ? (
                <Text style={styles.cellText}>{char}</Text>
              ) : isActive ? (
                <Animated.View style={[styles.caret, { opacity: caretOpacity }]} />
              ) : null}
            </View>
          );
        })}

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={value}
          onChangeText={t => onChangeText(t.replace(/\D/g, '').slice(0, length))}
          keyboardType="number-pad"
          maxLength={length}
          autoFocus={autoFocus}
          caretHidden
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </Pressable>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    position: 'relative',
  },
  cell: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: { borderColor: COLORS.accentDark },
  cellActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(24, 185, 174, 0.08)',
  },
  cellError: { borderColor: COLORS.danger },
  cellText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  caret: {
    width: 2,
    height: 24,
    borderRadius: 1,
    backgroundColor: COLORS.accent,
  },
  // Transparent overlay capturing taps + keyboard input across the whole row.
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: 'transparent',
  },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 6 },
  hintText: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
});
