import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { IconMail } from '@tabler/icons-react-native';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import { CHANGE_EMAIL } from '@/src/graphql/queries/settings.queries';
import { FIND_MY_PROFILE, type MyProfile } from '@/src/graphql/queries/profile.queries';

export default function ChangeEmailScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();

  const { data } = useQuery<{ findProfile: MyProfile }>(FIND_MY_PROFILE);
  const [email, setEmail] = useState('');

  const [changeEmail, { loading }] = useMutation(CHANGE_EMAIL, {
    onCompleted: () => {
      Alert.alert(t('common.successTitle'), t('settings.changeEmail.alerts.success'));
      router.back();
    },
    onError: (e) => Alert.alert(t('common.errorTitle'), e.message),
  });

  function onSubmit() {
    if (!email.trim()) {
      Alert.alert(t('common.validation'), t('settings.changeEmail.alerts.enter'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('common.validation'), t('settings.changeEmail.alerts.invalid'));
      return;
    }
    changeEmail({ variables: { data: { email: email.trim() } } });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SettingsHeader title={t('settings.changeEmail.title')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {data?.findProfile.email && (
          <View style={styles.currentWrap}>
            <IconMail size={16} color={c.textMuted} />
            <Text style={styles.currentLabel}>{t('settings.changeEmail.current')}</Text>
            <Text style={styles.currentValue}>{data.findProfile.email}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('settings.changeEmail.newLabel')}</Text>
            <TextInput
              style={[styles.input, { color: c.textPrimary }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={c.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={c.accent}
            />
          </View>
        </View>

        <Text style={styles.hint}>{t('settings.changeEmail.hint')}</Text>

        <TouchableOpacity
          style={[styles.btn, (!email.trim() || loading) && styles.btnDisabled]}
          onPress={onSubmit}
          disabled={!email.trim() || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={styles.btnText}>{t('settings.changeEmail.submit')}</Text>
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
    currentWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: c.card, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 12,
      borderWidth: 1, borderColor: c.border,
    },
    currentLabel: { fontSize: 13, color: c.textSecondary },
    currentValue: { fontSize: 13, fontWeight: '600', color: c.textPrimary, flex: 1 },
    card: { backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border },
    field: { padding: 14, gap: 6 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { fontSize: 15, paddingVertical: 4 },
    hint: { fontSize: 13, color: c.textMuted, lineHeight: 19 },
    btn: { backgroundColor: c.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  });
