/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jeffy: {
          yellow: '#EAB308',
          'yellow-light': '#FEF08A',
          'yellow-dark': '#CA8A04',
          grey: '#9CA3AF',
          'grey-light': '#F3F4F6',
          navy: '#1e293b',
          'navy-light': '#334155',
          charcoal: '#0f172a',
          cream: '#fefce8',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['Lexend', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'jeffy': '0 4px 6px -1px rgba(234, 179, 8, 0.1), 0 2px 4px -1px rgba(234, 179, 8, 0.06)',
        'jeffy-lg': '0 10px 15px -3px rgba(234, 179, 8, 0.1), 0 4px 6px -2px rgba(234, 179, 8, 0.05)',
        'jeffy-xl': '0 20px 25px -5px rgba(234, 179, 8, 0.15), 0 8px 10px -6px rgba(234, 179, 8, 0.1)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'button': '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
        'button-hover': '0 6px 20px 0 rgba(0, 0, 0, 0.15)',
        'nav': '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.1)',
      },
      backgroundImage: {
        'jeffy-gradient': 'linear-gradient(135deg, #EAB308 0%, #facc15 50%, #fef08a 100%)',
        'jeffy-subtle': 'linear-gradient(180deg, #fefce8 0%, #fef9c3 100%)',
        'jeffy-hero': 'radial-gradient(ellipse at top, #fef08a 0%, #EAB308 100%)',
        'jeffy-warm': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'bounce-in': 'bounce-in 0.4s ease-out',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 2s linear infinite',
      },
    },
  },
  plugins: [],
};
