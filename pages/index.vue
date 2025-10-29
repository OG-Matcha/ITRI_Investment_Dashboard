<template>
    <div class="min-h-screen bg-gray-50">
        <div class="container mx-auto px-4 py-8">
            <div class="space-y-8">
                <!-- 頁面標題 -->
                <div class="text-center">
                    <h1 class="text-4xl font-bold text-gray-900 mb-4">
                        能源儲能投資分析儀表板
                    </h1>
                    <p class="text-lg text-gray-600">
                        多維度投資資料視覺化分析平台
                    </p>
                </div>

                <!-- 圖表佈局 -->
                <div class="flex flex-col gap-8">
                    <!-- GE 矩陣分析 -->
                    <div
                        class="p-6 bg-white rounded-lg shadow-lg overflow-hidden border-2"
                    >
                        <GEMatrix />
                    </div>

                    <!-- 風險象限分析 -->
                    <div
                        class="bg-white rounded-lg shadow-lg overflow-hidden border-2"
                    >
                        <RiskQuadrant />
                    </div>

                    <!-- 公司氣泡圖分析 -->
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                        <CompanyBubble />
                    </div>

                    <!-- 地理分析圖 -->
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                        <GeoAnalysis />
                    </div>
                </div>

                <!-- 統計摘要 -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2
                        class="text-2xl font-bold text-gray-800 mb-6 text-center"
                    >
                        投資統計摘要
                    </h2>

                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <div class="text-3xl font-bold text-blue-600">
                                {{ statistics.totalRecords }}
                            </div>
                            <div class="text-sm text-gray-600 mt-1">
                                總公司數量
                            </div>
                        </div>

                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <div class="text-3xl font-bold text-green-600">
                                {{ formatCurrency(statistics.totalFunding) }}
                            </div>
                            <div class="text-sm text-gray-600 mt-1">
                                總募資金額
                            </div>
                        </div>

                        <div class="text-center p-4 bg-purple-50 rounded-lg">
                            <div class="text-3xl font-bold text-purple-600">
                                {{ formatCurrency(statistics.averageFunding) }}
                            </div>
                            <div class="text-sm text-gray-600 mt-1">
                                平均募資金額
                            </div>
                        </div>

                        <div class="text-center p-4 bg-orange-50 rounded-lg">
                            <div class="text-3xl font-bold text-orange-600">
                                {{ topCountries.length }}
                            </div>
                            <div class="text-sm text-gray-600 mt-1">
                                投資國家數
                            </div>
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
                                    class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <span class="font-medium text-gray-800">{{
                                        country.country
                                    }}</span>
                                    <span
                                        class="text-sm text-gray-600 bg-white px-2 py-1 rounded"
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
                                    class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <span class="font-medium text-gray-800">{{
                                        industry.industry
                                    }}</span>
                                    <span
                                        class="text-sm text-gray-600 bg-white px-2 py-1 rounded"
                                        >{{ industry.count }} 筆</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDataProcessing } from "~/composables/useDataProcessing";
import { formatCurrency } from "~/utils/dataParser";

// 元件引入
import GEMatrix from "~/components/GE-Matrix/GEMatrix.vue";
import RiskQuadrant from "~/components/Risk-Quadrant/RiskQuadrant.vue";
import CompanyBubble from "~/components/Company-Bubble/CompanyBubble.vue";
import GeoAnalysis from "~/components/Geo-Analysis/GeoAnalysis.vue";

// 使用 Composables
const { statistics } = useDataProcessing();

// 計算屬性
const topCountries = computed(() => statistics.value.topCountries || []);
const topIndustries = computed(() => statistics.value.topIndustries || []);
</script>

<style scoped>
/* 響應式設計 */
@media (max-width: 768px) {
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
