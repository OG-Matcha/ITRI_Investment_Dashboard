<template>
    <div class="responsive-layout">
        <!-- 桌面版佈局 -->
        <div class="hidden lg:block">
            <div class="grid grid-cols-12 gap-6">
                <!-- 側邊欄 -->
                <aside class="col-span-3">
                    <div class="sticky top-8">
                        <slot name="sidebar" />
                    </div>
                </aside>

                <!-- 主要內容 -->
                <main class="col-span-9">
                    <slot name="main" />
                </main>
            </div>
        </div>

        <!-- 平板版佈局 -->
        <div class="hidden md:block lg:hidden">
            <div class="space-y-6">
                <!-- 篩選面板 -->
                <div class="order-1">
                    <slot name="sidebar" />
                </div>

                <!-- 主要內容 -->
                <div class="order-2">
                    <slot name="main" />
                </div>
            </div>
        </div>

        <!-- 手機版佈局 -->
        <div class="block md:hidden">
            <div class="space-y-4">
                <!-- 可折疊的篩選面板 -->
                <div class="order-1">
                    <button
                        @click="toggleMobileSidebar"
                        class="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                        <span class="font-medium text-gray-800">篩選條件</span>
                        <svg
                            class="w-5 h-5 text-gray-500 transition-transform"
                            :class="{ 'rotate-180': showMobileSidebar }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                        </svg>
                    </button>

                    <div
                        v-if="showMobileSidebar"
                        class="mt-2 p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                        <slot name="sidebar" />
                    </div>
                </div>

                <!-- 主要內容 -->
                <div class="order-2">
                    <slot name="main" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 響應式狀態
const showMobileSidebar = ref(false);

// 方法
const toggleMobileSidebar = () => {
    showMobileSidebar.value = !showMobileSidebar.value;
};
</script>

<style scoped>
.responsive-layout {
    width: 100%;
}

/* 確保內容不會溢出 */
.grid {
    overflow: hidden;
}

/* 手機版優化 */
@media (max-width: 768px) {
    .responsive-layout {
        padding: 0 1rem;
    }
}

/* 平板版優化 */
@media (min-width: 768px) and (max-width: 1024px) {
    .responsive-layout {
        padding: 0 2rem;
    }
}

/* 桌面版優化 */
@media (min-width: 1024px) {
    .responsive-layout {
        padding: 0;
    }
}
</style>
