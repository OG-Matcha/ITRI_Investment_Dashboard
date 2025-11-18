<template>
    <div class="sunburst-analysis">
        <!-- 標題 -->
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-2xl font-bold text-gray-800">產業層級分析</h2>
            <p class="text-sm text-gray-600 mt-1">
                能源儲能產業 SubIndustry 與 ProductServiceType 兩層結構分析（滑鼠懸停顯示數值）
            </p>
        </div>

        <!-- 控制面板 -->
        <div class="px-6 py-4 border-b border-gray-200">
            <SunburstControls
                :data-field="dataField"
                :data-fields="dataFields"
                :loading="loading"
                @update:data-field="handleControlChange('dataField', $event)"
                @reset-view="handleResetView"
                @toggle-animation="handleToggleAnimation"
            />
        </div>

        <!-- 圖表區域 -->
        <div class="relative">
            <SunburstChart
                ref="chartRef"
                :chart-data="chartData"
                :data-field="dataField"
                :loading="loading"
                
            />

            <!-- 載入狀態 -->
            <div
                v-if="loading"
                class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75"
            >
                <div class="flex items-center space-x-2">
                    <div
                        class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
                    ></div>
                    <span class="text-gray-600">載入圖表中...</span>
                </div>
            </div>
        </div>

        <!-- 側邊欄 -->
        <div
            v-if="false"
            class="w-80 bg-gray-50 rounded-lg border border-gray-200 p-4 m-4 max-h-96 overflow-y-auto"
        >
            <h3 class="text-lg font-semibold text-gray-800 mb-3">
                {{ selectedNode.name }}
            </h3>

            <div class="space-y-3">
                <!-- 基本統計 -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">
                            {{ selectedNode.value }}
                        </div>
                        <div class="text-sm text-gray-600">
                            {{ dataField === 'companyCount' ? '公司數量' : '募資金額' }}
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">
                            {{ selectedNode.children?.length || 0 }}
                        </div>
                        <div class="text-sm text-gray-600">子類別數</div>
                    </div>
                </div>

                <!-- 詳細資訊 -->
                <div v-if="selectedNode.children" class="mt-4">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">子類別分佈</h4>
                    <div class="space-y-1">
                        <div
                            v-for="child in selectedNode.children.slice(0, 5)"
                            :key="child.name"
                            class="flex justify-between items-center text-sm"
                        >
                            <span class="text-gray-600">{{ child.name }}</span>
                            <span class="font-medium">{{ child.value }}</span>
                        </div>
                        <div
                            v-if="selectedNode.children.length > 5"
                            class="text-xs text-gray-500 text-center"
                        >
                            還有 {{ selectedNode.children.length - 5 }} 個子類別...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useDataProcessing } from "~/composables/useDataProcessing";
import { useSunburstData } from "~/composables/useSunburstData";
import type { SunburstNode, DataField } from "~/types";

// 組件導入
import SunburstControls from "./SunburstControls.vue";
import SunburstChart from "./SunburstChart.vue";

// 使用 Composables
const { processedData } = useDataProcessing();
const { sunburstData, loading } = useSunburstData(processedData);

// 響應式數據
const dataField = ref<DataField>("companyCount");
const selectedNode = ref<SunburstNode | null>(null);
const hoverInfo = ref<{ name: string; value: string } | null>(null);
const chartRef = ref<any>(null);

// 數據字段選項
const dataFields: Array<{ value: DataField; label: string }> = [
    { value: "companyCount", label: "公司數量" },
    { value: "totalFunding", label: "總募資金額" },
    { value: "averageFunding", label: "平均募資金額" },
];

// 計算屬性
const chartData = computed(() => {
    return sunburstData.value[dataField.value] || [];
});

// 方法
const handleControlChange = (field: string, value: any) => {
    if (field === "dataField") {
        dataField.value = value;
    }
};

const handleResetView = () => {
    selectedNode.value = null;
    hoverInfo.value = null;
    if (chartRef.value) {
        chartRef.value.resetView();
    }
};

const handleNodeClick = (node: SunburstNode) => {
    selectedNode.value = node;
};

const handleNodeHover = (node: SunburstNode | null) => {
    if (node) {
        hoverInfo.value = {
            name: node.name,
            value: node.value.toString(),
        };
    } else {
        hoverInfo.value = null;
    }
};

const handleToggleAnimation = (enabled: boolean) => {
    // 動畫切換功能可以在這裡實作
    console.log("動畫切換:", enabled);
};

// 監聽資料變化
watch(
    () => processedData.value,
    () => {
        // 資料更新時重置選中狀態
        selectedNode.value = null;
        hoverInfo.value = null;
    },
    { deep: true }
);
</script>

<style scoped>
.sunburst-analysis {
    @apply bg-white rounded-lg shadow-lg overflow-hidden;
}

/* 響應式設計 */
@media (max-width: 768px) {
    .sunburst-analysis {
        @apply rounded-none shadow-none;
    }
    
    .sunburst-analysis .w-80 {
        @apply w-full mx-2;
    }
}

@media (max-width: 640px) {
    .sunburst-analysis .px-6 {
        @apply px-4;
    }
    
    .sunburst-analysis .py-4 {
        @apply py-3;
    }
}
</style>
