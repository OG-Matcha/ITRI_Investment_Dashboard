<template>
    <div class="bubble-chart-container">
        <!-- 圖表容器 -->
        <div ref="chartContainer" class="bubble-chart"></div>

        <!-- 圖表說明 -->
        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="text-center">
                <div class="font-medium text-gray-700 mb-1">X 軸</div>
                <div class="text-gray-600">{{ xAxisLabel }}</div>
            </div>
            <div class="text-center">
                <div class="font-medium text-gray-700 mb-1">Y 軸</div>
                <div class="text-gray-600">{{ yAxisLabel }}</div>
            </div>
            <div class="text-center">
                <div class="font-medium text-gray-700 mb-1">氣泡大小</div>
                <div class="text-gray-600">{{ bubbleSizeLabel }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import type { ChartDataPoint, Statistics } from "~/types";

// Props
interface Props {
    chartData: ChartDataPoint[];
    xAxisLabel: string;
    yAxisLabel: string;
    bubbleSizeLabel: string;
    statistics: Statistics;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
    "bubble-hover": [info: { company: any; x: number; y: number } | null];
    "bubble-click": [company: any];
}>();

// 響應式狀態
const chartContainer = ref<HTMLElement>();
let chart: any = null;

// 方法
const createBubbleChart = async () => {
    if (!chartContainer.value) return;

    try {
        // 嘗試動態 import，如果失敗則使用 CDN
        let Plotly;

        try {
            const PlotlyModule = await import("plotly.js-dist-min");
            console.log("PlotlyModule 結構:", PlotlyModule);
            console.log("PlotlyModule.default:", PlotlyModule.default);
            console.log("PlotlyModule 可用屬性:", Object.keys(PlotlyModule));
            
            // 嘗試不同的導出結構
            Plotly = PlotlyModule.default || PlotlyModule.Plotly || PlotlyModule;

            // 如果仍然沒有 newPlot，嘗試直接使用模組
            if (!Plotly || !Plotly.newPlot) {
                console.log("嘗試直接使用 PlotlyModule:", PlotlyModule);
                Plotly = PlotlyModule;
                
                // 如果還是沒有，嘗試訪問模組的屬性
                if (!Plotly.newPlot && PlotlyModule.default) {
                    console.log("嘗試使用 PlotlyModule.default");
                    Plotly = PlotlyModule.default;
                }
            }
        } catch (error) {
            console.warn("動態 import 失敗，嘗試使用 CDN:", error);

            // 等待 CDN 載入
            let attempts = 0;
            const maxAttempts = 50;

            while (!window.Plotly && attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                attempts++;
            }

            if (!window.Plotly) {
                throw new Error("Plotly.js 載入失敗");
            }

            Plotly = window.Plotly;
        }

        // 調試：檢查 Plotly 模組結構
        console.log("Plotly 模組調試:");
        console.log("Plotly:", Plotly);
        console.log("Plotly.newPlot:", Plotly.newPlot);
        console.log("Plotly 可用方法:", Object.keys(Plotly));
        console.log("Plotly 模組類型:", typeof Plotly);
        console.log("Plotly 原型:", Plotly.__proto__);

        // 嘗試不同的訪問方式
        if (Plotly && typeof Plotly === "object") {
            console.log("嘗試訪問 Plotly 的所有屬性:");
            for (const key in Plotly) {
                console.log(`  ${key}:`, typeof Plotly[key]);
            }
        }

        // 準備資料
        const data = props.chartData.map((item) => ({
            x: item.x,
            y: item.y,
            size: Math.max(item.size || 0, 5), // 最小氣泡大小
            text: item.label,
            customdata: item.data,
            mode: "markers",
            type: "scatter",
            marker: {
                size: Math.max(item.size || 0, 5),
                sizemode: "diameter",
                sizeref: 0.1,
                color: "#3b82f6",
                opacity: 0.7,
                line: {
                    color: "#ffffff",
                    width: 2,
                },
            },
            hovertemplate: `
        <b>%{text}</b><br>
        ${props.xAxisLabel}: %{x}<br>
        ${props.yAxisLabel}: %{y}<br>
        氣泡大小: %{marker.size}<br>
        <extra></extra>
      `,
        }));

        const layout = {
            title: {
                text: "公司氣泡圖分析",
                font: { size: 16 },
            },
            xaxis: {
                title: props.xAxisLabel,
                showgrid: true,
                gridcolor: "#e5e7eb",
            },
            yaxis: {
                title: props.yAxisLabel,
                showgrid: true,
                gridcolor: "#e5e7eb",
            },
            plot_bgcolor: "#fafafa",
            paper_bgcolor: "#ffffff",
            margin: { t: 50, r: 50, b: 50, l: 50 },
            hovermode: "closest",
            showlegend: false,
        };

        const config = {
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
            responsive: true,
        };

        // 建立圖表 - 檢查 newPlot 是否存在
        if (Plotly && typeof Plotly.newPlot === "function") {
            await Plotly.newPlot(chartContainer.value, data, layout, config);
        } else {
            console.error(
                "Plotly.newPlot 不存在，可用方法:",
                Object.keys(Plotly || {})
            );
            throw new Error("Plotly.newPlot 方法不存在");
        }

        // 添加點擊事件
        chartContainer.value.on("plotly_click", (eventData: any) => {
            if (eventData.points && eventData.points.length > 0) {
                const point = eventData.points[0];
                const company = point.customdata;
                emit("bubble-click", company);
            }
        });

        // 添加 hover 事件
        chartContainer.value.on("plotly_hover", (eventData: any) => {
            if (eventData.points && eventData.points.length > 0) {
                const point = eventData.points[0];
                const company = point.customdata;
                const rect = chartContainer.value!.getBoundingClientRect();
                emit("bubble-hover", {
                    company,
                    x: point.x + rect.left,
                    y: point.y + rect.top,
                });
            }
        });

        // 添加 unhover 事件
        chartContainer.value.on("plotly_unhover", () => {
            emit("bubble-hover", null);
        });

        // 設定圖表尺寸
        Plotly.Plots.resize(chartContainer.value);
    } catch (error) {
        console.error("建立氣泡圖失敗:", error);
    }
};

// 生命週期
onMounted(async () => {
    await nextTick();
    await createBubbleChart();
});

onUnmounted(() => {
    if (chartContainer.value) {
        // 清理 Plotly 圖表
        const Plotly = require("plotly.js-dist-min");
        Plotly.purge(chartContainer.value);
    }
});

// 監聽資料變化
watch(
    () => props.chartData,
    async () => {
        await nextTick();
        await createBubbleChart();
    },
    { deep: true }
);

// 監聽軸線標籤變化
watch(
    [
        () => props.xAxisLabel,
        () => props.yAxisLabel,
        () => props.bubbleSizeLabel,
    ],
    async () => {
        await nextTick();
        await createBubbleChart();
    }
);
</script>

<style scoped>
.bubble-chart-container {
    width: 100%;
}

.bubble-chart {
    width: 100%;
    height: 500px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fafafa;
}
</style>
