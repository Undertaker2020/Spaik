import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Clipboard, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { IconCopy, IconRefresh, IconEye, IconEyeOff, IconServer, IconKey } from '@tabler/icons-react-native';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import { CREATE_INGRESS } from '@/src/graphql/queries/settings.queries';
import { FIND_MY_PROFILE, CHANGE_STREAM_RECORDING, type MyProfile } from '@/src/graphql/queries/profile.queries';

const INGRESS_TYPES = [
  { label: 'RTMP', value: 0 },
  { label: 'WHIP', value: 1 },
];

function KeyField({
  label,
  value,
  icon,
  secret,
}: {
  label: string;
  value: string | null;
  icon: React.ReactNode;
  secret?: boolean;
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [visible, setVisible] = useState(!secret);
  const display = value ?? '— not generated —';
  const masked  = value ? '••••••••••••••••••••' : display;

  function onCopy() {
    if (!value) return;
    Clipboard.setString(value);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  }

  return (
    <View style={styles.keyField}>
      <View style={styles.keyFieldHeader}>
        <View style={styles.keyLabelRow}>
          {icon}
          <Text style={styles.keyLabel}>{label}</Text>
        </View>
        <View style={styles.keyActions}>
          {secret && value && (
            <TouchableOpacity onPress={() => setVisible(v => !v)} hitSlop={8} style={styles.keyActionBtn}>
              {visible ? <IconEyeOff size={15} color={c.textMuted} /> : <IconEye size={15} color={c.textMuted} />}
            </TouchableOpacity>
          )}
          {value && (
            <TouchableOpacity onPress={onCopy} hitSlop={8} style={styles.keyActionBtn}>
              <IconCopy size={15} color={c.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.keyValue} numberOfLines={1} selectable>
        {visible ? display : masked}
      </Text>
    </View>
  );
}

export default function StreamKeysScreen() {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { data, refetch } = useQuery<{ findProfile: MyProfile }>(FIND_MY_PROFILE);
  const stream = data?.findProfile.stream;
  const [selectedType, setSelectedType] = useState(0);

  const [createIngress, { loading }] = useMutation(CREATE_INGRESS, {
    onCompleted: () => { Alert.alert('Success', 'Ingress created. Keys updated.'); refetch(); },
    onError: (e) => Alert.alert('Error', e.message),
  });

  const [isRecording, setIsRecording] = useState(false);
  useEffect(() => { if (stream) setIsRecording(stream.isRecordingEnabled); }, [stream?.isRecordingEnabled]);

  const [changeRecording] = useMutation(CHANGE_STREAM_RECORDING, {
    onError: (e) => Alert.alert('Error', e.message),
  });

  function onToggleRecording(value: boolean) {
    setIsRecording(value);
    changeRecording({ variables: { isEnabled: value } });
  }

  function onGenerate() {
    Alert.alert(
      'Generate new keys',
      'This will invalidate your current stream key. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate', onPress: () => createIngress({ variables: { ingressType: selectedType } }) },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SettingsHeader title="Stream Keys" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <KeyField
            label="Server URL"
            value={stream?.serverUrl ?? null}
            icon={<IconServer size={14} color={c.textMuted} />}
          />
          <View style={styles.divider} />
          <KeyField
            label="Stream Key"
            value={stream?.streamKey ?? null}
            icon={<IconKey size={14} color={c.textMuted} />}
            secret
          />
        </View>

        <View style={styles.recCard}>
          <View style={styles.recInfo}>
            <Text style={styles.recLabel}>Record streams</Text>
            <Text style={styles.recDesc}>Save your live streams as videos on your channel.</Text>
          </View>
          <Switch
            value={isRecording}
            onValueChange={onToggleRecording}
            trackColor={{ false: c.border, true: c.accent }}
            thumbColor="#fff"
            ios_backgroundColor={c.border}
          />
        </View>

        <Text style={styles.sectionLabel}>Ingress type</Text>
        <View style={styles.typeRow}>
          {INGRESS_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeBtn, selectedType === t.value && styles.typeBtnActive]}
              onPress={() => setSelectedType(t.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, selectedType === t.value && styles.typeBtnTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={onGenerate} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator size="small" color="#000" />
            : <>
                <IconRefresh size={16} color="#000" />
                <Text style={styles.btnText}>Generate New Keys</Text>
              </>
          }
        </TouchableOpacity>

        <Text style={styles.hint}>
          Regenerating keys will disconnect any active stream. Use these keys in OBS or a compatible encoder.
        </Text>
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

    recCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border,
      padding: 14,
    },
    recInfo: { flex: 1, gap: 3 },
    recLabel: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
    recDesc: { fontSize: 12, color: c.textSecondary, lineHeight: 16 },

    keyField: { padding: 14, gap: 8 },
    keyFieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    keyLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    keyLabel:     { fontSize: 12, fontWeight: '600', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    keyActions:   { flexDirection: 'row', gap: 8 },
    keyActionBtn: { padding: 2 },
    keyValue:     { fontSize: 13, color: c.textPrimary, fontFamily: 'monospace' },

    sectionLabel: { fontSize: 12, fontWeight: '600', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 2 },

    typeRow: { flexDirection: 'row', gap: 10 },
    typeBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 12,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
      alignItems: 'center',
    },
    typeBtnActive:     { backgroundColor: c.accent, borderColor: c.accent },
    typeBtnText:       { fontSize: 14, fontWeight: '600', color: c.textSecondary },
    typeBtnTextActive: { color: '#000' },

    btn: {
      flexDirection: 'row', gap: 8,
      backgroundColor: c.accent, borderRadius: 14,
      paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
    },
    btnText: { color: '#000', fontWeight: '700', fontSize: 15 },
    hint:    { fontSize: 13, color: c.textMuted, lineHeight: 19, paddingHorizontal: 2 },
  });
