const { withAndroidStyles } = require("@expo/config-plugins");

module.exports = function withDisableForceDark(config) {
  return withAndroidStyles(config, (config) => {
    config.modResults.resources.style = [
      ...(config.modResults.resources.style || []),
      {
        $: {
          name: "AppTheme",
          parent: "Theme.AppCompat.Light.NoActionBar",
        },
        item: [
          {
            $: { name: "android:forceDarkAllowed" },
            _: "false",
          },
        ],
      },
    ];

    return config;
  });
};
