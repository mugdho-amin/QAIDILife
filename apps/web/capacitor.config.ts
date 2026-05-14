import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "http://localhost:3000";

/** Capacitor configuration for QAIDILife shells. */
const config: CapacitorConfig = {
  appId: "com.qaidilife.app",
  appName: "QAIDILife",
  webDir: "out",
  bundledWebRuntime: false,
  server: {
    url: serverUrl,
    cleartext: true,
  },
};

export default config;
