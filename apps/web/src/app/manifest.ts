import type { MetadataRoute } from "next";

/** QAIDILife PWA manifest configuration. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QAIDILife",
    short_name: "QAIDILife",
    description: "Premium Bangladeshi clothing brand with a minimalist experience.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
