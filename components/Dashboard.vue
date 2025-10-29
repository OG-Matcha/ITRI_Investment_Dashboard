<template>
    <div class="dashboard-container min-h-screen bg-gray-50">
        <!-- 頁面標題 -->
        <header class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-6">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">
                            能源儲能投資分析儀表板
                        </h1>
                        <p class="mt-2 text-lg text-gray-600">
                            多維度投資資料視覺化分析平台
                        </p>
                    </div>

                    <!-- 資料狀態指示器 -->
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                            <div
                                class="w-3 h-3 rounded-full"
                                :class="
                                    dataStatus === 'loaded'
                                        ? 'bg-green-500'
                                        : dataStatus === 'loading'
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                "
                            ></div>
                            <span class="text-sm font-medium text-gray-700">
                                {{ dataStatusText }}
                            </span>
                        </div>

                        <button
                            @click="refreshData"
                            :disabled="dataStatus === 'loading'"
                            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {{
                                dataStatus === "loading"
                                    ? "載入中..."
                                    : "重新載入"
                            }}
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- 主要內容區域 -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- 篩選面板 -->
            <div class="mb-8">
                <FilterPanel />
            </div>

            <!-- 圖表網格 -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <!-- GE 矩陣分析 -->
                <div class="bg-white rounded-lg shadow-lg">
                    <GEMatrix />
                </div>

                <!-- 風險象限分析 -->
                <div class="bg-white rounded-lg shadow-lg">
                    <RiskQuadrant />
                </div>

                <!-- 公司氣泡圖分析 -->
                <div class="bg-white rounded-lg shadow-lg xl:col-span-2">
                    <CompanyBubble />
                </div>
            </div>

            <!-- 統計摘要 -->
            <div class="mt-8">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">
                        投資統計摘要
                    </h2>

                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600">
                                {{ statistics.totalRecords }}
                            </div>
                            <div class="text-sm text-gray-600">總投資記錄</div>
                        </div>

                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600">
                                {{ formatCurrency(statistics.totalFunding) }}
                            </div>
                            <div class="text-sm text-gray-600">總募資金額</div>
                        </div>

                        <div class="text-center">
                            <div class="text-3xl font-bold text-purple-600">
                                {{ formatCurrency(statistics.averageFunding) }}
                            </div>
                            <div class="text-sm text-gray-600">
                                平均募資金額
                            </div>
                        </div>

                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600">
                                {{ topCountries.length }}
                            </div>
                            <div class="text-sm text-gray-600">投資國家數</div>
                        </div>
                    </div>

                    <!-- 頂級國家和產業 -->
                    <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3
                                class="text-lg font-semibold text-gray-800 mb-4"
                            >
                                投資熱點國家
                            </h3>
                            <div class="space-y-2">
                                <div
                                    v-for="(
                                        country, index
                                    ) in topCountries.slice(0, 5)"
                                    :key="country.country"
                                    class="flex justify-between items-center p-2 bg-gray-50 rounded"
                                >
                                    <span class="text-sm font-medium">{{
                                        country.country
                                    }}</span>
                                    <span class="text-sm text-gray-600"
                                        >{{ country.count }} 筆</span
                                    >
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3
                                class="text-lg font-semibold text-gray-800 mb-4"
                            >
                                熱門投資產業
                            </h3>
                            <div class="space-y-2">
                                <div
                                    v-for="(
                                        industry, index
                                    ) in topIndustries.slice(0, 5)"
                                    :key="industry.industry"
                                    class="flex justify-between items-center p-2 bg-gray-50 rounded"
                                >
                                    <span class="text-sm font-medium">{{
                                        industry.industry
                                    }}</span>
                                    <span class="text-sm text-gray-600"
                                        >{{ industry.count }} 筆</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 載入遮罩 -->
        <div
            v-if="dataStatus === 'loading'"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <div class="bg-white rounded-lg p-8 text-center">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
                ></div>
                <p class="text-lg font-medium text-gray-800">載入資料中...</p>
                <p class="text-sm text-gray-600 mt-2">
                    請稍候，正在處理投資資料
                </p>
            </div>
        </div>

        <!-- 錯誤提示 -->
        <div
            v-if="dataStatus === 'error'"
            class="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50"
        >
            <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    ></path>
                </svg>
                <span>資料載入失敗，請重新載入</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDataProcessing } from "~/composables/useDataProcessing";
import { formatCurrency } from "~/utils/dataParser";

// 元件引入
import FilterPanel from "~/components/Filter-Panel/FilterPanel.vue";
import GEMatrix from "~/components/GE-Matrix/GEMatrix.vue";
import RiskQuadrant from "~/components/Risk-Quadrant/RiskQuadrant.vue";
import CompanyBubble from "~/components/Company-Bubble/CompanyBubble.vue";

// 響應式狀態
const dataStatus = ref<"loading" | "loaded" | "error">("loading");

// 使用 Composables
const { statistics, loadData, reloadData } = useDataProcessing();

// 計算屬性
const dataStatusText = computed(() => {
    switch (dataStatus.value) {
        case "loading":
            return "載入中...";
        case "loaded":
            return "資料已載入";
        case "error":
            return "載入失敗";
        default:
            return "未知狀態";
    }
});

const topCountries = computed(() => statistics.value.topCountries || []);
const topIndustries = computed(() => statistics.value.topIndustries || []);

// 方法
const refreshData = async () => {
    dataStatus.value = "loading";
    try {
        await reloadData();
        dataStatus.value = "loaded";
    } catch (error) {
        dataStatus.value = "error";
    }
};

// 生命週期
onMounted(async () => {
    dataStatus.value = "loading";
    try {
        await loadData();
        dataStatus.value = "loaded";
    } catch (error) {
        dataStatus.value = "error";
    }
});
</script>

<style scoped>
.dashboard-container {
    min-height: 100vh;
}

/* 響應式設計 */
@media (max-width: 768px) {
    .dashboard-container {
        padding: 0;
    }

    .grid {
        gap: 1rem;
    }
}

/* 動畫效果 */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.bg-white {
    animation: fadeInUp 0.3s ease-out;
}
</style>
