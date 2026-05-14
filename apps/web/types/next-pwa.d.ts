declare module "next-pwa" {
  import type { NextConfig } from "next";
  function withPWA(config: Record<string, unknown>): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}

declare module "next-pwa/cache" {
  const runtimeCaching: unknown[];
  export default runtimeCaching;
}
