export default defineNuxtPlugin({
  name: 'root-guard-client',
  enforce: 'pre', // 在其他 plugin 之前執行，優先級最高
  setup() {
    if (process.server) return
    
    // 立即檢查，在 router 初始化之前
    if (typeof window !== 'undefined') {
      const config = useRuntimeConfig()
      const baseURL = config.app?.baseURL || '/ITRI_Investment_Dashboard/'
      const initialPath = window.location.pathname
      
      // 如果初始路徑不是 baseURL，阻止所有導航
      if (!initialPath.startsWith(baseURL)) {
        // 攔截 pushState 和 replaceState 以防止重定向
        const originalPushState = window.history.pushState.bind(window.history)
        const originalReplaceState = window.history.replaceState.bind(window.history)
        
        window.history.pushState = function(...args) {
          const url = args[2]
          // 如果試圖推送到 baseURL，阻止它
          if (typeof url === 'string' && url === baseURL && initialPath === '/') {
            return // 阻止 pushState
          }
          return originalPushState(...args)
        }
        
        window.history.replaceState = function(...args) {
          const url = args[2]
          // 如果試圖替換到 baseURL，阻止它
          if (typeof url === 'string' && url === baseURL && initialPath === '/') {
            return // 阻止 replaceState
          }
          return originalReplaceState(...args)
        }
        
        // 註冊 router 攔截器
        const router = useRouter()
        router.beforeEach((to, from, next) => {
          const currentPath = window.location.pathname
          // 如果當前路徑不是 baseURL，阻止導航
          if (!currentPath.startsWith(baseURL) && to.path !== '/__nuxt_error') {
            // 阻止導航並觸發錯誤
            next(false)
            // 使用 showError 來顯示錯誤頁面
            showError({
              statusCode: 404,
              statusMessage: 'Page not found'
            })
            return
          }
          next()
        })
      }
    }
  }
})

