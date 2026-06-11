import type { MetadataRoute } from "next";

// Installable home-screen app: cleaners add Par once and it opens full-screen
// like a native app (no browser chrome), with the brand icon below.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Par — Mason Homes Inventory",
    short_name: "Par",
    description:
      "Par vs actual across every unit and the Stockroom. Every Stockroom pull logged.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0B0D",
    theme_color: "#0B0B0D",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
