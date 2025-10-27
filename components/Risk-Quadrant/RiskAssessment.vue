<template>
    <div class="risk-assessment bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
            風險回報評估設定
        </h3>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 風險評估權重 -->
            <div class="space-y-4">
                <h4 class="font-medium text-gray-700">風險評估權重</h4>

                <div class="space-y-3">
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-600 mb-1"
                        >
                            投資輪次數量 ({{
                                Math.round(
                                    localRiskWeights.fundingRounds * 100
                                )
                            }}%)
                        </label>
                        <input
                            v-model.number="localRiskWeights.fundingRounds"
                            @input="handleRiskWeightsChange"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-sm font-medium text-gray-600 mb-1"
                        >
                            公司年齡 ({{
                                Math.round(localRiskWeights.companyAge * 100)
                            }}%)
                        </label>
                        <input
                            v-model.number="localRiskWeights.companyAge"
                            @input="handleRiskWeightsChange"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-sm font-medium text-gray-600 mb-1"
                        >
                            CB Rank 排名 ({{
                                Math.round(localRiskWeights.cbRank * 100)
                            }}%)
                        </label>
                        <input
                            v-model.number="localRiskWeights.cbRank"
                            @input="handleRiskWeightsChange"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <!-- 回報評估權重 -->
            <div class="space-y-4">
                <h4 class="font-medium text-gray-700">回報評估權重</h4>

                <div class="space-y-3">
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-600 mb-1"
                        >
                            總募資金額 ({{
                                Math.round(
                                    localReturnWeights.totalFunding * 100
                                )
                            }}%)
                        </label>
                        <input
                            v-model.number="localReturnWeights.totalFunding"
                            @input="handleReturnWeightsChange"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-sm font-medium text-gray-600 mb-1"
                        >
                            投後估值 ({{
                                Math.round(localReturnWeights.valuation * 100)
                            }}%)
                        </label>
                        <input
                            v-model.number="localReturnWeights.valuation"
                            @input="handleReturnWeightsChange"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- 快速設定按鈕 -->
        <div class="mt-6">
            <h4 class="text-lg font-medium text-gray-700 mb-4">快速設定</h4>
            <div class="flex flex-wrap gap-3">
                <button
                    v-for="preset in presets"
                    :key="preset.name"
                    @click="applyPreset(preset)"
                    class="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                >
                    {{ preset.name }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

// Props
interface Props {
    riskWeights: {
        fundingRounds: number;
        companyAge: number;
        cbRank: number;
    };
    returnWeights: {
        totalFunding: number;
        valuation: number;
    };
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
    "update:riskWeights": [value: typeof props.riskWeights];
    "update:returnWeights": [value: typeof props.returnWeights];
    update: [
        riskWeights: typeof props.riskWeights,
        returnWeights: typeof props.returnWeights
    ];
}>();

// 響應式狀態
const localRiskWeights = ref({ ...props.riskWeights });
const localReturnWeights = ref({ ...props.returnWeights });

// 預設設定
const presets = [
    {
        name: "平衡評估",
        riskWeights: { fundingRounds: 0.4, companyAge: 0.3, cbRank: 0.3 },
        returnWeights: { totalFunding: 0.5, valuation: 0.5 },
    },
    {
        name: "募資導向",
        riskWeights: { fundingRounds: 0.6, companyAge: 0.2, cbRank: 0.2 },
        returnWeights: { totalFunding: 0.8, valuation: 0.2 },
    },
    {
        name: "估值導向",
        riskWeights: { fundingRounds: 0.2, companyAge: 0.4, cbRank: 0.4 },
        returnWeights: { totalFunding: 0.2, valuation: 0.8 },
    },
    {
        name: "保守評估",
        riskWeights: { fundingRounds: 0.3, companyAge: 0.5, cbRank: 0.2 },
        returnWeights: { totalFunding: 0.3, valuation: 0.7 },
    },
];

// 計算屬性
const normalizedRiskWeights = computed(() => {
    const total =
        localRiskWeights.value.fundingRounds +
        localRiskWeights.value.companyAge +
        localRiskWeights.value.cbRank;
    if (total === 0)
        return { fundingRounds: 0.33, companyAge: 0.33, cbRank: 0.34 };

    return {
        fundingRounds: localRiskWeights.value.fundingRounds / total,
        companyAge: localRiskWeights.value.companyAge / total,
        cbRank: localRiskWeights.value.cbRank / total,
    };
});

const normalizedReturnWeights = computed(() => {
    const total =
        localReturnWeights.value.totalFunding +
        localReturnWeights.value.valuation;
    if (total === 0) return { totalFunding: 0.5, valuation: 0.5 };

    return {
        totalFunding: localReturnWeights.value.totalFunding / total,
        valuation: localReturnWeights.value.valuation / total,
    };
});

// 方法
const handleRiskWeightsChange = () => {
    const normalized = normalizedRiskWeights.value;
    emit("update:riskWeights", normalized);
    emit("update", normalized, normalizedReturnWeights.value);
};

const handleReturnWeightsChange = () => {
    const normalized = normalizedReturnWeights.value;
    emit("update:returnWeights", normalized);
    emit("update", normalizedRiskWeights.value, normalized);
};

const applyPreset = (preset: (typeof presets)[0]) => {
    localRiskWeights.value = { ...preset.riskWeights };
    localReturnWeights.value = { ...preset.returnWeights };

    emit("update:riskWeights", preset.riskWeights);
    emit("update:returnWeights", preset.returnWeights);
    emit("update", preset.riskWeights, preset.returnWeights);
};

// 監聽 props 變化
watch(
    () => props.riskWeights,
    (newValue) => {
        localRiskWeights.value = { ...newValue };
    },
    { deep: true }
);

watch(
    () => props.returnWeights,
    (newValue) => {
        localReturnWeights.value = { ...newValue };
    },
    { deep: true }
);
</script>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

input[type="range"]::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
