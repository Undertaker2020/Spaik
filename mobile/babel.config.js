module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // react-native-reanimated/plugin removed: Reanimated v4+ uses
    // react-native-worklets internally, handled by nativewind/babel preset
  };
};
