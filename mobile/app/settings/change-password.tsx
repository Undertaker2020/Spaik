import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client';
import { IconEye, IconEyeOff } from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import { CHANGE_PASSWORD } from '@/src/graphql/queries/settings.queries';

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, { color: COLORS.textPrimary }]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!visible}
          autoCapitalize="none"
          placeholderTextColor={COLORS.textMuted}
          placeholder="••••••••"
          selectionColor={COLORS.accent}
        />
        <TouchableOpacity onPress={() => setVisible(v => !v)} hitSlop={8}>
          {visible
            ? <IconEyeOff size={18} color={COLORS.textMuted} />
            : <IconEye    size={18} color={COLORS.textMuted} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm,     setConfirm]     = useState('');

  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => {
      Alert.alert('Success', 'Password changed successfully.');
      router.back();
    },
    onError: (e) => Alert.alert('Error', e.message),
  });

  function onSubmit() {
    if (!oldPassword || !newPassword || !confirm) {
      Alert.alert('Validation', 'Please fill in all fields.');
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Validation', 'Password must be at least 8 characters.');
      return;
    }
    changePassword({ variables: { data: { oldPassword, newPassword } } });
  }

  const canSubmit = !!oldPassword && !!newPassword && !!confirm && !loading;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SettingsHeader title="Change Password" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <PasswordField label="Current password"  value={oldPassword} onChange={setOldPassword} />
          <View style={styles.divider} />
          <PasswordField label="New password"      value={newPassword} onChange={setNewPassword} />
          <View style={styles.divider} />
          <PasswordField label="Confirm password"  value={confirm}     onChange={setConfirm} />
        </View>

        <TouchableOpacity
          style={[styles.btn, !canSubmit && styles.btnDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={styles.btnText}>Update Password</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: COLORS.border },
  field:   { padding: 14, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, fontSize: 15, paddingVertical: 4 },
  btn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 15 },
});
