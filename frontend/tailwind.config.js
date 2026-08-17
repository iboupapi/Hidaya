export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0A120A', secondary: '#0E1A0E', card: '#111D11' },
        'green-dahira': '#2E6B2E',
        'yellow-accent': '#D4E84C',
        'yellow-dim': '#6A7A1E',
        border: { subtle: '#1A3A1A', default: '#2A4A2A', strong: '#2E6B2E' },
        txt: { primary: '#E8F0C8', secondary: '#A8C090', muted: '#4A7A4A', disabled: '#2A4A2A' },
      },
    },
  },
  plugins: [],
}
