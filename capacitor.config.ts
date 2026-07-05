import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.balkon.sawah',
  appName: 'BalkonSawah',
  webDir: 'out',
  server: {
    url: 'https://appcafe-rho.vercel.app',
    cleartext: true
  }
};

export default config;
