// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // 環境變量配置（為未來部署預留）
  runtimeConfig: {
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL
    }
  },
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
          src: 'https://cdn.amcharts.com/lib/5/map.js',
          defer: true
        },
        {
          src: 'https://cdn.amcharts.com/lib/5/geodata/worldLow.js',
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
