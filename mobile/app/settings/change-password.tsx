import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { IconEye, IconEyeOff } from '@tabler/icons-react-native';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import { CHANGE_PASSWORD } from '@/src/graphql/queries/settings.queries';

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, { color: c.textPrimary }]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!visible}
          autoCapitalize="none"
          placeholderTextColor={c.textMuted}
          placeholder="••••••••"
          selectionColor={c.accent}
        />
        <TouchableOpacity onPress={() => setVisible(v => !v)} hitSlop={8}>
          {visible
            ? <IconEyeOff size={18} color={c.textMuted} />
            : <IconEye    size={18} color={c.textMuted} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm,     setConfirm]     = useState('');

  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => {
      Alert.alert(t('common.successTitle'), t('settings.changePassword.alerts.success'));
      router.back();
    },
    onError: (e) => Alert.alert(t('common.errorTitle'), e.message),
  });

  function onSubmit() {
    if (!oldPassword || !newPassword || !confirm) {
      Alert.alert(t('common.validation'), t('settings.changePassword.alerts.fillAll'));
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert(t('common.validation'), t('settings.changePassword.alerts.mismatch'));
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(t('common.validation'), t('settings.changePassword.alerts.tooShort'));
      return;
    }
    changePassword({ variables: { data: { oldPassword, newPassword } } });
  }

  const canSubmit = !!oldPassword && !!newPassword && !!confirm && !loading;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SettingsHeader title={t('settings.changePassword.title')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <PasswordField label={t('settings.changePassword.current')}  value={oldPassword} onChange={setOldPassword} />
          <View style={styles.divider} />
          <PasswordField label={t('settings.changePassword.new')}      value={newPassword} onChange={setNewPassword} />
          <View style={styles.divider} />
          <PasswordField label={t('settings.changePassword.confirm')}  value={confirm}     onChange={setConfirm} />
        </View>

        <TouchableOpacity
          style={[styles.btn, !canSubmit && styles.btnDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={styles.btnText}>{t('settings.changePassword.submit')}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root:    { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, gap: 16 },
    card: {
      backgroundColor: c.card, borderRadius: 14,
      borderWidth: 1, borderColor: c.border, overflow: 'hidden',
    },
    divider: { height: 1, backgroundColor: c.border },
    field:   { padding: 14, gap: 6 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: { flex: 1, fontSize: 15, paddingVertical: 4 },
    btn: {
      backgroundColor: c.accent, borderRadius: 14,
      paddingVertical: 15, alignItems: 'center',
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  });
