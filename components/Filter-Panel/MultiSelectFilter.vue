<template>
    <div class="multi-select-filter relative">
        <!-- 篩選器觸發按鈕 -->
        <button
            @click="toggleDropdown"
            class="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
            <div class="flex justify-between items-center">
                <span class="text-gray-700">
                    {{ selectedText }}
                </span>
                <svg
                    class="w-4 h-4 text-gray-400 transition-transform"
                    :class="{ 'rotate-180': isOpen }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                    ></path>
                </svg>
            </div>
        </button>

        <!-- 下拉選單 -->
        <div
            v-if="isOpen"
            class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
            <!-- 搜尋框 -->
            <div class="p-2 border-b border-gray-200">
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="搜尋選項..."
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <!-- 全選/清除按鈕 -->
            <div class="p-2 border-b border-gray-200 flex space-x-2">
                <button
                    @click="selectAll"
                    class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                >
                    全選
                </button>
                <button
                    @click="clearAll"
                    class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
                >
                    清除
                </button>
            </div>

            <!-- 選項列表 -->
            <div class="max-h-48 overflow-y-auto">
                <label
                    v-for="option in filteredOptions"
                    :key="option"
                    class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                    <input
                        :checked="localSelected.includes(option)"
                        @change="toggleOption(option)"
                        type="checkbox"
                        class="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-700">{{ option }}</span>
                </label>
            </div>

            <!-- 無結果提示 -->
            <div
                v-if="filteredOptions.length === 0"
                class="px-3 py-2 text-sm text-gray-500 text-center"
            >
                沒有找到匹配的選項
            </div>
        </div>

        <!-- 已選擇的標籤 -->
        <div v-if="localSelected.length > 0" class="mt-2 flex flex-wrap gap-1">
            <span
                v-for="item in localSelected.slice(0, 3)"
                :key="item"
                class="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
            >
                {{ item }}
                <button
                    @click="removeOption(item)"
                    class="ml-1 text-blue-600 hover:text-blue-800"
                >
                    ×
                </button>
            </span>
            <span
                v-if="localSelected.length > 3"
                class="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
            >
                +{{ localSelected.length - 3 }} 更多
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

// Props
interface Props {
    selected: string[];
    options: string[];
    placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: "請選擇...",
});

// Emits
const emit = defineEmits<{
    "update:selected": [value: string[]];
    update: [value: string[]];
}>();

// 響應式狀態
const isOpen = ref(false);
const searchQuery = ref("");
const localSelected = ref([...props.selected]);

// 計算屬性
const selectedText = computed(() => {
    if (localSelected.value.length === 0) {
        return props.placeholder;
    }
    if (localSelected.value.length === 1) {
        return localSelected.value[0];
    }
    return `${localSelected.value.length} 個選項已選擇`;
});

const filteredOptions = computed(() => {
    if (!searchQuery.value.trim()) {
        return props.options;
    }

    const query = searchQuery.value.toLowerCase();
    return props.options.filter((option) =>
        option.toLowerCase().includes(query)
    );
});

// 方法
const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
        searchQuery.value = "";
    }
};

const toggleOption = (option: string) => {
    const index = localSelected.value.indexOf(option);
    if (index > -1) {
        localSelected.value.splice(index, 1);
    } else {
        localSelected.value.push(option);
    }
    emitUpdate();
};

const removeOption = (option: string) => {
    const index = localSelected.value.indexOf(option);
    if (index > -1) {
        localSelected.value.splice(index, 1);
        emitUpdate();
    }
};

const selectAll = () => {
    localSelected.value = [...filteredOptions.value];
    emitUpdate();
};

const clearAll = () => {
    localSelected.value = [];
    emitUpdate();
};

const emitUpdate = () => {
    emit("update:selected", [...localSelected.value]);
    emit("update", [...localSelected.value]);
};

// 點擊外部關閉下拉選單
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest(".multi-select-filter")) {
        isOpen.value = false;
    }
};

// 生命週期
onMounted(() => {
    document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
});

// 監聽 props 變化
watch(
    () => props.selected,
    (newValue) => {
        localSelected.value = [...newValue];
    },
    { deep: true }
);
</script>

<style scoped>
.multi-select-filter {
    position: relative;
}

button:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input[type="checkbox"]:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
