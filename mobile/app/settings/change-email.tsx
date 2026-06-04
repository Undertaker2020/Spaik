import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client';
import { IconMail } from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import { CHANGE_EMAIL } from '@/src/graphql/queries/settings.queries';
import { FIND_MY_PROFILE, type MyProfile } from '@/src/graphql/queries/profile.queries';

export default function ChangeEmailScreen() {
  const router = useRouter();

  const { data } = useQuery<{ findProfile: MyProfile }>(FIND_MY_PROFILE);
  const [email, setEmail] = useState('');

  const [changeEmail, { loading }] = useMutation(CHANGE_EMAIL, {
    onCompleted: () => {
      Alert.alert('Success', 'Confirmation sent to new email address.');
      router.back();
    },
    onError: (e) => Alert.alert('Error', e.message),
  });

  function onSubmit() {
    if (!email.trim()) {
      Alert.alert('Validation', 'Please enter an email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Validation', 'Please enter a valid email address.');
      return;
    }
    changeEmail({ variables: { data: { email: email.trim() } } });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SettingsHeader title="Change Email" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {data?.findProfile.email && (
          <View style={styles.currentWrap}>
            <IconMail size={16} color={COLORS.textMuted} />
            <Text style={styles.currentLabel}>Current: </Text>
            <Text style={styles.currentValue}>{data.findProfile.email}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>New email address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={COLORS.accent}
              color={COLORS.textPrimary}
            />
          </View>
        </View>

        <Text style={styles.hint}>
          A confirmation link will be sent to the new address. Your email won't change until you confirm.
        </Text>

        <TouchableOpacity
          style={[styles.btn, (!email.trim() || loading) && styles.btnDisabled]}
          onPress={onSubmit}
          disabled={!email.trim() || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={styles.btnText}>Send Confirmation</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 16 },
  currentWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.card, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  currentLabel: { fontSize: 13, color: COLORS.textSecondary },
  currentValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  field: { padding: 14, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { fontSize: 15, paddingVertical: 4 },
  hint: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  btn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 15 },
});
