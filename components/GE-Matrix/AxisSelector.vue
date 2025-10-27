<template>
    <div class="axis-selector bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">軸線設定</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- X 軸選擇 -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700"
                    >X 軸 (橫軸)</label
                >
                <select
                    v-model="localXAxis"
                    @change="handleXAxisChange"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">請選擇 X 軸</option>
                    <optgroup
                        v-for="group in groupedOptions"
                        :key="group.type"
                        :label="group.label"
                    >
                        <option
                            v-for="option in group.options"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
                    </optgroup>
                </select>
            </div>

            <!-- Y 軸選擇 -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700"
                    >Y 軸 (縱軸)</label
                >
                <select
                    v-model="localYAxis"
                    @change="handleYAxisChange"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">請選擇 Y 軸</option>
                    <optgroup
                        v-for="group in groupedOptions"
                        :key="group.type"
                        :label="group.label"
                    >
                        <option
                            v-for="option in group.options"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
                    </optgroup>
                </select>
            </div>
        </div>

        <!-- 軸線說明 -->
        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
            <div class="flex items-start space-x-2">
                <div class="text-blue-500 mt-0.5">
                    <svg
                        class="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clip-rule="evenodd"
                        ></path>
                    </svg>
                </div>
                <div class="text-sm text-blue-700">
                    <p class="font-medium">軸線說明：</p>
                    <p>
                        選擇不同的數值指標作為 X 軸和 Y
                        軸，系統會自動計算三分位數進行高中低分類。
                    </p>
                </div>
            </div>
        </div>

        <!-- 快速設定按鈕 -->
        <div class="mt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">快速設定</h4>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="preset in presets"
                    :key="preset.name"
                    @click="applyPreset(preset)"
                    class="px-3 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                    {{ preset.name }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { AxisOption } from "~/types";

// Props
interface Props {
    xAxis: string;
    yAxis: string;
    axisOptions: AxisOption[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
    "update:xAxis": [value: string];
    "update:yAxis": [value: string];
    update: [xAxis: string, yAxis: string];
}>();

// 響應式狀態
const localXAxis = ref(props.xAxis);
const localYAxis = ref(props.yAxis);

// 預設設定
const presets = [
    {
        name: "募資分析",
        xAxis: "total_funding_usd",
        yAxis: "founded_year",
    },
    {
        name: "估值分析",
        xAxis: "post_money_valuation_usd",
        yAxis: "num_funding_rounds",
    },
    {
        name: "排名分析",
        xAxis: "rank",
        yAxis: "total_funding_usd",
    },
    {
        name: "投資輪次",
        xAxis: "num_funding_rounds",
        yAxis: "founded_year",
    },
];

// 計算屬性
const groupedOptions = computed(() => {
    const groups = new Map<
        string,
        { type: string; label: string; options: AxisOption[] }
    >();

    props.axisOptions.forEach((option) => {
        if (!groups.has(option.type)) {
            const labels = {
                financial: "財務指標",
                technical: "技術指標",
                geographic: "地理指標",
                temporal: "時間指標",
            };
            groups.set(option.type, {
                type: option.type,
                label:
                    labels[option.type as keyof typeof labels] || option.type,
                options: [],
            });
        }
        groups.get(option.type)!.options.push(option);
    });

    return Array.from(groups.values());
});

// 方法
const handleXAxisChange = () => {
    emit("update:xAxis", localXAxis.value);
    emit("update", localXAxis.value, localYAxis.value);
};

const handleYAxisChange = () => {
    emit("update:yAxis", localYAxis.value);
    emit("update", localXAxis.value, localYAxis.value);
};

const applyPreset = (preset: { xAxis: string; yAxis: string }) => {
    localXAxis.value = preset.xAxis;
    localYAxis.value = preset.yAxis;
    emit("update:xAxis", preset.xAxis);
    emit("update:yAxis", preset.yAxis);
    emit("update", preset.xAxis, preset.yAxis);
};

// 監聽 props 變化
watch(
    () => props.xAxis,
    (newValue) => {
        localXAxis.value = newValue;
    }
);

watch(
    () => props.yAxis,
    (newValue) => {
        localYAxis.value = newValue;
    }
);
</script>

<style scoped>
.axis-selector {
    min-width: 300px;
}

select:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
