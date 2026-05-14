import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "http://localhost:3001";

/** Capacitor configuration for QAIDILife Admin shells. */
const config: CapacitorConfig = {
  appId: "com.qaidilife.admin",
  appName: "QAIDILife Admin",
  // Use public assets as a fallback webDir; server.url controls live app shell.
  webDir: "public",
  bundledWebRuntime: false,
  server: {
    url: serverUrl,
    cleartext: true,
  },
};

export default config;
