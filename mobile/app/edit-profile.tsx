import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import {
  IconArrowLeft,
  IconCamera,
  IconTrash,
} from '@tabler/icons-react-native';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import { SERVER_URL } from '@/src/libs/constants/url.constants';
import { getMediaSource } from '@/src/libs/utils/get-media-source';
import {
  FIND_MY_PROFILE,
  CHANGE_PROFILE_INFO,
  REMOVE_PROFILE_AVATAR,
  type MyProfile,
} from '@/src/graphql/queries/profile.queries';

const AVATAR_SIZE = 88;

export default function EditProfileScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();

  const { data, loading: profileLoading, refetch } = useQuery<{
    findProfile: MyProfile;
  }>(FIND_MY_PROFILE);

  const user = data?.findProfile;

  const [username, setUsername]       = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio]                 = useState('');
  const [avatarUri, setAvatarUri]       = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setDisplayName(user.displayName);
      setBio(user.bio ?? '');
    }
  }, [user]);

  const [changeInfo, { loading: savingInfo }] = useMutation(CHANGE_PROFILE_INFO, {
    onCompleted: () => { refetch(); router.back(); },
    onError: (e) => Alert.alert(t('common.errorTitle'), e.message),
  });

  const [removeAvatar, { loading: removingAvatar }] = useMutation(REMOVE_PROFILE_AVATAR, {
    onCompleted: () => { setAvatarUri(null); setAvatarChanged(true); refetch(); },
    onError: (e) => Alert.alert(t('common.errorTitle'), e.message),
  });

  const textIsDirty =
    username !== (user?.username ?? '') ||
    displayName !== (user?.displayName ?? '') ||
    bio !== (user?.bio ?? '');

  const isDirty = avatarChanged || textIsDirty;

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('editProfile.alerts.permissionTitle'), t('editProfile.alerts.permissionMsg'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    await uploadAvatar(asset.uri);
  }

  async function uploadAvatar(uri: string) {
    setUploadingAvatar(true);
    try {
      const body = new FormData();
      body.append('operations', JSON.stringify({
        query: 'mutation ChangeProfileAvatar($avatar: Upload!) { changeProfileAvatar(avatar: $avatar) }',
        variables: { avatar: null },
      }));
      body.append('map', JSON.stringify({ '0': ['variables.avatar'] }));
      body.append('0', {
        uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const res = await fetch(SERVER_URL, {
        method: 'POST',
        body,
        credentials: 'include',
        headers: { 'Apollo-Require-Preflight': 'true' },
      });
      const json = await res.json();
      if (json.errors?.length) throw new Error(json.errors[0].message);

      setAvatarUri(uri);
      setAvatarChanged(true);
      refetch();
    } catch (e: any) {
      Alert.alert(t('editProfile.alerts.uploadFailed'), e.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleSave() {
    if (!textIsDirty) {
      router.back();
      return;
    }
    if (!username.trim()) {
      Alert.alert(t('common.validation'), t('editProfile.alerts.usernameEmpty'));
      return;
    }
    if (!displayName.trim()) {
      Alert.alert(t('common.validation'), t('editProfile.alerts.displayNameEmpty'));
      return;
    }
    changeInfo({ variables: { data: { username: username.trim(), displayName: displayName.trim(), bio: bio.trim() } } });
  }

  const isBusy = savingInfo || uploadingAvatar || removingAvatar;
  const currentAvatar = avatarUri ?? getMediaSource(user?.avatar ?? null);

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <IconArrowLeft size={22} color={c.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('editProfile.title')}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isDirty || isBusy}
          style={[styles.saveBtn, (!isDirty || isBusy) && styles.saveBtnDisabled]}
          activeOpacity={0.8}
        >
          {savingInfo ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {(user?.username ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={pickAvatar}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconCamera size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {(user?.avatar || avatarUri) && (
            <TouchableOpacity
              onPress={() => Alert.alert(
                t('editProfile.alerts.removeAvatarTitle'),
                t('editProfile.alerts.removeAvatarMsg'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('common.remove'), style: 'destructive', onPress: () => removeAvatar() },
                ]
              )}
              disabled={isBusy}
              style={styles.removeAvatarBtn}
              activeOpacity={0.7}
            >
              <IconTrash size={14} color={c.danger} />
              <Text style={styles.removeAvatarText}>{t('editProfile.removeAvatar')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field
            label={t('editProfile.usernameLabel')}
            value={username}
            onChangeText={setUsername}
            placeholder={t('editProfile.usernamePlaceholder')}
            autoCapitalize="none"
            hint={t('editProfile.usernameHint')}
            editable={!isBusy}
          />
          <View style={styles.divider} />
          <Field
            label={t('editProfile.displayNameLabel')}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('editProfile.displayNamePlaceholder')}
            hint={t('editProfile.displayNameHint')}
            editable={!isBusy}
          />
          <View style={styles.divider} />
          <Field
            label={t('editProfile.bioLabel')}
            value={bio}
            onChangeText={setBio}
            placeholder={t('editProfile.bioPlaceholder')}
            multiline
            inputStyle={styles.bioInput}
            editable={!isBusy}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Field component ────────────────────────────────────────────

function Field({
  label,
  hint,
  inputStyle,
  ...inputProps
}: {
  label: string;
  hint?: string;
  inputStyle?: object;
} & React.ComponentProps<typeof TextInput>) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, inputStyle]}
        placeholderTextColor={c.textMuted}
        selectionColor={c.accent}
        {...inputProps}
      />
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  headerBtn: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: c.card,
  },
  title: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  saveBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: c.accent,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 28, gap: 12 },
  avatarWrap: { position: 'relative' },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarFallback: {
    backgroundColor: c.card,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: c.accent },
  cameraBtn: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: c.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: c.bg,
  },
  removeAvatarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  removeAvatarText: { color: c.danger, fontSize: 13 },

  // Form
  form: {
    marginHorizontal: 16,
    backgroundColor: c.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 32,
  },
  divider: { height: 1, backgroundColor: c.border },
  field: { padding: 14, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: { fontSize: 15, color: c.textPrimary, paddingVertical: 4 },
  fieldHint: { fontSize: 12, color: c.textMuted },
  bioInput: { minHeight: 72, textAlignVertical: 'top' },
});
