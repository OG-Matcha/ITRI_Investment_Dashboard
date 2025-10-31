<template>
    <div
        class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4"
    >
        <div class="text-center">
            <!-- Tenor GIF Embed - 直接使用 iframe 以確保大小控制 -->
            <div class="gif-container mb-8">
                <iframe
                    src="https://tenor.com/embed/12643286"
                    width="100%"
                    height="100%"
                    style="
                        max-width: 1000px;
                        min-width: 600px;
                        width: 100%;
                        aspect-ratio: 16/9;
                        border: none;
                        overflow: hidden;
                    "
                    class="tenor-gif-embed"
                    allowfullscreen
                ></iframe>
            </div>

            <!-- 提示訊息 -->
            <div class="text-white mb-6">
                <h1 class="text-3xl font-bold mb-4">這裡不是你該來的地方</h1>
                <p class="text-lg text-gray-300 mb-6">你似乎走錯了路徑...</p>
                <button
                    @click="goToHome"
                    class="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                >
                    返回首頁
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRuntimeConfig, useRouter } from "#app";

const props = defineProps<{
    error: {
        statusCode?: number;
        statusMessage?: string;
        message?: string;
        url?: string;
    };
}>();

const config = useRuntimeConfig();
const router = useRouter();

const baseURL = computed(() => {
    const base = config.app?.baseURL || "/ITRI_Investment_Dashboard/";
    return base;
});

// 跳轉到首頁
const goToHome = () => {
    // 直接使用 window.location 跳轉，避免 router 處理導致的問題
    if (typeof window !== "undefined") {
        window.location.href = baseURL.value;
    }
};
</script>

<style scoped>
.gif-container {
    width: 100%;
    max-width: 1000px;
    min-width: 600px;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.tenor-gif-embed {
    width: 100%;
    max-width: 1000px;
    min-width: 600px;
    aspect-ratio: 16/9;
    border: none;
    overflow: hidden;
}

@media (max-width: 768px) {
    .gif-container {
        min-width: 90vw;
        max-width: 90vw;
    }

    .tenor-gif-embed {
        min-width: 90vw;
        max-width: 90vw;
    }
}
</style>
