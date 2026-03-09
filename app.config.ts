import type { ConfigContext, ExpoConfig } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "RV4All",
  slug: "rv4all",
  newArchEnabled: true,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "rv4all",
  userInterfaceStyle: "dark",
  runtimeVersion: {
    policy: "appVersion",
  },
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    newArchEnabled: true,
    supportsTablet: true,
    bundleIdentifier: "com.rv4all.app",
  },
  android: {
    newArchEnabled: true,
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.rv4all.app",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: ["expo-router", "expo-font", "expo-web-browser"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "",
    },
  },
  owner: "*",
});
