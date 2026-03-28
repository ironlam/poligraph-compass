const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) return "fr.poligraph.boussole.dev";
  if (IS_PREVIEW) return "fr.poligraph.boussole.preview";
  return "fr.poligraph.boussole";
};

const getAppName = () => {
  if (IS_DEV) return "Boussole (Dev)";
  if (IS_PREVIEW) return "Boussole (Preview)";
  return "Ma Boussole Parlementaire";
};

/** @type {import('expo/config').ExpoConfig} */
export default {
  name: getAppName(),
  slug: "boussole-politique",
  scheme: "boussole",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  platforms: ["ios", "android", "web"],

  // Assets
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#1e1b4b",
  },

  // iOS
  ios: {
    supportsTablet: false,
    bundleIdentifier: getUniqueIdentifier(),
    config: {
      usesNonExemptEncryption: false,
    },
  },

  // Android
  android: {
    package: getUniqueIdentifier(),
    adaptiveIcon: {
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },

  // Web
  web: {
    bundler: "metro",
    output: "server",
    favicon: "./assets/favicon.png",
  },

  // Plugins
  plugins: ["expo-router"],
};
