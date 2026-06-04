export type ThemeColor = 'turquoise' | 'purple' | 'blue' | 'green';

export interface ConfigStore {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}
