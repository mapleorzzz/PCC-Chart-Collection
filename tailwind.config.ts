import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#090909",
        panel: "#111111",
        line: "#262626",
        muted: "#888888"
      }
    }
  },
  plugins: []
};

export default config;