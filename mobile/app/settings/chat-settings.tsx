import { View, Text, Switch, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { COLORS } from '@/src/libs/constants/colors';
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
        trackColor={{ false: COLORS.border, true: COLORS.accent }}
        thumbColor="#fff"
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );
}

export default function ChatSettingsScreen() {
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
    onCompleted: () => { Alert.alert('Saved', 'Chat settings updated.'); setIsDirty(false); refetch(); },
    onError: (e) => Alert.alert('Error', e.message),
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
        title="Chat Settings"
        right={
          isDirty ? (
            <TouchableOpacity onPress={onSave} disabled={loading} style={styles.saveBtn}>
              {loading
                ? <ActivityIndicator size="small" color={COLORS.accent} />
                : <Text style={styles.saveBtnText}>Save</Text>
              }
            </TouchableOpacity>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Toggle
            label="Enable chat"
            description="Allow viewers to send messages during your stream."
            value={enabled}
            onChange={v => handleChange('enabled', v)}
          />
          <View style={styles.divider} />
          <Toggle
            label="Followers only"
            description="Only followers can send messages."
            value={followersOnly}
            onChange={v => handleChange('followers', v)}
            disabled={!enabled}
          />
          <View style={styles.divider} />
          <Toggle
            label="Sponsors only"
            description="Only paying sponsors can send messages."
            value={premiumOnly}
            onChange={v => handleChange('premium', v)}
            disabled={!enabled}
          />
        </View>

        {!enabled && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Chat is disabled. Viewers will not be able to send messages during your stream.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, gap: 14 },

  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: COLORS.border },

  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  toggleRowDisabled: { opacity: 0.45 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  toggleDesc:  { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },

  saveBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(24,185,174,0.15)' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.accent },

  infoBox: {
    backgroundColor: 'rgba(229,62,62,0.08)',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(229,62,62,0.2)',
  },
  infoText: { fontSize: 13, color: COLORS.danger, lineHeight: 19 },
});
