import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jeffy: {
          yellow: '#FCD34D',      // Primary yellow
          'yellow-light': '#FEF3C7', // Light yellow for function boxes
          grey: '#9CA3AF',       // Grey for text backgrounds
          'grey-light': '#F3F4F6', // Light grey
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'jeffy': '0 4px 6px -1px rgba(252, 211, 77, 0.1), 0 2px 4px -1px rgba(252, 211, 77, 0.06)',
        'jeffy-lg': '0 10px 15px -3px rgba(252, 211, 77, 0.1), 0 4px 6px -2px rgba(252, 211, 77, 0.05)',
      }
    },
  },
  plugins: [],
};
export default config;
