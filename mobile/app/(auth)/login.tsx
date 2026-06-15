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
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';
import { AuthInput } from '@/src/components/ui/AuthInput';
import { OtpInput } from '@/src/components/ui/OtpInput';
import { useLogin } from '@/src/hooks/useLogin';
import { useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';

export default function LoginScreen() {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
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
            <Text style={styles.tagline}>{t('auth.tagline.login')}</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('auth.login.title')}</Text>

            <Controller
              control={control}
              name="login"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  label={t('auth.login.loginLabel')}
                  placeholder={t('auth.login.loginPlaceholder')}
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
                  label={t('auth.login.passwordLabel')}
                  placeholder={t('auth.login.passwordPlaceholder')}
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
                render={({ field: { onChange, value } }) => (
                  <OtpInput
                    label={t('auth.login.twoFactorLabel')}
                    hint={t('auth.login.twoFactorHint')}
                    value={value ?? ''}
                    onChangeText={onChange}
                    error={errors.pin?.message}
                    autoFocus
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
                : <Text style={styles.primaryBtnText}>{t('auth.login.submit')}</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.footerText}>
              {t('auth.login.footer')}{' '}
              <Text style={styles.footerAccent}>{t('auth.login.footerAction')}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
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
      color: c.accent,
      letterSpacing: -1.5,
    },
    tagline: { fontSize: 14, color: c.textSecondary, marginTop: 6 },

    card: {
      backgroundColor: c.card,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 20,
    },

    errorBanner: {
      backgroundColor: 'rgba(229, 62, 62, 0.12)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.danger,
      padding: 12,
      marginBottom: 14,
    },
    errorBannerText: { color: c.danger, fontSize: 13 },

    primaryBtn: {
      backgroundColor: c.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },

    footerLink: { alignItems: 'center', marginTop: 24 },
    footerText: { fontSize: 14, color: c.textSecondary },
    footerAccent: { color: c.accent, fontWeight: '600' },
  });
