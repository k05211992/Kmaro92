import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#e8f9ef",
          100: "#c5f0d6",
          200: "#8fe0b0",
          300: "#4dcc84",
          400: "#30da75",
          500: "#21b65d",
          600: "#198b47",
          700: "#126535",
          800: "#0b4223",
          900: "#062414",
          950: "#031208",
        },
      },
    },
  },
  plugins: [],
};

export default config;
