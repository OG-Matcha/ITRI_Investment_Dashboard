<template>
    <div class="risk-quadrant-container bg-white rounded-lg shadow-lg p-6">
        <!-- 標題和控制面板 -->
        <div
            class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4"
        >
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">
                    風險象限分析
                </h2>
                <p class="text-gray-600">2x2 風險回報投資分析</p>
            </div>

            <!-- 風險評估設定 -->
            <RiskAssessment
                v-model:risk-weights="riskWeights"
                v-model:return-weights="returnWeights"
                @update="handleAssessmentUpdate"
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

        <!-- 風險象限圖表 -->
        <div v-else class="risk-quadrant-content">
            <QuadrantChart
                :quadrant-data="quadrantData"
                :risk-weights="riskWeights"
                :return-weights="returnWeights"
                :statistics="statistics"
                @quadrant-click="handleQuadrantClick"
            />

            <!-- 象限統計 -->
            <div class="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-red-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-red-800 mb-2">
                        高風險高回報
                    </h3>
                    <p class="text-2xl font-bold text-red-600">
                        {{ getQuadrantCount("highRiskHighReturn") }}
                    </p>
                    <p class="text-sm text-red-600">家公司</p>
                </div>
                <div class="bg-orange-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-orange-800 mb-2">
                        高風險低回報
                    </h3>
                    <p class="text-2xl font-bold text-orange-600">
                        {{ getQuadrantCount("highRiskLowReturn") }}
                    </p>
                    <p class="text-sm text-orange-600">家公司</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-green-800 mb-2">
                        低風險高回報
                    </h3>
                    <p class="text-2xl font-bold text-green-600">
                        {{ getQuadrantCount("lowRiskHighReturn") }}
                    </p>
                    <p class="text-sm text-green-600">家公司</p>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">
                        低風險低回報
                    </h3>
                    <p class="text-2xl font-bold text-blue-600">
                        {{ getQuadrantCount("lowRiskLowReturn") }}
                    </p>
                    <p class="text-sm text-blue-600">家公司</p>
                </div>
            </div>

            <!-- 風險回報分析 -->
            <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-gray-800 mb-3">風險分布</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600"
                                >高風險公司</span
                            >
                            <span class="font-medium">{{
                                getHighRiskCount()
                            }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600"
                                >低風險公司</span
                            >
                            <span class="font-medium">{{
                                getLowRiskCount()
                            }}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div
                                class="bg-red-500 h-2 rounded-full"
                                :style="{
                                    width: `${getHighRiskPercentage()}%`,
                                }"
                            ></div>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-gray-800 mb-3">回報分布</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600"
                                >高回報公司</span
                            >
                            <span class="font-medium">{{
                                getHighReturnCount()
                            }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600"
                                >低回報公司</span
                            >
                            <span class="font-medium">{{
                                getLowReturnCount()
                            }}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div
                                class="bg-green-500 h-2 rounded-full"
                                :style="{
                                    width: `${getHighReturnPercentage()}%`,
                                }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 詳細資訊模態框 -->
        <div
            v-if="selectedQuadrant"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <div
                class="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
            >
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">
                        {{ selectedQuadrant.title }}
                    </h3>
                    <button
                        @click="selectedQuadrant = null"
                        class="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">
                            公司列表 ({{
                                selectedQuadrant.companies.length
                            }}
                            家)
                        </h4>
                        <div class="max-h-60 overflow-y-auto space-y-2">
                            <div
                                v-for="company in selectedQuadrant.companies"
                                :key="company.name"
                                class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h5 class="font-medium text-gray-800">
                                            {{ company.name }}
                                        </h5>
                                        <p class="text-sm text-gray-600">
                                            {{ company.country_name }}
                                        </p>
                                        <div class="flex space-x-4 mt-1">
                                            <span
                                                class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                                            >
                                                風險:
                                                {{ getRiskScore(company) }}%
                                            </span>
                                            <span
                                                class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                                            >
                                                回報:
                                                {{ getReturnScore(company) }}%
                                            </span>
                                        </div>
                                    </div>
                                    <div class="text-right text-sm">
                                        <p class="font-medium">
                                            {{
                                                formatCurrency(
                                                    company.total_funding_usd
                                                )
                                            }}
                                        </p>
                                        <p class="text-gray-500">
                                            {{ company.investment_type }}
                                        </p>
                                    </div>
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
import { ref, computed, watch, onMounted } from "vue";
import type {
    EnergyStorageData,
    RiskQuadrantResult,
    Statistics,
} from "~/types";
import { useDataProcessing } from "~/composables/useDataProcessing";
import { useFiltering } from "~/composables/useFiltering";
import { calculateRiskQuadrant } from "~/utils/dataUtils";
import { calculateRiskScore, calculateReturnScore } from "~/utils/dataParser";
import { formatCurrency } from "~/utils/dataParser";

