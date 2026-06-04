import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Controller } from 'react-hook-form';
import { IconCircleCheck } from '@tabler/icons-react-native';
import { AuthInput } from '@/src/components/ui/AuthInput';
import { useRegister } from '@/src/hooks/useRegister';
import { COLORS } from '@/src/libs/constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { form, onSubmit, loading, serverError, success } = useRegister();
  const { control, formState: { errors } } = form;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>SPAIK</Text>
            <Text style={styles.tagline}>Join the community</Text>
          </View>

          {/* Success state */}
          {success ? (
            <View style={styles.successCard}>
              <IconCircleCheck size={48} color={COLORS.accent} />
              <Text style={styles.successTitle}>Account created!</Text>
              <Text style={styles.successSub}>Redirecting to sign in…</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create Account</Text>

              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Username"
                    placeholder="letters, numbers and hyphens"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.username?.message}
                    autoComplete="username-new"
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Email"
                    placeholder="you@example.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Password"
                    placeholder="at least 8 characters"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    isPassword
                    autoComplete="new-password"
                  />
                )}
              />

              {serverError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{serverError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={onSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.primaryBtnText}>Create Account</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          {!success && (
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => router.back()}
            >
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.footerAccent}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: -1.5,
  },
  tagline: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },

  errorBanner: {
    backgroundColor: 'rgba(229, 62, 62, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: 12,
    marginBottom: 14,
  },
  errorBannerText: { color: COLORS.danger, fontSize: 13 },

  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },

  successCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  successTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  successSub: { fontSize: 14, color: COLORS.textSecondary },

  footerLink: { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
  footerAccent: { color: COLORS.accent, fontWeight: '600' },
});
