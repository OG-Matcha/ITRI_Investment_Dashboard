<template>
    <div class="sunburst-controls bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">圖表設定</h3>

        <div class="grid grid-cols-1 gap-6">
            <!-- 數據欄位選擇 -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    數據欄位
                </label>
                <select
                    :value="dataField"
                    @change="handleDataFieldChange"
                    :disabled="loading"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option
                        v-for="field in dataFields"
                        :key="field.value"
                        :value="field.value"
                    >
                        {{ field.label }}
                    </option>
                </select>
            </div>

            <!-- 圖表控制 -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    圖表控制
                </label>
                <div class="flex flex-wrap gap-2">
                    <button
                        @click="handleResetView"
                        :disabled="loading"
                        class="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        重置視圖
                    </button>
                    <button
                        @click="handleToggleAnimation"
                        :disabled="loading"
                        class="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {{ animationEnabled ? '關閉動畫' : '開啟動畫' }}
                    </button>
                </div>
            </div>

            <!-- 快速預設 -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    快速預設
                </label>
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="preset in presets"
                        :key="preset.name"
                        @click="applyPreset(preset)"
                        :disabled="loading"
                        class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {{ preset.name }}
                    </button>
                </div>
            </div>

            <!-- 載入狀態指示器 -->
            <div v-if="loading" class="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
                <div
                    class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"
                ></div>
                <span class="text-sm text-blue-700">處理資料中...</span>
            </div>
        </div>

        <!-- 圖例說明 -->
        <div class="mt-4 p-3 bg-white rounded-md border border-gray-200">
            <h4 class="text-sm font-medium text-gray-700 mb-2">圖例說明</h4>
            <div class="text-xs text-gray-600 space-y-1">
                <p>• 外層：SubIndustry（子產業分類）</p>
                <p>• 內層：ProductServiceType（產品服務類型）</p>
                <p>• 點擊節點可進行鑽取分析</p>
                <p>• 滑鼠懸停可查看數值（指標值以 hover 方式顯示）</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { DataField } from "~/types";

// Props
interface DataFieldOption {
    value: DataField;
    label: string;
}

interface Preset {
    name: string;
    dataField: DataField;
}

interface Props {
    dataField: DataField;
    dataFields: DataFieldOption[];
    loading: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
    "update:dataField": [value: DataField];
    "reset-view": [];
    "toggle-animation": [enabled: boolean];
}>();

// 響應式狀態
const animationEnabled = ref(true);

// 預設方案
const presets: Preset[] = [
    {
        name: "公司數量",
        dataField: "companyCount",
    },
    {
        name: "總募資金額",
        dataField: "totalFunding",
    },
    {
        name: "平均募資金額",
        dataField: "averageFunding",
    },
];

// 方法
const handleDataFieldChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    emit("update:dataField", target.value as DataField);
};

const handleResetView = () => {
    emit("reset-view");
};

const handleToggleAnimation = () => {
    animationEnabled.value = !animationEnabled.value;
    emit("toggle-animation", animationEnabled.value);
};

const applyPreset = (preset: Preset) => {
    emit("update:dataField", preset.dataField);
};
</script>

<style scoped>
.sunburst-controls {
    @apply w-full;
}

/* 確保按鈕樣式一致 */
button {
    @apply transition-colors duration-200;
}

button:hover {
    @apply bg-gray-100;
}

button:active {
    @apply bg-gray-200;
}

/* 響應式設計 */
@media (max-width: 640px) {
    .sunburst-controls .flex {
        @apply flex-col items-start space-y-2;
    }
}
</style>
