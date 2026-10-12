/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--surface-default)', foreground: 'var(--text-primary)',
        primary: {DEFAULT:'var(--accent)',foreground:'var(--text-on-accent)'},
        secondary: {DEFAULT:'var(--surface-secondary)',foreground:'var(--text-secondary)'},
        accent: {DEFAULT:'var(--accent-subtle)',foreground:'var(--accent)'},
        destructive: {DEFAULT:'var(--danger)',foreground:'var(--text-on-danger)'},
        muted: {DEFAULT:'var(--surface-bg)',foreground:'var(--text-tertiary)'},
        border:'var(--border-default)', input:'var(--border-default)', ring:'var(--accent)',
      },
    },
  },
  plugins: [],
}

