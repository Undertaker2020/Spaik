import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  IconHome2,
  IconDeviceTv,
  IconBroadcast,
  IconUsers,
  IconUser,
} from '@tabler/icons-react-native';
import { useColors, useThemedStyles } from '@/src/libs/theme/use-theme';
import type { Palette } from '@/src/libs/theme/palettes';

const TABS = [
  { routeName: 'index',     labelKey: 'nav.home',      Icon: IconHome2,     isCenter: false },
  { routeName: 'streams',   labelKey: 'nav.streams',   Icon: IconDeviceTv,  isCenter: false },
  { routeName: 'go-live',   labelKey: null,             Icon: IconBroadcast, isCenter: true  },
  { routeName: 'following', labelKey: 'nav.following', Icon: IconUsers,     isCenter: false },
  { routeName: 'profile',   labelKey: 'nav.profile',   Icon: IconUser,      isCenter: false },
] as const;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const tab = TABS[index];
          if (!tab) return null;

          const isFocused = state.index === index;
          const isLast = index === state.routes.length - 1;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          if (tab.isCenter) {
            return (
              <View key={route.key} style={styles.itemOuter}>
                <TouchableOpacity onPress={onPress} style={styles.centerWrap} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[c.accent, c.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.centerBtn}
                  >
                    <tab.Icon size={24} color="#000" strokeWidth={2.2} />
                  </LinearGradient>
                </TouchableOpacity>
                {!isLast && <View style={styles.divider} />}
              </View>
            );
          }

          const color = isFocused ? c.accent : c.textMuted;

          return (
            <View key={route.key} style={styles.itemOuter}>
              <TouchableOpacity onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
                <tab.Icon size={22} color={color} strokeWidth={isFocused ? 2 : 1.5} />
                <Text style={[styles.label, { color }]}>{tab.labelKey ? t(tab.labelKey) : ''}</Text>
              </TouchableOpacity>
              {!isLast && <View style={styles.divider} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    outer: {
      paddingHorizontal: 20,
      paddingTop: 6,
      backgroundColor: c.bg,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      // A *raised* surface: lighter than the screen bg so it reads as a floating pill.
      backgroundColor: c.card,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 4,
      paddingVertical: 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
        },
        android: {
          shadowColor: '#000',
          elevation: 8,
        },
      }),
    },
    itemOuter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      gap: 3,
    },
    label: {
      fontSize: 10,
      fontWeight: '500',
    },
    divider: {
      width: 1,
      height: 22,
      backgroundColor: c.border,
    },
    centerWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    centerBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: c.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.7,
          shadowRadius: 12,
        },
        android: {
          shadowColor: c.accent,
          elevation: 9,
        },
      }),
    },
  });
