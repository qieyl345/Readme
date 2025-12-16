import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rentverseVECNA.app',
  appName: 'Rentverse-VECNA',
  webDir: 'out',
  server: {
    url: 'https://uitm-devops-challenge-vecna-rentver-theta.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
