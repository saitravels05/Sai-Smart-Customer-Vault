import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sai: {
          orange: '#E85A18',
          'orange-hover': '#D44E0F',
          'orange-light': '#FFF3EB',
          navy: '#0B192C',
          'navy-light': '#1E3E62',
          gold: '#D4AF37',
          'gold-light': '#FDF8E7',
          charcoal: '#1E293B',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#E85A18',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#0B192C',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#D4AF37',
          foreground: '#0B192C',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
