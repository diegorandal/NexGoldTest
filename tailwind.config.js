/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // --- INICIO DE LA MODIFICACIÓN ---
      keyframes: {
        pulseHeart: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.9' },
        }
      },
      animation: {
        'pulse-heart': 'pulseHeart 2s ease-in-out infinite',
      }
      // --- FIN DE LA MODIFICACIÓN ---
    },
  },
  plugins: [],
};
