<template>
    <div class="filter-panel bg-white rounded-lg shadow-lg p-6">
        <!-- 標題 -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">
                    多維度篩選
                </h2>
                <p class="text-gray-600">選擇篩選條件來分析特定資料</p>
            </div>

            <!-- 篩選狀態 -->
            <FilterStatus
                :has-active-filters="hasActiveFilters"
                :filter-summary="filterSummary"
                @clear-all="clearAllFilters"
            />
        </div>

        <!-- 篩選器網格 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 子產業篩選 -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-800">子產業篩選</h3>
                <MultiSelectFilter
                    v-model:selected="subIndustryFilters"
                    :options="filterOptions.subIndustries"
                    placeholder="選擇子產業..."
                    @update="handleSubIndustryChange"
                />
                <div class="text-sm text-gray-500">
                    已選擇 {{ subIndustryFilters.length }} 個子產業
                </div>
            </div>

            <!-- 產品服務類型篩選 -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-800">
                    產品服務類型篩選
                </h3>
                <MultiSelectFilter
                    v-model:selected="productServiceTypeFilters"
                    :options="filterOptions.productServiceTypes"
                    placeholder="選擇產品服務類型..."
                    @update="handleProductServiceTypeChange"
                />
                <div class="text-sm text-gray-500">
                    已選擇 {{ productServiceTypeFilters.length }} 個類型
                </div>
            </div>

            <!-- 國家篩選 -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-800">國家篩選</h3>
                <MultiSelectFilter
                    v-model:selected="countryFilters"
                    :options="filterOptions.countries"
                    placeholder="選擇國家..."
                    @update="handleCountryChange"
                />
                <div class="text-sm text-gray-500">
                    已選擇 {{ countryFilters.length }} 個國家
                </div>
            </div>

            <!-- 投資類型篩選 -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-800">
                    投資類型篩選
                </h3>
                <MultiSelectFilter
                    v-model:selected="investmentTypeFilters"
                    :options="filterOptions.investmentTypes"
                    placeholder="選擇投資類型..."
                    @update="handleInvestmentTypeChange"
                />
                <div class="text-sm text-gray-500">
                    已選擇 {{ investmentTypeFilters.length }} 個類型
                </div>
            </div>
        </div>

        <!-- 年份範圍篩選 -->
        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 成立年份範圍 -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-800">
                    成立年份範圍
                </h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                            >起始年份</label
                        >
                        <input
                            v-model.number="foundedYearRange[0]"
                            @change="handleFoundedYearChange"
                            type="number"
                            :min="minFoundedYear"
                            :max="maxFoundedYear"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                            >結束年份</label
                        >
                        <input
                            v-model.number="foundedYearRange[1]"
                            @change="handleFoundedYearChange"
                            type="number"
                            :min="minFoundedYear"
                            :max="maxFoundedYear"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <div class="text-sm text-gray-500">
                    範圍：{{ foundedYearRange[0] }} - {{ foundedYearRange[1] }}
                </div>
            </div>

            <!-- 募資年份範圍 -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-800">
                    募資年份範圍
                </h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                            >起始年份</label
                        >
                        <input
                            v-model.number="fundingYearRange[0]"
                            @change="handleFundingYearChange"
                            type="number"
                            :min="minFundingYear"
                            :max="maxFundingYear"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                            >結束年份</label
                        >
                        <input
                            v-model.number="fundingYearRange[1]"
                            @change="handleFundingYearChange"
                            type="number"
                            :min="minFundingYear"
                            :max="maxFundingYear"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <div class="text-sm text-gray-500">
                    範圍：{{ fundingYearRange[0] }} - {{ fundingYearRange[1] }}
                </div>
            </div>
        </div>

        <!-- 快速篩選按鈕 -->
        <div class="mt-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">快速篩選</h3>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="preset in filterPresets"
                    :key="preset.name"
                    @click="applyPreset(preset)"
                    class="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                >
                    {{ preset.name }}
                </button>
            </div>
        </div>

        <!-- 篩選結果統計 -->
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">篩選結果</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <span class="text-gray-600">符合條件的公司：</span>
                    <span class="font-medium">{{ filteredCount }}</span>
                </div>
                <div>
                    <span class="text-gray-600">總公司數：</span>
                    <span class="font-medium">{{ totalCount }}</span>
                </div>
                <div>
                    <span class="text-gray-600">篩選比例：</span>
                    <span class="font-medium">{{ filterPercentage }}%</span>
                </div>
                <div>
                    <span class="text-gray-600">活躍篩選：</span>
                    <span class="font-medium">{{ activeFilterCount }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { FilterOptions } from "~/types";
import { useDataProcessing } from "~/composables/useDataProcessing";
import { useFiltering } from "~/composables/useFiltering";

// 元件引入
import MultiSelectFilter from "./MultiSelectFilter.vue";
import FilterStatus from "./FilterStatus.vue";

// 響應式狀態
const subIndustryFilters = ref<string[]>([]);
const productServiceTypeFilters = ref<string[]>([]);
const countryFilters = ref<string[]>([]);
const investmentTypeFilters = ref<string[]>([]);
const foundedYearRange = ref<[number, number]>([2000, 2025]);
const fundingYearRange = ref<[number, number]>([2000, 2025]);

// 使用 Composables
const { processedData, filterOptions } = useDataProcessing();
const {
    filteredData,
    hasActiveFilters,
    filterSummary,
    setFilters,
    clearFilters,
} = useFiltering(processedData);

// 計算屬性
const totalCount = computed(() => processedData.value.length);
const filteredCount = computed(() => filteredData.value.length);
const filterPercentage = computed(() => {
    if (totalCount.value === 0) return 0;
    return Math.round((filteredCount.value / totalCount.value) * 100);
});

const activeFilterCount = computed(() => {
    let count = 0;
    if (subIndustryFilters.value.length > 0) count++;
    if (productServiceTypeFilters.value.length > 0) count++;
    if (countryFilters.value.length > 0) count++;
    if (investmentTypeFilters.value.length > 0) count++;
    if (
        foundedYearRange.value[0] !== 2000 ||
        foundedYearRange.value[1] !== 2025
    )
        count++;
    if (
        fundingYearRange.value[0] !== 2000 ||
        fundingYearRange.value[1] !== 2025
    )
        count++;
    return count;
});

const minFoundedYear = computed(() => {
    if (processedData.value.length === 0) return 2000;
    return Math.min(...processedData.value.map((item) => item.founded_year));
});

const maxFoundedYear = computed(() => {
    if (processedData.value.length === 0) return 2025;
    return Math.max(...processedData.value.map((item) => item.founded_year));
});

const minFundingYear = computed(() => {
    if (processedData.value.length === 0) return 2000;
    return Math.min(...processedData.value.map((item) => item.funding_year));
});

const maxFundingYear = computed(() => {
    if (processedData.value.length === 0) return 2025;
    return Math.max(...processedData.value.map((item) => item.funding_year));
});

// 快速篩選預設
const filterPresets = [
    {
        name: "電池技術",
        filters: {
            subIndustries: ["電池技術", "電池製造"],
            productServiceTypes: ["電池回收再利用", "電池製造"],
        },
    },
    {
        name: "電動車",
        filters: {
            subIndustries: ["電動車", "電動車充電"],
            productServiceTypes: ["電動車製造", "充電設備"],
        },
    },
    {
        name: "儲能系統",
        filters: {
            subIndustries: ["儲能系統", "儲能系統整合"],
            productServiceTypes: ["儲能設備", "系統整合"],
        },
    },
    {
        name: "清除篩選",
        filters: {
            subIndustries: [],
            productServiceTypes: [],
            countries: [],
            investmentTypes: [],
        },
    },
];

// 方法
const handleSubIndustryChange = () => {
    updateFilters();
};

const handleProductServiceTypeChange = () => {
    updateFilters();
};

const handleCountryChange = () => {
    updateFilters();
};

const handleInvestmentTypeChange = () => {
    updateFilters();
};

const handleFoundedYearChange = () => {
    updateFilters();
};

const handleFundingYearChange = () => {
    updateFilters();
};

const updateFilters = () => {
    setFilters({
        subIndustries: subIndustryFilters.value,
        productServiceTypes: productServiceTypeFilters.value,
        countries: countryFilters.value,
        investmentTypes: investmentTypeFilters.value,
        foundedYearRange: foundedYearRange.value,
        fundingYearRange: fundingYearRange.value,
    });
};

const clearAllFilters = () => {
    subIndustryFilters.value = [];
    productServiceTypeFilters.value = [];
    countryFilters.value = [];
    investmentTypeFilters.value = [];
    foundedYearRange.value = [minFoundedYear.value, maxFoundedYear.value];
    fundingYearRange.value = [minFundingYear.value, maxFundingYear.value];
    clearFilters();
};

const applyPreset = (preset: (typeof filterPresets)[0]) => {
    if (preset.name === "清除篩選") {
        clearAllFilters();
        return;
    }

    subIndustryFilters.value = preset.filters.subIndustries || [];
    productServiceTypeFilters.value = preset.filters.productServiceTypes || [];
    countryFilters.value = preset.filters.countries || [];
    investmentTypeFilters.value = preset.filters.investmentTypes || [];

    updateFilters();
};

// 生命週期
onMounted(() => {
    // 初始化年份範圍
    foundedYearRange.value = [minFoundedYear.value, maxFoundedYear.value];
    fundingYearRange.value = [minFundingYear.value, maxFundingYear.value];
});
</script>

<style scoped>
.filter-panel {
    min-height: 400px;
}

input:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
