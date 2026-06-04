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
import { AuthInput } from '@/src/components/ui/AuthInput';
import { useLogin } from '@/src/hooks/useLogin';
import { COLORS } from '@/src/libs/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { form, onSubmit, loading, serverError, requiresPin } = useLogin();
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
          {/* Logo */}
          <View style={styles.header}>
            <Text style={styles.logo}>SPAIK</Text>
            <Text style={styles.tagline}>Stream. Watch. Connect.</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            <Controller
              control={control}
              name="login"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  label="Username or Email"
                  placeholder="Enter your username or email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.login?.message}
                  keyboardType="email-address"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  isPassword
                />
              )}
            />

            {requiresPin && (
              <Controller
                control={control}
                name="pin"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="2FA Code"
                    placeholder="6-digit code from your app"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.pin?.message}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                )}
              />
            )}

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
                : <Text style={styles.primaryBtnText}>Sign In</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.footerText}>
              No account?{' '}
              <Text style={styles.footerAccent}>Create one</Text>
            </Text>
          </TouchableOpacity>
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

  footerLink: { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
  footerAccent: { color: COLORS.accent, fontWeight: '600' },
});
