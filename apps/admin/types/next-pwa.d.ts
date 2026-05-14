declare module "next-pwa" {
  import type { NextConfig } from "next";
  function withPWA(config: Record<string, unknown>): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}

declare module "next-pwa/cache" {
  const runtimeCaching: import("workbox-build").RuntimeCaching[];
  export default runtimeCaching;
}

declare module "workbox-build" {
  interface RuntimeCaching {
    urlPattern: RegExp | string;
    handler: string;
    options?: Record<string, unknown>;
  }
}
