// The "Developed by ZeroD Software" line at the bottom of the Android 12+ splash. expo-splash-screen has no
// option for the branding image, so this copies the kit's PNGs into res/ and adds the one style item.
// Listed BEFORE expo-splash-screen in app.json: mods run last-listed first, and the splash plugin rebuilds
// Theme.App.SplashScreen from scratch, so this has to run after it.
// ponytail: Android only; the app ships for Android.
const fs = require('fs');
const path = require('path');
const { withAndroidStyles, withDangerousMod } = require('expo/config-plugins');

const DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const ITEM = 'android:windowSplashScreenBrandingImage';

module.exports = function withSplashBranding(config, { resDir }) {
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const res = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res');
      for (const night of ['', '-night']) {
        for (const density of DENSITIES) {
          const folder = `drawable${night}-${density}`;
          const src = path.join(cfg.modRequest.projectRoot, resDir, folder, 'splash_branding.png');
          fs.mkdirSync(path.join(res, folder), { recursive: true });
          fs.copyFileSync(src, path.join(res, folder, 'splash_branding.png'));
        }
      }
      return cfg;
    },
  ]);

  return withAndroidStyles(config, (cfg) => {
    const splash = cfg.modResults.resources.style?.find((s) => s.$.name === 'Theme.App.SplashScreen');
    if (!splash) throw new Error('with-splash-branding: Theme.App.SplashScreen not found; list this plugin before expo-splash-screen in app.json');
    splash.item = (splash.item ?? []).filter((i) => i.$.name !== ITEM);
    // Read by Android 12+ only; older versions ignore the attribute.
    splash.item.push({ $: { name: ITEM }, _: '@drawable/splash_branding' });
    return cfg;
  });
};
