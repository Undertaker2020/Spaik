import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconCircleCheck, IconAlertCircle } from '@tabler/icons-react-native';
import { useVerify } from '@/src/hooks/useVerify';
import { COLORS } from '@/src/libs/constants/colors';

export default function VerifyScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { loading, error } = useVerify(token);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.logo}>SPAIK</Text>

        {loading && (
          <>
            <ActivityIndicator size="large" color={COLORS.accent} style={styles.icon} />
            <Text style={styles.title}>Verifying your account…</Text>
          </>
        )}

        {!loading && !error && (
          <>
            <IconCircleCheck size={56} color={COLORS.accent} style={styles.icon} />
            <Text style={styles.title}>Email confirmed!</Text>
            <Text style={styles.sub}>Redirecting you to the app…</Text>
          </>
        )}

        {error && (
          <>
            <IconAlertCircle size={56} color={COLORS.danger} style={styles.icon} />
            <Text style={styles.title}>Verification failed</Text>
            <Text style={styles.sub}>{error}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.btnText}>Go to Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
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
    color: COLORS.accent,
    letterSpacing: -1.5,
    marginBottom: 24,
  },
  icon: { marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  sub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  btn: {
    marginTop: 16,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
