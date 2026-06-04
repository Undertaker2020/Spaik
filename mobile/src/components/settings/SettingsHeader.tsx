import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';

export function SettingsHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
        <IconArrowLeft size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    flex: 1, textAlign: 'center',
    fontSize: 17, fontWeight: '700', color: COLORS.textPrimary,
  },
  right: { width: 36, alignItems: 'flex-end' },
});
