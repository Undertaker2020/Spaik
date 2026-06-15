import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { IconCheck } from '@tabler/icons-react-native';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import { useConfigStore } from '@/src/store/config/config.store';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';
import { languages, LANGUAGE_LABELS, type Language } from '@/src/libs/i18n/config';

export default function LanguageScreen() {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();

  const language = useConfigStore(s => s.language);
  const setLanguage = useConfigStore(s => s.setLanguage);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SettingsHeader title={t('language.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

        <View style={styles.card}>
          {languages.map((lng: Language, i) => {
            const selected = lng === language;
            return (
              <TouchableOpacity
                key={lng}
                style={[styles.row, i < languages.length - 1 && styles.rowBorder]}
                activeOpacity={0.8}
                onPress={() => setLanguage(lng)}
              >
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>{LANGUAGE_LABELS[lng].native}</Text>
                  <Text style={styles.rowDesc}>{t(`language.names.${lng}`)}</Text>
                </View>
                {selected && <IconCheck size={20} color={c.accent} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, gap: 14 },
    subtitle: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },
    card: {
      backgroundColor: c.card, borderRadius: 14,
      borderWidth: 1, borderColor: c.border, overflow: 'hidden',
    },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 14,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    rowInfo: { flex: 1, gap: 3 },
    rowLabel: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
    rowDesc: { fontSize: 12, color: c.textSecondary },
  });
