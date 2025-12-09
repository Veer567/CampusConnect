export default ({ config }) => ({
  expo: {
    name: "CampusConnect",
    slug: "Spotlight",
    version: "1.0.0",
    orientation: "portrait",

    icon: "./assets/splash/image2.png",
    scheme: "spotlight",
    userInterfaceStyle: "automatic",

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.vir567.Spotlight",
      buildNumber: "1",
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/splash/image2.png",
        backgroundColor: "#ffffff",
      },
      softwareKeyboardLayoutMode: "pan",
      edgeToEdgeEnabled: false,
      package: "com.vir567.Spotlight",
      versionCode: 1,
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash/image2.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-secure-store",
      "expo-font",
      "expo-web-browser",
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      router: {},
      openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      eas: {
        projectId: "bfeea64c-946c-4d50-8b0c-9e0d0d495f52",
      },
    },

    runtimeVersion: {
      policy: "appVersion",
    },

    updates: {
      url: "https://u.expo.dev/bfeea64c-946c-4d50-8b0c-9e0d0d495f52",
      fallbackToCacheTimeout: 0,
    },
  },
});
