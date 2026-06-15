import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconCircleCheck, IconAlertCircle } from '@tabler/icons-react-native';
import { useVerify } from '@/src/hooks/useVerify';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';

export default function VerifyScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { loading, error } = useVerify(token);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.logo}>SPAIK</Text>

        {loading && (
          <>
            <ActivityIndicator size="large" color={c.accent} style={styles.icon} />
            <Text style={styles.title}>{t('auth.verify.verifying')}</Text>
          </>
        )}

        {!loading && !error && (
          <>
            <IconCircleCheck size={56} color={c.accent} style={styles.icon} />
            <Text style={styles.title}>{t('auth.verify.successTitle')}</Text>
            <Text style={styles.sub}>{t('auth.verify.successSub')}</Text>
          </>
        )}

        {error && (
          <>
            <IconAlertCircle size={56} color={c.danger} style={styles.icon} />
            <Text style={styles.title}>{t('auth.verify.failedTitle')}</Text>
            <Text style={styles.sub}>{error}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.btnText}>{t('auth.verify.goToLogin')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  logo: {
    fontSize: 38,
    fontWeight: '700',
    color: c.accent,
    letterSpacing: -1.5,
    marginBottom: 24,
  },
  icon: { marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: c.textPrimary, textAlign: 'center' },
  sub: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
  btn: {
    marginTop: 16,
    backgroundColor: c.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
