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
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import {
  IconArrowLeft,
  IconCamera,
  IconTrash,
} from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';
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
    onError: (e) => Alert.alert('Error', e.message),
  });

  const [removeAvatar, { loading: removingAvatar }] = useMutation(REMOVE_PROFILE_AVATAR, {
    onCompleted: () => { setAvatarUri(null); setAvatarChanged(true); refetch(); },
    onError: (e) => Alert.alert('Error', e.message),
  });

  const textIsDirty =
    username !== (user?.username ?? '') ||
    displayName !== (user?.displayName ?? '') ||
    bio !== (user?.bio ?? '');

  const isDirty = avatarChanged || textIsDirty;

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to change the avatar.');
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
      Alert.alert('Upload failed', e.message);
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
      Alert.alert('Validation', 'Username cannot be empty.');
      return;
    }
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Display name cannot be empty.');
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
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <IconArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isDirty || isBusy}
          style={[styles.saveBtn, (!isDirty || isBusy) && styles.saveBtnDisabled]}
          activeOpacity={0.8}
        >
          {savingInfo ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
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
                'Remove avatar',
                'Are you sure you want to remove your avatar?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => removeAvatar() },
                ]
              )}
              disabled={isBusy}
              style={styles.removeAvatarBtn}
              activeOpacity={0.7}
            >
              <IconTrash size={14} color={COLORS.danger} />
              <Text style={styles.removeAvatarText}>Remove avatar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="your_username"
            autoCapitalize="none"
            hint="Unique identifier for your channel URL."
            editable={!isBusy}
          />
          <View style={styles.divider} />
          <Field
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your Name"
            hint="This is how your name appears to others."
            editable={!isBusy}
          />
          <View style={styles.divider} />
          <Field
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people about yourself…"
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
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, inputStyle]}
        placeholderTextColor={COLORS.textMuted}
        selectionColor={COLORS.accent}
        {...inputProps}
      />
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.card,
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  saveBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
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
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: COLORS.accent },
  cameraBtn: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.bg,
  },
  removeAvatarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  removeAvatarText: { color: COLORS.danger, fontSize: 13 },

  // Form
  form: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 32,
  },
  divider: { height: 1, backgroundColor: COLORS.border },
  field: { padding: 14, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: { fontSize: 15, color: COLORS.textPrimary, paddingVertical: 4 },
  fieldHint: { fontSize: 12, color: COLORS.textMuted },
  bioInput: { minHeight: 72, textAlignVertical: 'top' },
});
