import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  StyleSheet,
} from 'react-native';
import { useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';

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
  const styles = useThemedStyles(makeStyles);
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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wrapper: { marginBottom: 14 },
    label: {
      fontSize: 12,
      color: c.textSecondary,
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
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellFilled: { borderColor: c.accentDark },
    cellActive: {
      borderColor: c.accent,
      backgroundColor: 'rgba(24, 185, 174, 0.08)',
    },
    cellError: { borderColor: c.danger },
    cellText: {
      fontSize: 22,
      fontWeight: '700',
      color: c.textPrimary,
    },
    caret: {
      width: 2,
      height: 24,
      borderRadius: 1,
      backgroundColor: c.accent,
    },
    // Transparent overlay capturing taps + keyboard input across the whole row.
    hiddenInput: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0,
      color: 'transparent',
    },
    errorText: { fontSize: 12, color: c.danger, marginTop: 6 },
    hintText: { fontSize: 12, color: c.textMuted, marginTop: 6 },
  });
