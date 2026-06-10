/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:'#eef2ff', 100:'#e0e7ff', 200:'#c7d2fe', 300:'#a5b4fc',
          400:'#818cf8', 500:'#6366f1', 600:'#4f46e5', 700:'#4338ca',
        }
      },
      boxShadow: {
        card:  '0 1px 3px rgba(99,102,241,.07), 0 4px 16px rgba(99,102,241,.05)',
        hover: '0 4px 20px rgba(99,102,241,.14), 0 1px 4px rgba(99,102,241,.08)',
        modal: '0 24px 64px rgba(30,27,75,.24)',
        btn:   '0 4px 12px rgba(99,102,241,.38)',
      },
    }
  },
  plugins: []
}
