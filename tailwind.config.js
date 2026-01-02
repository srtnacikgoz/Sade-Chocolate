/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Mocha Mousse Paleti
        cream: {
          50: "#FFFEFA", // Çok açık fildişi
          100: "#FDFCF0", // Sıcak krem
          200: "#F5F5DC", // Ana arka plan (Bej)
        },
        mocha: {
          50: "#EFEBE9",
          100: "#D7CCC8",
          200: "#BCAAA4",
          400: "#8D6E63",
          900: "#4B3832", // Derin çikolata (Ana metin rengi)
        },
        gold: {
          DEFAULT: "#C5A059", // Daha mat ve lüks altın tonu
          light: "#E5D1B0",
        },
        brown: {
          900: "#1a0f0a",
        },
        dark: {
          900: "#0a0a0a",
          800: "#1a1a1a",
        },
        // Sade Chocolate Kurumsal Renk Paleti
        brand: {
          blue: "#a4d1e8",
          yellow: "#e7c57d",
          mustard: "#d4a945",
          green: "#a4d4bc",
          peach: "#f3d1c8",
          orange: "#e59a77",
        },
      },
      fontFamily: {
        // Zanaatkar Serif ve Modern Sans-Serif birlikteliği
        display: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
        // Santana - Premium branding fontu (henüz kullanılmıyor)
        santana: ["Santana", "sans-serif"],
        "santana-condensed": ["Santana Condensed", "sans-serif"],
        "santana-xtra": ["Santana XtraCondensed", "sans-serif"],
      },
      boxShadow: {
        luxurious: "0 20px 40px -15px rgba(75, 56, 50, 0.15)", // Kahve tonlu yumuşak gölge
      },
    },
  },
  plugins: [],
};
