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
import { IconCircleCheck } from '@tabler/icons-react-native';
import { AuthInput } from '@/src/components/ui/AuthInput';
import { useRegister } from '@/src/hooks/useRegister';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';

export default function RegisterScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
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
            <Text style={styles.tagline}>{t('auth.tagline.register')}</Text>
          </View>

          {/* Success state */}
          {success ? (
            <View style={styles.successCard}>
              <IconCircleCheck size={48} color={c.accent} />
              <Text style={styles.successTitle}>{t('auth.register.successTitle')}</Text>
              <Text style={styles.successSub}>{t('auth.register.successSub')}</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('auth.register.title')}</Text>

              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label={t('auth.register.usernameLabel')}
                    placeholder={t('auth.register.usernamePlaceholder')}
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
                    label={t('auth.register.emailLabel')}
                    placeholder={t('auth.register.emailPlaceholder')}
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
                    label={t('auth.register.passwordLabel')}
                    placeholder={t('auth.register.passwordPlaceholder')}
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
                  : <Text style={styles.primaryBtnText}>{t('auth.register.submit')}</Text>
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
                {t('auth.register.footer')}{' '}
                <Text style={styles.footerAccent}>{t('auth.register.footerAction')}</Text>
              </Text>
            </TouchableOpacity>
          )}
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

    successCard: {
      backgroundColor: c.card,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      gap: 12,
    },
    successTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary },
    successSub: { fontSize: 14, color: c.textSecondary },

    footerLink: { alignItems: 'center', marginTop: 24 },
    footerText: { fontSize: 14, color: c.textSecondary },
    footerAccent: { color: c.accent, fontWeight: '600' },
  });
