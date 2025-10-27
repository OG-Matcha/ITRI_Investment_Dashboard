// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  build: {
    transpile: ['@amcharts/amcharts5', 'plotly.js-dist-min']
  },
  vite: {
    optimizeDeps: {
      include: ['@amcharts/amcharts5', 'plotly.js-dist-min', 'chart.js']
    }
  },
  app: {
    head: {
      script: [
        {
          src: 'https://cdn.amcharts.com/lib/5/index.js',
          defer: true
        },
        {
          src: 'https://cdn.amcharts.com/lib/5/xy.js',
          defer: true
        },
        {
          src: 'https://cdn.plot.ly/plotly-2.26.0.min.js',
          defer: true
        }
      ]
    }
  }
})