// 元件引入
import RiskAssessment from "./RiskAssessment.vue";
import QuadrantChart from "./QuadrantChart.vue";

// 響應式狀態
const riskWeights = ref({
    fundingRounds: 0.4,
    companyAge: 0.3,
    cbRank: 0.3,
});

const returnWeights = ref({
    totalFunding: 0.5,
    valuation: 0.5,
});

const selectedQuadrant = ref<{
    title: string;
    companies: EnergyStorageData[];
} | null>(null);

// 使用 Composables
const { processedData, loading, error, statistics, reloadData } =
    useDataProcessing();

const { filteredData } = useFiltering(processedData);

// 計算屬性
const quadrantData = computed((): RiskQuadrantResult => {
    if (filteredData.value.length === 0) {
        return {
            highRiskHighReturn: [],
            highRiskLowReturn: [],
            lowRiskHighReturn: [],
            lowRiskLowReturn: [],
        };
    }

    return calculateRiskQuadrant(filteredData.value);
});

// 方法
const handleAssessmentUpdate = (newRiskWeights: any, newReturnWeights: any) => {
    riskWeights.value = newRiskWeights;
    returnWeights.value = newReturnWeights;
};

const handleQuadrantClick = (quadrantType: keyof RiskQuadrantResult) => {
    const companies = quadrantData.value[quadrantType];
    const quadrantLabels = {
        highRiskHighReturn: "高風險高回報",
        highRiskLowReturn: "高風險低回報",
        lowRiskHighReturn: "低風險高回報",
        lowRiskLowReturn: "低風險低回報",
    };

    selectedQuadrant.value = {
        title: `${quadrantLabels[quadrantType]} 象限 (${companies.length} 家公司)`,
        companies,
    };
};

const getQuadrantCount = (quadrantType: keyof RiskQuadrantResult): number => {
    return quadrantData.value[quadrantType].length;
};

const getHighRiskCount = (): number => {
    return (
        getQuadrantCount("highRiskHighReturn") +
        getQuadrantCount("highRiskLowReturn")
    );
};

const getLowRiskCount = (): number => {
    return (
        getQuadrantCount("lowRiskHighReturn") +
        getQuadrantCount("lowRiskLowReturn")
    );
};

const getHighReturnCount = (): number => {
    return (
        getQuadrantCount("highRiskHighReturn") +
        getQuadrantCount("lowRiskHighReturn")
    );
};

const getLowReturnCount = (): number => {
    return (
        getQuadrantCount("highRiskLowReturn") +
        getQuadrantCount("lowRiskLowReturn")
    );
};

const getHighRiskPercentage = (): number => {
    const total = getHighRiskCount() + getLowRiskCount();
    return total > 0 ? Math.round((getHighRiskCount() / total) * 100) : 0;
};

const getHighReturnPercentage = (): number => {
    const total = getHighReturnCount() + getLowReturnCount();
    return total > 0 ? Math.round((getHighReturnCount() / total) * 100) : 0;
};

const getRiskScore = (company: EnergyStorageData): number => {
    return Math.round(calculateRiskScore(company));
};

const getReturnScore = (company: EnergyStorageData): number => {
    return Math.round(calculateReturnScore(company));
};

// 生命週期
onMounted(() => {
    // 元件掛載時載入資料
});
</script>

<style scoped>
.risk-quadrant-container {
    min-height: 600px;
}

.risk-quadrant-content {
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
