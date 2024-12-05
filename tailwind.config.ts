import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Enable dark mode support
  theme: {
    extend: {
      colors: {
        // Custom brand colors
        brand: {
          light: '#6EE7B7',
          DEFAULT: '#34D399',
          dark: '#059669',
        },
        accent: {
          light: '#93C5FD',
          DEFAULT: '#3B82F6',
          dark: '#1E40AF',
        },
      },
      fontFamily: {
        // Custom fonts
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      spacing: {
        // Custom spacing values
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        // Custom border radius
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
