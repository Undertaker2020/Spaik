import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { IconShieldCheck, IconShield } from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import {
  GENERATE_TOTP_SECRET,
  ENABLE_TOTP,
  DISABLE_TOTP,
} from '@/src/graphql/queries/settings.queries';
import { FIND_MY_PROFILE, type MyProfile } from '@/src/graphql/queries/profile.queries';

export default function TwoFactorScreen() {
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
      Alert.alert('Enabled', 'Two-factor authentication is now active.');
      setStep('idle');
      setPin('');
      refetchProfile();
    },
    onError: (e) => Alert.alert('Error', e.message),
  });

  const [disableTotp, { loading: disabling }] = useMutation(DISABLE_TOTP, {
    onCompleted: () => {
      Alert.alert('Disabled', 'Two-factor authentication has been turned off.');
      refetchProfile();
    },
    onError: (e) => Alert.alert('Error', e.message),
  });

  function onDisable() {
    Alert.alert(
      'Disable 2FA',
      'Your account will be less secure. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: () => disableTotp() },
      ]
    );
  }

  function onVerify() {
    if (pin.length !== 6) {
      Alert.alert('Validation', 'Enter the 6-digit code from your authenticator app.');
      return;
    }
    enableTotp({ variables: { data: { pin, secret } } });
  }

  // ── Already enabled ───────────────────────────────────────

  if (isEnabled) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <SettingsHeader title="Two-Factor Auth" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <IconShieldCheck size={32} color={COLORS.accent} />
            </View>
            <Text style={styles.statusTitle}>2FA is enabled</Text>
            <Text style={styles.statusDesc}>
              Your account is protected with two-factor authentication.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={onDisable}
            disabled={disabling}
            activeOpacity={0.85}
          >
            {disabling
              ? <ActivityIndicator size="small" color={COLORS.danger} />
              : <Text style={styles.dangerBtnText}>Disable Two-Factor Auth</Text>
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
                <IconShield size={32} color={COLORS.textMuted} />
              </View>
              <Text style={styles.statusTitle}>2FA is disabled</Text>
              <Text style={styles.statusDesc}>
                Add an extra layer of security by requiring a code from your authenticator app when signing in.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => setStep('setup')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Enable Two-Factor Auth</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'setup' && (
          <>
            <Text style={styles.stepTitle}>Step 1 — Scan QR code</Text>
            <Text style={styles.stepDesc}>
              Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code.
            </Text>

            {loadingSecret ? (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator color={COLORS.accent} />
              </View>
            ) : qrcodeUrl ? (
              <View style={styles.qrWrap}>
                <Image source={{ uri: qrcodeUrl }} style={styles.qr} resizeMode="contain" />
              </View>
            ) : null}

            {secret ? (
              <View style={styles.secretBox}>
                <Text style={styles.secretLabel}>Manual entry key</Text>
                <Text style={styles.secretValue} selectable>{secret}</Text>
              </View>
            ) : null}

            <Text style={styles.stepTitle}>Step 2 — Enter verification code</Text>
            <Text style={styles.stepDesc}>
              Enter the 6-digit code shown in your authenticator app to confirm setup.
            </Text>

            <View style={styles.card}>
              <View style={styles.pinField}>
                <Text style={styles.fieldLabel}>Verification code</Text>
                <TextInput
                  style={styles.pinInput}
                  value={pin}
                  onChangeText={v => setPin(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={COLORS.textMuted}
                  selectionColor={COLORS.accent}
                  color={COLORS.textPrimary}
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
                : <Text style={styles.btnText}>Verify & Enable</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('idle')} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, gap: 14 },

  statusCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 24, alignItems: 'center', gap: 10,
  },
  statusIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(24,185,174,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusIconOff: { backgroundColor: COLORS.bg },
  statusTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  statusDesc:  { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 },

  btn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 15 },

  dangerBtn: {
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
    backgroundColor: 'rgba(229,62,62,0.08)',
    borderWidth: 1, borderColor: 'rgba(229,62,62,0.2)',
  },
  dangerBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },

  stepTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  stepDesc:  { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  qrWrap: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    alignItems: 'center',
  },
  qr:          { width: 200, height: 200 },
  qrPlaceholder: { height: 232, alignItems: 'center', justifyContent: 'center' },

  secretBox: {
    backgroundColor: COLORS.card, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14, gap: 4,
  },
  secretLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  secretValue: { fontSize: 14, fontWeight: '600', color: COLORS.accent, fontFamily: 'monospace', letterSpacing: 1 },

  card:     { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  pinField: { padding: 14, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  pinInput: { fontSize: 24, letterSpacing: 8, paddingVertical: 4, textAlign: 'center' },

  cancelBtn:     { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, color: COLORS.textSecondary },
});
