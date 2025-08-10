/** @type {import('tailwindcss').Config} */
module.exports = {
  // Switch dark mode handling to class strategy so adding/removing the 'dark' class works.
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
