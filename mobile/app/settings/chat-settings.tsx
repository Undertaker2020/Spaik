import { View, Text, Switch, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import { CHANGE_CHAT_SETTINGS } from '@/src/graphql/queries/settings.queries';
import { FIND_MY_PROFILE, type MyProfile } from '@/src/graphql/queries/profile.queries';

function Toggle({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: c.border, true: c.accent }}
        thumbColor="#fff"
        ios_backgroundColor={c.border}
      />
    </View>
  );
}

export default function ChatSettingsScreen() {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { data, refetch } = useQuery<{ findProfile: MyProfile }>(FIND_MY_PROFILE);
  const stream = data?.findProfile.stream;

  const [enabled,        setEnabled]        = useState(true);
  const [followersOnly,  setFollowersOnly]   = useState(false);
  const [premiumOnly,    setPremiumOnly]     = useState(false);
  const [isDirty,        setIsDirty]         = useState(false);

  useEffect(() => {
    if (stream) {
      setEnabled(stream.isChatEnabled);
      setFollowersOnly(stream.isChatFollowersOnly);
      setPremiumOnly(stream.isChatPremiumFollowersOnly);
      setIsDirty(false);
    }
  }, [stream]);

  const [save, { loading }] = useMutation(CHANGE_CHAT_SETTINGS, {
    onCompleted: () => { Alert.alert(t('settings.chat.alerts.savedTitle'), t('settings.chat.alerts.saved')); setIsDirty(false); refetch(); },
    onError: (e) => Alert.alert(t('common.errorTitle'), e.message),
  });

  function handleChange(field: 'enabled' | 'followers' | 'premium', value: boolean) {
    if (field === 'enabled')   setEnabled(value);
    if (field === 'followers') setFollowersOnly(value);
    if (field === 'premium')   setPremiumOnly(value);
    setIsDirty(true);
  }

  function onSave() {
    save({ variables: { data: {
      isChatEnabled: enabled,
      isChatFollowersOnly: followersOnly,
      isChatPremiumFollowersOnly: premiumOnly,
    }}});
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SettingsHeader
        title={t('settings.chat.title')}
        right={
          isDirty ? (
            <TouchableOpacity onPress={onSave} disabled={loading} style={styles.saveBtn}>
              {loading
                ? <ActivityIndicator size="small" color={c.accent} />
                : <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              }
            </TouchableOpacity>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Toggle
            label={t('settings.chat.enable')}
            description={t('settings.chat.enableDesc')}
            value={enabled}
            onChange={v => handleChange('enabled', v)}
          />
          <View style={styles.divider} />
          <Toggle
            label={t('settings.chat.followersOnly')}
            description={t('settings.chat.followersOnlyDesc')}
            value={followersOnly}
            onChange={v => handleChange('followers', v)}
            disabled={!enabled}
          />
          <View style={styles.divider} />
          <Toggle
            label={t('settings.chat.sponsorsOnly')}
            description={t('settings.chat.sponsorsOnlyDesc')}
            value={premiumOnly}
            onChange={v => handleChange('premium', v)}
            disabled={!enabled}
          />
        </View>

        {!enabled && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{t('settings.chat.disabledInfo')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root:    { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, gap: 14 },

    card: { backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
    divider: { height: 1, backgroundColor: c.border },

    toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    toggleRowDisabled: { opacity: 0.45 },
    toggleInfo: { flex: 1 },
    toggleLabel: { fontSize: 15, fontWeight: '600', color: c.textPrimary, marginBottom: 3 },
    toggleDesc:  { fontSize: 12, color: c.textSecondary, lineHeight: 17 },

    saveBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(24,185,174,0.15)' },
    saveBtnText: { fontSize: 14, fontWeight: '700', color: c.accent },

    infoBox: {
      backgroundColor: 'rgba(229,62,62,0.08)',
      borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: 'rgba(229,62,62,0.2)',
    },
    infoText: { fontSize: 13, color: c.danger, lineHeight: 19 },
  });
