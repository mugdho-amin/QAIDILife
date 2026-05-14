import type { MetadataRoute } from "next";

/** QAIDILife Admin PWA manifest configuration. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QAIDILife Admin",
    short_name: "QAIDILife Admin",
    description: "Operations console for QAIDILife commerce.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F2",
    theme_color: "#0A0A0A",
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
