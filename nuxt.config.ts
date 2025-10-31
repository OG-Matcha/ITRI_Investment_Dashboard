// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // GitHub Pages 特定配置
  ssr: false,
  nitro: {
    preset: 'github-pages'
  },
  
  // 環境變量配置
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
    baseURL: process.env.NUXT_APP_BASE_URL || '/ITRI_Investment_Dashboard/',
    head: {
      title: '能源儲能投資分析儀表板',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '多維度能源儲能投資資料視覺化分析平台，提供 GE 矩陣、風險象限、公司氣泡圖和地理分析等專業投資分析工具' },
        { name: 'keywords', content: '能源儲能, 投資分析, 資料視覺化, GE 矩陣, 風險分析, 投資儀表板' },
        { name: 'author', content: 'ITRI' },
        { property: 'og:title', content: '能源儲能投資分析儀表板' },
        { property: 'og:description', content: '多維度能源儲能投資資料視覺化分析平台' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '能源儲能投資分析儀表板' },
        { name: 'twitter:description', content: '多維度能源儲能投資資料視覺化分析平台' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: `${process.env.NUXT_APP_BASE_URL || '/ITRI_Investment_Dashboard/'}favicon.ico` },
        { rel: 'manifest', href: `${process.env.NUXT_APP_BASE_URL || '/ITRI_Investment_Dashboard/'}site.webmanifest` }
      ],
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
          src: 'https://cdn.amcharts.com/lib/5/themes/Animated.js',
          defer: true
        },
        {
          src: 'https://cdn.amcharts.com/lib/5/hierarchy.js',
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
