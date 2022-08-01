const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  mode: 'jit',
  purge: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        drop: 'drop .5s linear forwards',
      },
      keyframes: {
        drop: {
          '0%': { transform: 'translateY(-200px) scaleY(0.9)', opacity: '0' },
          '5%': { opacity: '.7' },
          '50%': { transform: 'translateY(0px) scaleY(1)', opacity: '1' },
          '65%': { transform: 'translateY(-17px) scaleY(.9)', opacity: '1' },
          '75%': { transform: 'translateY(-22px) scaleY(.9)', opacity: '1' },
          '100%': { transform: 'translateY(0px) scaleY(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light'],
  },
}
