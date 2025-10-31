<template>
    <div>
        <NuxtRouteAnnouncer />
        <NuxtPage />
    </div>
</template>

<script setup lang="ts">
// 在應用初始化時立即檢查 URL
if (process.client) {
    const config = useRuntimeConfig()
    const baseURL = config.app?.baseURL || '/ITRI_Investment_Dashboard/'
    const currentPath = window.location.pathname
    
    // 如果當前路徑不是從 baseURL 開始，立即阻止並顯示錯誤
    if (!currentPath.startsWith(baseURL)) {
        // 立即觸發錯誤頁面
        throw createError({
            statusCode: 404,
            statusMessage: 'Page not found'
        })
    }
}
</script>
