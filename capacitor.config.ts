import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.tijarah.app',
  appName: 'Tijarah',
  webDir: 'out',
  server: {
    // Allow loading from the local static files
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      // Show push notifications when app is in foreground
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#1a1799',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1799',
    },
    Keyboard: {
      resize: KeyboardResize.None,
    },
  },
};

export default config;
