import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        canvas: "#FFFFFF",
        mist: "#F5F5F5",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        bengali: ["var(--font-bengali)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
