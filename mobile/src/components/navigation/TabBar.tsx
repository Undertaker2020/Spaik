import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconHome2,
  IconDeviceTv,
  IconBroadcast,
  IconUsers,
  IconUser,
} from '@tabler/icons-react-native';
import { COLORS } from '@/src/libs/constants/colors';

const TABS = [
  { routeName: 'index',     label: 'Home',      Icon: IconHome2,     isCenter: false },
  { routeName: 'streams',   label: 'Streams',   Icon: IconDeviceTv,  isCenter: false },
  { routeName: 'go-live',   label: null,         Icon: IconBroadcast, isCenter: true  },
  { routeName: 'following', label: 'Following', Icon: IconUsers,     isCenter: false },
  { routeName: 'profile',   label: 'Profile',   Icon: IconUser,      isCenter: false },
] as const;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

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
                    colors={['#18B9AE', '#0E8F86']}
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

          const color = isFocused ? COLORS.accent : COLORS.textDisabled;

          return (
            <View key={route.key} style={styles.itemOuter}>
              <TouchableOpacity onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
                <tab.Icon size={22} color={color} strokeWidth={isFocused ? 2 : 1.5} />
                <Text style={[styles.label, { color }]}>{tab.label}</Text>
              </TouchableOpacity>
              {!isLast && <View style={styles.divider} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 20,
    paddingTop: 6,
    backgroundColor: COLORS.bg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 17, 26, 0.96)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
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
        elevation: 14,
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
    backgroundColor: 'rgba(255,255,255,0.07)',
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
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
});
