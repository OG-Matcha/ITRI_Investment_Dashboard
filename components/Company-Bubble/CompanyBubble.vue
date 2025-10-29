<template>
    <div class="company-bubble-container bg-white rounded-lg shadow-lg p-6">
        <!-- 標題 -->
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">
                公司氣泡圖分析
            </h2>
            <p class="text-gray-600">多維度公司投資分析視覺化</p>
        </div>

        <!-- 軸線設定 -->
        <div class="mb-6">
            <BubbleControls
                v-model:x-axis="xAxis"
                v-model:y-axis="yAxis"
                v-model:bubble-size="bubbleSize"
                :axis-options="numericAxisOptions"
                @update="handleAxisChange"
            />
        </div>

        <!-- 篩選區域 -->
        <div class="filter-section mb-6">
            <div class="filter-controls">
                <div class="filter-group">
                    <div class="filter-header">
                        <label class="filter-label">子產業篩選</label>
                        <div class="filter-actions">
                            <button
                                type="button"
                                class="filter-action-btn"
                                @click="selectAllSubIndustries"
                            >
                                全選
                            </button>
                            <button
                                type="button"
                                class="filter-action-btn"
                                @click="clearAllSubIndustries"
                            >
                                全取消
                            </button>
                        </div>
                    </div>
                    <div class="filter-checkbox-container">
                        <div
                            v-for="industry in subIndustryOptions"
                            :key="industry"
                            class="filter-checkbox-item"
                        >
                            <input
                                type="checkbox"
                                :id="`bubble-sub-industry-${industry}`"
                                :value="industry"
                                v-model="selectedSubIndustries"
                                @change.stop
                                class="filter-checkbox"
                            />
                            <label
                                :for="`bubble-sub-industry-${industry}`"
                                class="filter-checkbox-label"
                            >
                                {{ industry }}
                            </label>
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <div class="filter-header">
                        <label class="filter-label">產品/服務類型篩選</label>
                        <div class="filter-actions">
                            <button
                                type="button"
                                class="filter-action-btn"
                                @click="selectAllProductTypes"
                            >
                                全選
                            </button>
                            <button
                                type="button"
                                class="filter-action-btn"
                                @click="clearAllProductTypes"
                            >
                                全取消
                            </button>
                        </div>
                    </div>
                    <div class="filter-checkbox-container">
                        <div
                            v-for="type in productTypeOptions"
                            :key="type"
                            class="filter-checkbox-item"
                        >
                            <input
                                type="checkbox"
                                :id="`bubble-product-type-${type}`"
                                :value="type"
                                v-model="selectedProductTypes"
                                @change.stop
                                class="filter-checkbox"
                            />
                            <label
                                :for="`bubble-product-type-${type}`"
                                class="filter-checkbox-label"
                            >
                                {{ type }}
                            </label>
                        </div>
                    </div>
                </div>
            </div>
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
            <div class="flex gap-6">
                <!-- 圖表區域 -->
                <div class="flex-1">
                    <BubbleChart
                        :chart-data="chartData"
                        :x-axis-label="xAxisLabel"
                        :y-axis-label="yAxisLabel"
                        :bubble-size-label="bubbleSizeLabel"
                        :statistics="statistics"
                        @bubble-hover="handleBubbleHover"
                        @bubble-click="handleBubbleClick"
                    />
                </div>

                <!-- 側邊欄 -->
                <div class="w-80 bg-gray-50 rounded-lg border border-gray-200">
                    <div
                        class="p-4 border-b border-gray-200 bg-white rounded-t-lg"
                    >
                        <h3 class="text-lg font-semibold text-gray-800">
                            公司資訊
                        </h3>
                        <p class="text-sm text-gray-600">
                            點擊氣泡查看詳細資訊
                        </p>
                    </div>

                    <div class="flex-1 overflow-y-auto p-4">
                        <div
                            v-if="!selectedCompany"
                            class="text-center py-8 text-gray-500"
                        >
                            <svg
                                class="mx-auto h-12 w-12 text-gray-400 mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p>請點擊氣泡查看公司詳細資訊</p>
                        </div>

                        <div v-else class="space-y-4">
                            <!-- 公司基本資訊 -->
                            <div>
                                <h4 class="font-semibold text-gray-800 mb-3">
                                    {{
                                        selectedCompany.name ||
                                        selectedCompany.org_name
                                    }}
                                </h4>

                                <div class="space-y-2 text-sm">
                                    <div
                                        v-if="selectedCompany.org_name"
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >組織名稱:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.org_name
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="selectedCompany.country_name"
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >國家:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.country_name
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="selectedCompany.region"
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >地區:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.region
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="selectedCompany.city"
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >城市:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.city
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="selectedCompany.founded_year"
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >成立年份:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.founded_year
                                        }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 投資資訊 -->
                            <div class="border-t border-gray-200 pt-3">
                                <h5 class="font-semibold text-gray-700 mb-2">
                                    投資資訊
                                </h5>
                                <div class="space-y-2 text-sm">
                                    <div
                                        v-if="selectedCompany.investment_type"
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >投資類型:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.investment_type
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="selectedCompany.total_funding_usd"
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >總募資金額:</span
                                        >
                                        <span class="text-gray-800">{{
                                            formatCurrency(
                                                selectedCompany.total_funding_usd
                                            )
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="
                                            selectedCompany.num_funding_rounds
                                        "
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >投資輪次:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.num_funding_rounds
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="selectedCompany.funding_year"
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >募資年份:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.funding_year
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="selectedCompany.rank"
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >CB Rank:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.rank
                                        }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 產業分類 -->
                            <div
                                v-if="selectedCompany.SubIndustry"
                                class="border-t border-gray-200 pt-3"
                            >
                                <h5 class="font-semibold text-gray-700 mb-2">
                                    產業分類
                                </h5>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between">
                                        <span class="font-medium text-gray-600"
                                            >子產業:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.SubIndustry
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="
                                            selectedCompany.ProductServiceType
                                        "
                                        class="flex justify-between"
                                    >
                                        <span class="font-medium text-gray-600"
                                            >產品服務:</span
                                        >
                                        <span class="text-gray-800">{{
                                            selectedCompany.ProductServiceType
                                        }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 外部連結 -->
                            <div
                                v-if="selectedCompany.cb_url"
                                class="border-t border-gray-200 pt-3"
                            >
                                <a
                                    :href="selectedCompany.cb_url"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    <svg
                                        class="w-4 h-4 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        ></path>
                                    </svg>
                                    查看 Crunchbase 詳情
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 篩選狀態顯示 -->
        <div v-if="hasActiveFilters" class="filter-status mt-6">
            <div class="filter-status-header">
                <span class="filter-status-label">目前篩選條件：</span>
            </div>
            <div class="filter-tags">
                <div
                    v-if="selectedSubIndustries.length > 0"
                    class="filter-tag-group"
                >
                    <span class="filter-tag-label">子產業：</span>
                    <span
                        v-for="industry in selectedSubIndustries"
                        :key="industry"
                        class="filter-tag"
                    >
                        {{ industry }}
                    </span>
                </div>
                <div
                    v-if="selectedProductTypes.length > 0"
                    class="filter-tag-group"
                >
                    <span class="filter-tag-label">產品/服務類型：</span>
                    <span
                        v-for="type in selectedProductTypes"
                        :key="type"
                        class="filter-tag"
                    >
                        {{ type }}
                    </span>
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
                    {{ hoverInfo.company.name || hoverInfo.company.org_name }}
                </h4>
                <div class="text-sm text-gray-600">
                    <p v-if="hoverInfo.company.country_name">
                        <span class="font-medium">國家：</span
                        >{{ hoverInfo.company.country_name }}
                    </p>
                    <p v-if="hoverInfo.company.region">
                        <span class="font-medium">地區：</span
                        >{{ hoverInfo.company.region }}
                    </p>
                    <p v-if="hoverInfo.company.SubIndustry">
                        <span class="font-medium">子產業：</span
                        >{{ hoverInfo.company.SubIndustry }}
                    </p>
                    <p v-if="hoverInfo.company.ProductServiceType">
                        <span class="font-medium">產品服務：</span
                        >{{ hoverInfo.company.ProductServiceType }}
                    </p>
                    <p v-if="hoverInfo.company.total_funding_usd">
                        <span class="font-medium">總募資：</span
                        >{{
                            formatCurrency(hoverInfo.company.total_funding_usd)
                        }}
                    </p>
                    <p v-if="hoverInfo.company.num_funding_rounds">
                        <span class="font-medium">投資輪次：</span
                        >{{ hoverInfo.company.num_funding_rounds }}
                    </p>
                    <p v-if="hoverInfo.company.founded_year">
                        <span class="font-medium">成立年份：</span
                        >{{ hoverInfo.company.founded_year }}
                    </p>
                    <p v-if="hoverInfo.company.rank">
                        <span class="font-medium">CB Rank：</span
                        >{{ hoverInfo.company.rank }}
                    </p>
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

// 篩選狀態
const selectedSubIndustries = ref<string[]>([]);
const selectedProductTypes = ref<string[]>([]);

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

// 篩選選項
const subIndustryOptions = computed(() => {
    const industries = new Set<string>();
    processedData.value.forEach((item) => {
        if (item.SubIndustry) {
            item.SubIndustry.split(",").forEach((industry) => {
                const trimmed = industry.trim();
                if (trimmed) industries.add(trimmed);
            });
        }
    });
    return Array.from(industries).sort();
});

const productTypeOptions = computed(() => {
    const types = new Set<string>();
    processedData.value.forEach((item) => {
        if (item.ProductServiceType) {
            item.ProductServiceType.split(",").forEach((type) => {
                const trimmed = type.trim();
                if (trimmed) types.add(trimmed);
            });
        }
    });
    return Array.from(types).sort();
});

// 篩選狀態
const hasActiveFilters = computed(() => {
    return (
        selectedSubIndustries.value.length > 0 ||
        selectedProductTypes.value.length > 0
    );
});

// 篩選後的資料
const filteredBubbleData = computed(() => {
    let data = filteredData.value;

    // 應用子產業篩選
    if (selectedSubIndustries.value.length > 0) {
        data = data.filter((item) => {
            if (!item.SubIndustry) return false;
            const industries = item.SubIndustry.split(",").map((i: string) =>
                i.trim()
            );
            return selectedSubIndustries.value.some((selected) =>
                industries.includes(selected)
            );
        });
    }

    // 應用產品/服務類型篩選
    if (selectedProductTypes.value.length > 0) {
        data = data.filter((item) => {
            if (!item.ProductServiceType) return false;
            const types = item.ProductServiceType.split(",").map((t: string) =>
                t.trim()
            );
            return selectedProductTypes.value.some((selected) =>
                types.includes(selected)
            );
        });
    }

    return data;
});

// 計算屬性
const chartData = computed((): ChartDataPoint[] => {
    const config = {
        xAxis: xAxis.value,
        yAxis: yAxis.value,
        bubbleSize: bubbleSize.value,
    };

    if (filteredBubbleData.value.length === 0) {
        return [];
    }

    const result = convertToChartData(
        filteredBubbleData.value,
        xAxis.value as keyof EnergyStorageData,
        yAxis.value as keyof EnergyStorageData,
        bubbleSize.value as keyof EnergyStorageData
    );

    const validDataCount = result.filter(
        (item) => item.x > 0 && item.y > 0
    ).length;

    return result;
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

// 篩選器方法
const selectAllSubIndustries = () => {
    selectedSubIndustries.value = [...subIndustryOptions.value];
};

const clearAllSubIndustries = () => {
    selectedSubIndustries.value = [];
};

const selectAllProductTypes = () => {
    selectedProductTypes.value = [...productTypeOptions.value];
};

const clearAllProductTypes = () => {
    selectedProductTypes.value = [];
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

/* 篩選器樣式 */
.filter-section {
    @apply bg-white border border-gray-200 rounded-lg p-4;
}

.filter-controls {
    @apply flex flex-col md:flex-row gap-4;
}

.filter-group {
    @apply flex-1;
}

.filter-header {
    @apply flex justify-between items-center mb-2;
}

.filter-label {
    @apply text-sm font-medium text-gray-700;
}

.filter-actions {
    @apply flex gap-2;
}

.filter-action-btn {
    @apply px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors;
}

.filter-checkbox-container {
    @apply w-full max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50;
}

.filter-checkbox-item {
    @apply flex items-center gap-3 py-2;
}

.filter-checkbox {
    @apply w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
}

.filter-checkbox-label {
    @apply text-base text-gray-700 cursor-pointer hover:text-gray-900 flex-1;
}

/* 篩選狀態樣式 */
.filter-status {
    @apply bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4;
}

.filter-status-header {
    @apply mb-2;
}

.filter-status-label {
    @apply font-semibold text-blue-800 text-sm;
}

.filter-tags {
    @apply flex flex-wrap gap-2;
}

.filter-tag-group {
    @apply flex items-center gap-1;
}

.filter-tag-label {
    @apply font-medium text-gray-700 text-xs;
}

.filter-tag {
    @apply bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium;
}
</style>
