<template>
    <div class="bubble-chart-container">
        <!-- 圖表容器 -->
        <div ref="chartContainer" class="bubble-chart"></div>
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
        // 使用 CDN 載入的 Plotly（在 nuxt.config.ts 中已配置）
        let Plotly;

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

        // 驗證 Plotly 對象
        if (!Plotly || !Plotly.newPlot) {
            throw new Error("Plotly.newPlot 方法不存在");
        }

        // 檢查資料範圍 - 更寬鬆的過濾條件
        const isFiniteNumber = (v: unknown): v is number =>
            typeof v === "number" && Number.isFinite(v);

        const dataAnalysis = props.chartData.map((p, index) => {
            const xValid = isFiniteNumber(p.x) && p.x > 0;
            const yValid = isFiniteNumber(p.y) && p.y > 0;
            const sizeValid = isFiniteNumber(p.size) && (p.size as number) > 0;

            return {
                index,
                x: p.x,
                y: p.y,
                size: p.size,
                xValid,
                yValid,
                sizeValid,
                valid: xValid && yValid && sizeValid,
            };
        });

        // 統計有效資料
        const validCount = dataAnalysis.filter((d) => d.valid).length;

        // 更寬鬆的過濾條件：只要 x 和 y 有效，size 可以為 0 或無效
        const filteredPoints = props.chartData.filter(
            (p) =>
                isFiniteNumber(p.x) && isFiniteNumber(p.y) && p.x > 0 && p.y > 0
        );

        // 為 size 提供默認值
        const processedPoints = filteredPoints.map((item) => ({
            ...item,
            size:
                isFiniteNumber(item.size) && (item.size as number) > 0
                    ? (item.size as number)
                    : 10, // 默認氣泡大小
        }));

        const xValues = processedPoints.map((item) => item.x);
        const yValues = processedPoints.map((item) => item.y);
        const sizeValues = processedPoints.map((item) => item.size);

        if (processedPoints.length === 0) {
            console.error("❌ BubbleChart - 沒有有效的資料點");
            return;
        }

        // 確保數組不為空，避免 TypeScript 錯誤
        const maxX = Math.max(...xValues);
        const minX = Math.min(...xValues);
        const maxY = Math.max(...yValues);
        const minY = Math.min(...yValues);
        const maxSize = Math.max(...sizeValues);
        const minSize = Math.min(...sizeValues);

        // 將要繪製的資料（僅保留有效點，避免 log 軸下無法渲染）
        const drawData = processedPoints;

        // sizeref 計算（Plotly 官方建議）：
        // 當 sizemode 為 'area' 時，sizeref = 2 * max(size) / (desired_max_px^2)
        const desiredMaxPx = 40;
        const sizeRef = sizeValues.length
            ? (2 * Math.max(...sizeValues)) / (desiredMaxPx * desiredMaxPx)
            : 2;

        // 動態決定是否使用對數軸（解決雙軸單位跨度過大問題）
        const useLogX =
            Math.max(...xValues) / Math.max(1, Math.min(...xValues)) > 1000;
        const useLogY =
            Math.max(...yValues) / Math.max(1, Math.min(...yValues)) > 1000;

        // 準備資料 - 確保 Plotly 能正確解析
        const data = [
            {
                x: drawData.map((item) => item.x),
                y: drawData.map((item) => item.y),
                text: drawData.map((item) => item.label),
                customdata: drawData.map((item) => item.data),
                mode: "markers",
                type: "scatter",
                marker: {
                    size: drawData.map((item) => Math.max(item.size || 0, 6)),
                    sizemode: "area",
                    sizeref: sizeRef,
                    sizemin: 6,
                    sizemax: 60,
                    symbol: "circle",
                    color: drawData.map(() => "rgba(59,130,246,0.9)"),
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
            },
        ];

        const layout = {
            title: {
                text: "公司氣泡圖分析",
                font: { size: 16 },
            },
            xaxis: {
                title: props.xAxisLabel,
                showgrid: true,
                gridcolor: "#e5e7eb",
                // 讓 Plotly 自動計算範圍
                type: useLogX ? "log" : "linear",
            },
            yaxis: {
                title: props.yAxisLabel,
                showgrid: true,
                gridcolor: "#e5e7eb",
                // 讓 Plotly 自動計算範圍
                type: useLogY ? "log" : "linear",
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
            staticPlot: false, // 確保不是靜態圖表
            doubleClick: false, // 禁用雙擊
            showTips: true, // 啟用提示
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

        // 設置點擊事件監聽器
        (chartContainer.value as any).on("plotly_click", (eventData: any) => {
            if (eventData.points && eventData.points.length > 0) {
                const point = eventData.points[0];
                const company = point.customdata;
                emit("bubble-click", company);
            }
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
