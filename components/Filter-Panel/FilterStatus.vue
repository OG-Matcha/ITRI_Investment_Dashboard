<template>
    <div class="filter-status">
        <!-- 篩選狀態指示器 -->
        <div class="flex items-center space-x-2">
            <div
                class="w-3 h-3 rounded-full"
                :class="hasActiveFilters ? 'bg-green-500' : 'bg-gray-300'"
            ></div>
            <span class="text-sm font-medium text-gray-700">
                {{ hasActiveFilters ? "篩選已啟用" : "無篩選" }}
            </span>
        </div>

        <!-- 篩選摘要 -->
        <div v-if="hasActiveFilters" class="mt-2">
            <div class="text-sm text-gray-600 mb-2">當前篩選條件：</div>
            <div class="flex flex-wrap gap-1">
                <span
                    v-for="(item, index) in filterSummary"
                    :key="index"
                    class="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                    {{ item }}
                </span>
            </div>
        </div>

        <!-- 清除按鈕 -->
        <button
            v-if="hasActiveFilters"
            @click="$emit('clear-all')"
            class="mt-3 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
        >
            清除所有篩選
        </button>

        <!-- 篩選統計 -->
        <div v-if="hasActiveFilters" class="mt-4 p-3 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-700">
                <div class="flex justify-between items-center mb-1">
                    <span>篩選效果</span>
                    <span class="font-medium">{{ filterEffect }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                        class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        :style="{ width: `${filterEffectPercentage}%` }"
                    ></div>
                </div>
            </div>
        </div>

        <!-- 篩選建議 -->
        <div v-if="!hasActiveFilters" class="mt-4 p-3 bg-blue-50 rounded-lg">
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
                    <p class="font-medium">篩選建議：</p>
                    <p>使用左側篩選器來縮小分析範圍，獲得更精確的投資洞察。</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

// Props
interface Props {
    hasActiveFilters: boolean;
    filterSummary: string[];
    totalCount?: number;
    filteredCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
    totalCount: 0,
    filteredCount: 0,
});

// Emits
const emit = defineEmits<{
    "clear-all": [];
}>();

// 計算屬性
const filterEffect = computed(() => {
    if (props.totalCount === 0) return "0%";
    const percentage = Math.round(
        (props.filteredCount / props.totalCount) * 100
    );
    return `${percentage}%`;
});

const filterEffectPercentage = computed(() => {
    if (props.totalCount === 0) return 0;
    return Math.round((props.filteredCount / props.totalCount) * 100);
});
</script>

<style scoped>
.filter-status {
    min-width: 200px;
}

button:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
</style>
