<template>
    <div class="geo-controls bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">地圖設定</h3>

        <div class="grid grid-cols-1 gap-6">
            <!-- 數據欄位選擇 -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    數據欄位
                </label>
                <select
                    :value="dataField"
                    @change="handleDataFieldChange"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option
                        v-for="option in dataFields"
                        :key="option.value"
                        :value="option.value"
                    >
                        {{ option.label }}
                    </option>
                </select>
            </div>
        </div>

        <!-- 快速預設 -->
        <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                快速預設
            </label>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="preset in presets"
                    :key="preset.name"
                    @click="applyPreset(preset)"
                    class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                    {{ preset.name }}
                </button>
            </div>
        </div>

        <!-- 圖例說明 -->
        <div class="mt-4 p-3 bg-white rounded-md border border-gray-200">
            <h4 class="text-sm font-medium text-gray-700 mb-2">圖例說明</h4>
            <div class="text-xs text-gray-600 space-y-1">
                <p>• 顏色深淺表示 {{ getCurrentDataFieldLabel() }} 的高低</p>
                <p>• 點擊國家可查看詳細資訊</p>
                <p>• 滑鼠懸停可查看基本數據</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

// Props
interface DataFieldOption {
    value: string;
    label: string;
}

interface Preset {
    name: string;
    dataField: string;
}

interface Props {
    dataField: string;
    dataFields: DataFieldOption[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
    "update:dataField": [value: string];
    update: [];
}>();

// 預設方案
const presets: Preset[] = [
    {
        name: "公司數量",
        dataField: "companyCount",
    },
    {
        name: "募資金額",
        dataField: "totalFunding",
    },
    {
        name: "平均募資",
        dataField: "averageFunding",
    },
    {
        name: "最大募資",
        dataField: "maxFunding",
    },
];

// 計算屬性
const getCurrentDataFieldLabel = () => {
    const field = props.dataFields.find((f) => f.value === props.dataField);
    return field ? field.label : "數據";
};

// 方法
const handleDataFieldChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    emit("update:dataField", target.value);
    emit("update");
};

const applyPreset = (preset: Preset) => {
    emit("update:dataField", preset.dataField);
    emit("update");
};
</script>

<style scoped>
.geo-controls {
    @apply bg-gray-50 rounded-lg p-4;
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
</style>
