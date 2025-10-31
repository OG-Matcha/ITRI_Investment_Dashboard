export default defineNuxtRouteMiddleware((to) => {
  // 只在客戶端執行
  if (process.server) return
  
  const config = useRuntimeConfig()
  const baseURL = config.app?.baseURL || '/ITRI_Investment_Dashboard/'
  
  // 檢查當前瀏覽器的實際 URL
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.pathname
    
    // 如果當前 URL 不是從 baseURL 開始的，則顯示錯誤頁面
    if (!currentUrl.startsWith(baseURL)) {
      // 拋出錯誤，觸發 error.vue
      throw createError({
        statusCode: 404,
        statusMessage: 'Page not found'
      })
    }
  }
})

