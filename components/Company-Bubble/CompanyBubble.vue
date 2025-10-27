<template>
    <div class="company-bubble-container bg-white rounded-lg shadow-lg p-6">
        <!-- 標題和控制面板 -->
        <div
            class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4"
        >
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">
                    公司氣泡圖分析
                </h2>
                <p class="text-gray-600">多維度公司投資分析視覺化</p>
            </div>

            <!-- 氣泡圖控制面板 -->
            <BubbleControls
                v-model:x-axis="xAxis"
                v-model:y-axis="yAxis"
                v-model:bubble-size="bubbleSize"
                :axis-options="numericAxisOptions"
                @update="handleAxisChange"
            />
        </div>

        <!-- 載入狀態 -->
        <div v-if="loading" class="flex justify-center items-center h-64">
            <div
                class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            ></div>
        </div>

        <!-- 錯誤狀態 -->
        <div v-else-if="error" class="text-center py-8">
            <div class="text-red-500 text-lg font-semibold mb-2">載入失敗</div>
            <p class="text-gray-600">{{ error }}</p>
            <button
                @click="reloadData"
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                重新載入
            </button>
        </div>

        <!-- 氣泡圖圖表 -->
        <div v-else class="company-bubble-content">
            <BubbleChart
                :chart-data="chartData"
                :x-axis-label="xAxisLabel"
                :y-axis-label="yAxisLabel"
                :bubble-size-label="bubbleSizeLabel"
                :statistics="statistics"
                @bubble-hover="handleBubbleHover"
                @bubble-click="handleBubbleClick"
            />

            <!-- 統計資訊 -->
            <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">總公司數</h3>
                    <p class="text-2xl font-bold text-blue-600">
                        {{ statistics.totalRecords }}
                    </p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-green-800 mb-2">平均募資</h3>
                    <p class="text-2xl font-bold text-green-600">
                        {{ formatCurrency(statistics.averageFunding) }}
                    </p>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-purple-800 mb-2">最大氣泡</h3>
                    <p class="text-2xl font-bold text-purple-600">
                        {{ getMaxBubbleSize() }}
                    </p>
                </div>
                <div class="bg-orange-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-orange-800 mb-2">最小氣泡</h3>
                    <p class="text-2xl font-bold text-orange-600">
                        {{ getMinBubbleSize() }}
                    </p>
                </div>
            </div>

            <!-- 氣泡圖說明 -->
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 class="font-semibold text-gray-800 mb-3">圖表說明</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span class="font-medium text-gray-700">X 軸：</span>
                        <span class="text-gray-600">{{ xAxisLabel }}</span>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">Y 軸：</span>
                        <span class="text-gray-600">{{ yAxisLabel }}</span>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700"
                            >氣泡大小：</span
                        >
                        <span class="text-gray-600">{{ bubbleSizeLabel }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hover 資訊提示 -->
        <div
            v-if="hoverInfo"
            class="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm"
            :style="{ left: hoverInfo.x + 'px', top: hoverInfo.y + 'px' }"
        >
            <div class="space-y-2">
                <h4 class="font-bold text-gray-800">
                    {{ hoverInfo.company.name }}
                </h4>
                <div class="text-sm text-gray-600">
                    <p>
                        <span class="font-medium">國家：</span
                        >{{ hoverInfo.company.country_name }}
                    </p>
                    <p>
                        <span class="font-medium">投資類型：</span
                        >{{ hoverInfo.company.investment_type }}
                    </p>
                    <p>
                        <span class="font-medium">總募資：</span
                        >{{
                            formatCurrency(hoverInfo.company.total_funding_usd)
                        }}
                    </p>
                    <p>
                        <span class="font-medium">投資輪次：</span
                        >{{ hoverInfo.company.num_funding_rounds }}
                    </p>
                    <p>
                        <span class="font-medium">成立年份：</span
                        >{{ hoverInfo.company.founded_year }}
                    </p>
                </div>
            </div>
        </div>

        <!-- 詳細資訊模態框 -->
        <div
            v-if="selectedCompany"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <div
                class="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
            >
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">
                        {{ selectedCompany.name }}
                    </h3>
                    <button
                        @click="selectedCompany = null"
                        class="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-2">
                                基本資訊
                            </h4>
                            <div class="space-y-1 text-sm">
                                <p>
                                    <span class="font-medium">組織名稱：</span
                                    >{{ selectedCompany.org_name }}
                                </p>
                                <p>
                                    <span class="font-medium">國家：</span
                                    >{{ selectedCompany.country_name }}
                                </p>
                                <p>
                                    <span class="font-medium">地區：</span
                                    >{{ selectedCompany.region }}
                                </p>
                                <p>
                                    <span class="font-medium">城市：</span
                                    >{{ selectedCompany.city }}
                                </p>
                                <p>
                                    <span class="font-medium">成立年份：</span
                                    >{{ selectedCompany.founded_year }}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 class="font-semibold text-gray-700 mb-2">
                                投資資訊
                            </h4>
                            <div class="space-y-1 text-sm">
                                <p>
                                    <span class="font-medium">投資類型：</span
                                    >{{ selectedCompany.investment_type }}
                                </p>
                                <p>
                                    <span class="font-medium">總募資金額：</span
                                    >{{
                                        formatCurrency(
                                            selectedCompany.total_funding_usd
                                        )
                                    }}
                                </p>
                                <p>
                                    <span class="font-medium">投資輪次：</span
                                    >{{ selectedCompany.num_funding_rounds }}
                                </p>
                                <p>
                                    <span class="font-medium">募資年份：</span
                                    >{{ selectedCompany.funding_year }}
                                </p>
                                <p>
                                    <span class="font-medium">CB Rank：</span
                                    >{{ selectedCompany.rank }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedCompany.SubIndustry">
                        <h4 class="font-semibold text-gray-700 mb-2">
                            產業分類
                        </h4>
                        <div class="text-sm">
                            <p>
                                <span class="font-medium">子產業：</span
                                >{{ selectedCompany.SubIndustry }}
                            </p>
                            <p>
                                <span class="font-medium">產品服務：</span
                                >{{ selectedCompany.ProductServiceType }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { EnergyStorageData, ChartDataPoint, Statistics } from "~/types";
import { useDataProcessing } from "~/composables/useDataProcessing";
import { useFiltering } from "~/composables/useFiltering";
import { convertToChartData } from "~/utils/dataUtils";
import { formatCurrency } from "~/utils/dataParser";

// 元件引入
import BubbleControls from "./BubbleControls.vue";
import BubbleChart from "./BubbleChart.vue";

// 響應式狀態
const xAxis = ref("total_funding_usd");
const yAxis = ref("founded_year");
const bubbleSize = ref("num_funding_rounds");
const hoverInfo = ref<{
    company: EnergyStorageData;
    x: number;
    y: number;
} | null>(null);
const selectedCompany = ref<EnergyStorageData | null>(null);

// 使用 Composables
const {
    processedData,
    loading,
    error,
    statistics,
    numericAxisOptions,
    reloadData,
} = useDataProcessing();

const { filteredData } = useFiltering(processedData);

// 計算屬性
const chartData = computed((): ChartDataPoint[] => {
    if (filteredData.value.length === 0) return [];

    return convertToChartData(
        filteredData.value,
        xAxis.value as keyof EnergyStorageData,
        yAxis.value as keyof EnergyStorageData,
        bubbleSize.value as keyof EnergyStorageData
    );
});

const xAxisLabel = computed(() => {
    const option = numericAxisOptions.value.find(
        (opt) => opt.value === xAxis.value
    );
    return option?.label || xAxis.value;
});

const yAxisLabel = computed(() => {
    const option = numericAxisOptions.value.find(
        (opt) => opt.value === yAxis.value
    );
    return option?.label || yAxis.value;
});

const bubbleSizeLabel = computed(() => {
    const option = numericAxisOptions.value.find(
        (opt) => opt.value === bubbleSize.value
    );
    return option?.label || bubbleSize.value;
});

// 方法
const handleAxisChange = (
    newXAxis: string,
    newYAxis: string,
    newBubbleSize: string
) => {
    xAxis.value = newXAxis;
    yAxis.value = newYAxis;
    bubbleSize.value = newBubbleSize;
};

const handleBubbleHover = (
    info: { company: EnergyStorageData; x: number; y: number } | null
) => {
    hoverInfo.value = info;
};

const handleBubbleClick = (company: EnergyStorageData) => {
    selectedCompany.value = company;
};

const getMaxBubbleSize = (): number => {
    if (chartData.value.length === 0) return 0;
    return Math.max(...chartData.value.map((item) => item.size || 0));
};

const getMinBubbleSize = (): number => {
    if (chartData.value.length === 0) return 0;
    return Math.min(...chartData.value.map((item) => item.size || 0));
};

// 生命週期
onMounted(() => {
    // 元件掛載時載入資料
});
</script>

<style scoped>
.company-bubble-container {
    min-height: 600px;
}

.company-bubble-content {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
