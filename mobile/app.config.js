// Dynamic Expo config. The LAN host (your machine's IP) comes from the
// EXPO_PUBLIC_HOST env var (see .env / .env.example) instead of being baked
// into app.json, so the build isn't tied to one machine. Ports are stable.
const HOST = process.env.EXPO_PUBLIC_HOST ?? 'localhost';

if (!process.env.EXPO_PUBLIC_HOST) {
  // eslint-disable-next-line no-console
  console.warn(
    '[app.config] EXPO_PUBLIC_HOST is not set — falling back to "localhost". ' +
      "A device/emulator can't reach the backend on localhost; set it to your " +
      "machine's LAN IP in mobile/.env (see .env.example).",
  );
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [...(config.plugins ?? []), 'expo-video'],
  extra: {
    ...config.extra,
    apiUrl: `http://${HOST}:4000/graphql`,
    gatewayUrl: `http://${HOST}:4002/graphql`,
    chatWsUrl: `ws://${HOST}:4002/graphql`,
    wsUrl: `ws://${HOST}:4000/graphql`,
    mediaUrl: `http://${HOST}:9000/spaik-media`,
    recordingsUrl: `http://${HOST}:9000/spaik-recordings`,
    livekitWsUrl: `ws://${HOST}:7880`,
  },
});
