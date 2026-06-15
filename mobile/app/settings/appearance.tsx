import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { IconCheck } from '@tabler/icons-react-native';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import { useConfigStore } from '@/src/store/config/config.store';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import { ACCENTS, type AccentKey, type Palette } from '@/src/libs/theme/palettes';

export default function AppearanceScreen() {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();

  const mode = useConfigStore(s => s.mode);
  const setMode = useConfigStore(s => s.setMode);
  const accent = useConfigStore(s => s.theme);
  const setAccent = useConfigStore(s => s.setTheme);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SettingsHeader title={t('appearance.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dark / light */}
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>{t('appearance.darkMode')}</Text>
            <Text style={styles.rowDesc}>{t('appearance.darkModeDesc')}</Text>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={v => setMode(v ? 'dark' : 'light')}
            trackColor={{ false: c.border, true: c.accent }}
            thumbColor="#fff"
            ios_backgroundColor={c.border}
          />
        </View>

        {/* Accent colour */}
        <Text style={styles.sectionLabel}>{t('appearance.accentColor')}</Text>
        <View style={styles.accentRow}>
          {(Object.keys(ACCENTS) as AccentKey[]).map(key => {
            const selected = key === accent;
            return (
              <TouchableOpacity
                key={key}
                style={styles.accentItem}
                activeOpacity={0.8}
                onPress={() => setAccent(key)}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: ACCENTS[key].accent },
                    selected && styles.swatchSelected,
                  ]}
                >
                  {selected && <IconCheck size={18} color="#fff" />}
                </View>
                <Text style={styles.accentLabel}>{t(`appearance.accents.${key}`)}</Text>
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
    content: { padding: 16, gap: 18 },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border,
      padding: 14,
    },
    rowInfo: { flex: 1, gap: 3 },
    rowLabel: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
    rowDesc: { fontSize: 12, color: c.textSecondary, lineHeight: 16 },
    sectionLabel: {
      fontSize: 12, fontWeight: '600', color: c.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    accentRow: { flexDirection: 'row', gap: 16 },
    accentItem: { alignItems: 'center', gap: 6 },
    swatch: {
      width: 46, height: 46, borderRadius: 23,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: 'transparent',
    },
    swatchSelected: { borderColor: c.textPrimary },
    accentLabel: { fontSize: 11, color: c.textSecondary },
  });
