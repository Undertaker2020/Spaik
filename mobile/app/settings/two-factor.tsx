import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client';
import { IconShieldCheck, IconShield } from '@tabler/icons-react-native';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import {
  GENERATE_TOTP_SECRET,
  ENABLE_TOTP,
  DISABLE_TOTP,
} from '@/src/graphql/queries/settings.queries';
import { FIND_MY_PROFILE, type MyProfile } from '@/src/graphql/queries/profile.queries';

export default function TwoFactorScreen() {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { data: profileData, refetch: refetchProfile } = useQuery<{ findProfile: MyProfile }>(FIND_MY_PROFILE);
  const isEnabled = profileData?.findProfile.isTotpEnabled ?? false;

  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'idle' | 'setup'>('idle');

  const { data: totpData, loading: loadingSecret } = useQuery<{
    generateTotpSecret: { secret: string; qrcodeUrl: string };
  }>(GENERATE_TOTP_SECRET, { skip: !isEnabled === false || step !== 'setup' });

  const secret    = totpData?.generateTotpSecret.secret ?? '';
  const qrcodeUrl = totpData?.generateTotpSecret.qrcodeUrl ?? '';

  const [enableTotp, { loading: enabling }] = useMutation(ENABLE_TOTP, {
    onCompleted: () => {
      Alert.alert(t('settings.twoFactor.alerts.enabledTitle'), t('settings.twoFactor.alerts.enabledMsg'));
      setStep('idle');
      setPin('');
      refetchProfile();
    },
    onError: (e) => Alert.alert(t('common.errorTitle'), e.message),
  });

  const [disableTotp, { loading: disabling }] = useMutation(DISABLE_TOTP, {
    onCompleted: () => {
      Alert.alert(t('settings.twoFactor.alerts.disabledTitle'), t('settings.twoFactor.alerts.disabledMsg'));
      refetchProfile();
    },
    onError: (e) => Alert.alert(t('common.errorTitle'), e.message),
  });

  function onDisable() {
    Alert.alert(
      t('settings.twoFactor.alerts.confirmDisableTitle'),
      t('settings.twoFactor.alerts.confirmDisableMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.disable'), style: 'destructive', onPress: () => disableTotp() },
      ]
    );
  }

  function onVerify() {
    if (pin.length !== 6) {
      Alert.alert(t('common.validation'), t('settings.twoFactor.alerts.invalidCode'));
      return;
    }
    enableTotp({ variables: { data: { pin, secret } } });
  }

  // ── Already enabled ───────────────────────────────────────

  if (isEnabled) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <SettingsHeader title={t('settings.twoFactor.title')} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <IconShieldCheck size={32} color={c.accent} />
            </View>
            <Text style={styles.statusTitle}>{t('settings.twoFactor.enabledTitle')}</Text>
            <Text style={styles.statusDesc}>{t('settings.twoFactor.enabledDesc')}</Text>
          </View>

          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={onDisable}
            disabled={disabling}
            activeOpacity={0.85}
          >
            {disabling
              ? <ActivityIndicator size="small" color={c.danger} />
              : <Text style={styles.dangerBtnText}>{t('settings.twoFactor.disableBtn')}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Not enabled — setup flow ──────────────────────────────

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SettingsHeader title="Two-Factor Auth" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {step === 'idle' && (
          <>
            <View style={styles.statusCard}>
              <View style={[styles.statusIcon, styles.statusIconOff]}>
                <IconShield size={32} color={c.textMuted} />
              </View>
              <Text style={styles.statusTitle}>{t('settings.twoFactor.disabledTitle')}</Text>
              <Text style={styles.statusDesc}>{t('settings.twoFactor.disabledDesc')}</Text>
            </View>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => setStep('setup')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{t('settings.twoFactor.enableBtn')}</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'setup' && (
          <>
            <Text style={styles.stepTitle}>{t('settings.twoFactor.step1Title')}</Text>
            <Text style={styles.stepDesc}>{t('settings.twoFactor.step1Desc')}</Text>

            {loadingSecret ? (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator color={c.accent} />
              </View>
            ) : qrcodeUrl ? (
              <View style={styles.qrWrap}>
                <Image source={{ uri: qrcodeUrl }} style={styles.qr} resizeMode="contain" />
              </View>
            ) : null}

            {secret ? (
              <View style={styles.secretBox}>
                <Text style={styles.secretLabel}>{t('settings.twoFactor.manualKey')}</Text>
                <Text style={styles.secretValue} selectable>{secret}</Text>
              </View>
            ) : null}

            <Text style={styles.stepTitle}>{t('settings.twoFactor.step2Title')}</Text>
            <Text style={styles.stepDesc}>{t('settings.twoFactor.step2Desc')}</Text>

            <View style={styles.card}>
              <View style={styles.pinField}>
                <Text style={styles.fieldLabel}>{t('settings.twoFactor.codeLabel')}</Text>
                <TextInput
                  style={[styles.pinInput, { color: c.textPrimary }]}
                  value={pin}
                  onChangeText={v => setPin(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={c.textMuted}
                  selectionColor={c.accent}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, (pin.length !== 6 || enabling) && styles.btnDisabled]}
              onPress={onVerify}
              disabled={pin.length !== 6 || enabling}
              activeOpacity={0.85}
            >
              {enabling
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={styles.btnText}>{t('settings.twoFactor.verifyBtn')}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('idle')} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  root:    { flex: 1, backgroundColor: c.bg },
  content: { padding: 16, gap: 14 },

  statusCard: {
    backgroundColor: c.card, borderRadius: 14,
    borderWidth: 1, borderColor: c.border,
    padding: 24, alignItems: 'center', gap: 10,
  },
  statusIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(24,185,174,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusIconOff: { backgroundColor: c.bg },
  statusTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  statusDesc:  { fontSize: 13, color: c.textSecondary, textAlign: 'center', lineHeight: 19 },

  btn: { backgroundColor: c.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 15 },

  dangerBtn: {
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
    backgroundColor: 'rgba(229,62,62,0.08)',
    borderWidth: 1, borderColor: 'rgba(229,62,62,0.2)',
  },
  dangerBtnText: { color: c.danger, fontWeight: '700', fontSize: 15 },

  stepTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  stepDesc:  { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  qrWrap: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    alignItems: 'center',
  },
  qr:          { width: 200, height: 200 },
  qrPlaceholder: { height: 232, alignItems: 'center', justifyContent: 'center' },

  secretBox: {
    backgroundColor: c.card, borderRadius: 12,
    borderWidth: 1, borderColor: c.border,
    padding: 14, gap: 4,
  },
  secretLabel: { fontSize: 11, fontWeight: '600', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  secretValue: { fontSize: 14, fontWeight: '600', color: c.accent, fontFamily: 'monospace', letterSpacing: 1 },

  card:     { backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border },
  pinField: { padding: 14, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  pinInput: { fontSize: 24, letterSpacing: 8, paddingVertical: 4, textAlign: 'center' },

  cancelBtn:     { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, color: c.textSecondary },
  });
