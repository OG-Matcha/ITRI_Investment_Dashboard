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

        // 調試：檢查傳入的資料
        console.log("🔍 BubbleChart - 接收到的資料:", props.chartData);
        console.log("🔍 BubbleChart - 資料數量:", props.chartData.length);
        console.log("🔍 BubbleChart - 前3筆資料:", props.chartData.slice(0, 3));

        // 檢查資料範圍 - 更寬鬆的過濾條件
        const isFiniteNumber = (v: unknown): v is number =>
            typeof v === "number" && Number.isFinite(v);

        // 詳細的資料分析
        console.log("🔍 BubbleChart - 開始分析資料有效性");

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
        const xValidCount = dataAnalysis.filter((d) => d.xValid).length;
        const yValidCount = dataAnalysis.filter((d) => d.yValid).length;
        const sizeValidCount = dataAnalysis.filter((d) => d.sizeValid).length;

        console.log("🔍 BubbleChart - 資料有效性統計:", {
            total: props.chartData.length,
            valid: validCount,
            xValid: xValidCount,
            yValid: yValidCount,
            sizeValid: sizeValidCount,
        });

        // 顯示前5筆無效資料的詳細信息
        const invalidData = dataAnalysis.filter((d) => !d.valid).slice(0, 5);
        if (invalidData.length > 0) {
            console.log("🔍 BubbleChart - 前5筆無效資料:", invalidData);
        }

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

        console.log("🔍 BubbleChart - 過濾後資料統計:", {
            filteredCount: filteredPoints.length,
            processedCount: processedPoints.length,
            xRange:
                xValues.length > 0
                    ? { min: Math.min(...xValues), max: Math.max(...xValues) }
                    : null,
            yRange:
                yValues.length > 0
                    ? { min: Math.min(...yValues), max: Math.max(...yValues) }
                    : null,
            sizeRange:
                sizeValues.length > 0
                    ? {
                          min: Math.min(...sizeValues),
                          max: Math.max(...sizeValues),
                      }
                    : null,
        });

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

        console.log("🔍 BubbleChart - X軸範圍:", { min: minX, max: maxX });
        console.log("🔍 BubbleChart - Y軸範圍:", { min: minY, max: maxY });
        console.log("🔍 BubbleChart - 氣泡大小範圍:", {
            min: minSize,
            max: maxSize,
        });

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

        console.log("🔍 BubbleChart - 準備的資料點:", {
            x: data[0].x.slice(0, 3),
            y: data[0].y.slice(0, 3),
            text: data[0].text.slice(0, 3),
            size: data[0].marker.size.slice(0, 3),
        });
        console.log("🔍 BubbleChart - 氣泡大小參考值:", sizeRef);
        console.log("🔍 BubbleChart - Marker 配置:", {
            sizemode: "area",
            sizeref: sizeRef,
            sizemin: 6,
            sizemax: 60,
        });

        // 詳細的資料點驗證
        console.log("🔍 BubbleChart - 資料點驗證開始");

        // 檢查資料有效性
        const validX = data[0].x.filter((x) => x > 0 && !isNaN(x));
        const validY = data[0].y.filter((y) => y > 0 && !isNaN(y));
        const validSize = data[0].marker.size.filter((s) => s > 0 && !isNaN(s));

        console.log("🔍 BubbleChart - 有效資料點統計:", {
            validX: validX.length,
            validY: validY.length,
            validSize: validSize.length,
            totalData: data[0].x.length,
        });

        // 檢查資料範圍
        console.log("🔍 BubbleChart - 實際資料範圍:", {
            xRange: { min: Math.min(...validX), max: Math.max(...validX) },
            yRange: { min: Math.min(...validY), max: Math.max(...validY) },
            sizeRange: {
                min: Math.min(...validSize),
                max: Math.max(...validSize),
            },
        });

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
            console.log("🔍 BubbleChart - 開始渲染 Plotly 圖表");
            console.log("🔍 BubbleChart - 資料點數量:", data.length);
            console.log("🔍 BubbleChart - Layout 配置:", layout);
            console.log("🔍 BubbleChart - 軸線配置:", {
                xaxis: { type: "linear", range: "auto" },
                yaxis: { range: "auto" },
            });

            await Plotly.newPlot(chartContainer.value, data, layout, config);

            console.log("✅ BubbleChart - Plotly 圖表渲染完成");

            // 檢查渲染後的圖表狀態
            console.log("🔍 BubbleChart - 圖表渲染完成，檢查容器狀態");

            // 檢查圖表容器的大小
            const rect = chartContainer.value.getBoundingClientRect();
            console.log("🔍 BubbleChart - 圖表容器大小:", {
                width: rect.width,
                height: rect.height,
            });

            // 檢查容器是否有內容
            const containerHTML = chartContainer.value.innerHTML;
            console.log(
                "🔍 BubbleChart - 容器 HTML 長度:",
                containerHTML.length
            );
            console.log(
                "🔍 BubbleChart - 容器是否包含 SVG:",
                containerHTML.includes("<svg")
            );

            // 檢查 Plotly 圖表是否正確渲染
            const plotDiv = chartContainer.value as any;
            if (plotDiv && plotDiv.data) {
                console.log(
                    "🔍 BubbleChart - Plotly 圖表資料存在:",
                    plotDiv.data.length
                );
            } else {
                console.log("❌ BubbleChart - Plotly 圖表資料不存在");
            }

            // 詳細的 SVG 和氣泡渲染檢查
            console.log("🔍 BubbleChart - 開始 SVG 檢查");

            const svgElement = chartContainer.value.querySelector("svg");
            if (svgElement) {
                console.log("✅ BubbleChart - SVG 元素存在");

                // 檢查所有可能的氣泡元素
                const circles = svgElement.querySelectorAll("circle");
                const paths = svgElement.querySelectorAll("path");
                const gElements = svgElement.querySelectorAll("g");

                console.log("🔍 BubbleChart - SVG 元素統計:", {
                    circles: circles.length,
                    paths: paths.length,
                    gElements: gElements.length,
                });

                if (circles.length > 0) {
                    console.log("✅ BubbleChart - 找到圓圈元素");
                    const circleArray = Array.from(circles).slice(0, 3);
                    console.log(
                        "🔍 BubbleChart - 前3個圓圈的屬性:",
                        circleArray.map((circle) => ({
                            cx: circle.getAttribute("cx"),
                            cy: circle.getAttribute("cy"),
                            r: circle.getAttribute("r"),
                            fill: circle.getAttribute("fill"),
                            opacity: circle.getAttribute("opacity"),
                        }))
                    );
                } else {
                    console.log(
                        "❌ BubbleChart - 沒有找到圓圈元素，檢查 path 元素"
                    );

                    // 檢查 path 元素，Plotly 可能使用 path 渲染氣泡
                    if (paths.length > 0) {
                        console.log(
                            "✅ BubbleChart - 找到 path 元素，可能是氣泡"
                        );
                        const pathArray = Array.from(paths).slice(0, 3);
                        console.log(
                            "🔍 BubbleChart - 前3個 path 元素的屬性:",
                            pathArray.map((path) => ({
                                d: path.getAttribute("d"),
                                fill: path.getAttribute("fill"),
                                opacity: path.getAttribute("opacity"),
                                class: path.getAttribute("class"),
                                stroke: path.getAttribute("stroke"),
                                strokeWidth: path.getAttribute("stroke-width"),
                            }))
                        );

                        // 檢查所有可能的顏色
                        const allFills = Array.from(paths)
                            .map((p) => p.getAttribute("fill"))
                            .filter((f) => f);
                        const uniqueFills = [...new Set(allFills)];
                        console.log(
                            "🔍 BubbleChart - 所有 path 的 fill 顏色:",
                            uniqueFills
                        );

                        // 檢查是否有氣泡相關的 path
                        const bubblePaths = svgElement.querySelectorAll(
                            "path[fill='#3b82f6']"
                        );
                        console.log(
                            "🔍 BubbleChart - 藍色氣泡 path 數量:",
                            bubblePaths.length
                        );

                        // 檢查是否有其他可能的氣泡選擇器
                        const scatterPaths =
                            svgElement.querySelectorAll("path.scatter");
                        const tracePaths = svgElement.querySelectorAll(
                            "path[class*='trace']"
                        );
                        const markerPaths = svgElement.querySelectorAll(
                            "path[class*='marker']"
                        );

                        console.log("🔍 BubbleChart - 其他可能的氣泡元素:", {
                            scatterPaths: scatterPaths.length,
                            tracePaths: tracePaths.length,
                            markerPaths: markerPaths.length,
                        });
                    }

                    // 檢查是否有其他可能的氣泡元素
                    const allElements = svgElement.querySelectorAll("*");
                    console.log(
                        "🔍 BubbleChart - SVG 中所有元素:",
                        allElements.length
                    );

                    // 檢查是否有 plotly 特定的元素
                    const plotlyElements =
                        svgElement.querySelectorAll("[class*='plotly']");
                    console.log(
                        "🔍 BubbleChart - Plotly 元素:",
                        plotlyElements.length
                    );
                }
            } else {
                console.log("❌ BubbleChart - 找不到 SVG 元素");
            }
        } else {
            console.error(
                "Plotly.newPlot 不存在，可用方法:",
                Object.keys(Plotly || {})
            );
            throw new Error("Plotly.newPlot 方法不存在");
        }

        // 設置點擊事件監聽器
        console.log("🔍 BubbleChart - 設置點擊事件監聽器");

        (chartContainer.value as any).on("plotly_click", (eventData: any) => {
            console.log("🔍 BubbleChart - 氣泡被點擊", eventData);
            if (eventData.points && eventData.points.length > 0) {
                const point = eventData.points[0];
                const company = point.customdata;
                console.log("🔍 BubbleChart - 點擊的公司資料", company);
                emit("bubble-click", company);
            }
        });

        // 設定圖表尺寸
        Plotly.Plots.resize(chartContainer.value);

        // 最終驗證和測試
        console.log("🔍 BubbleChart - 開始最終驗證");

        // 等待一小段時間讓圖表完全渲染
        setTimeout(() => {
            if (!chartContainer.value) return;
            const finalSvgElement = chartContainer.value.querySelector("svg");
            if (finalSvgElement) {
                const finalCircles = finalSvgElement.querySelectorAll("circle");
                const finalPaths = finalSvgElement.querySelectorAll("path");
                const bubblePaths = finalSvgElement.querySelectorAll(
                    "path[fill='#3b82f6']"
                );

                console.log("🔍 BubbleChart - 最終驗證結果:", {
                    svgExists: true,
                    circlesFound: finalCircles.length,
                    pathsFound: finalPaths.length,
                    bubblePathsFound: bubblePaths.length,
                    chartRendered: true,
                    dataPoints: data[0].x.length,
                });

                if (finalCircles.length > 0) {
                    console.log(
                        "✅ BubbleChart - 氣泡圖渲染成功！(使用 circle 元素)"
                    );
                } else if (bubblePaths.length > 0) {
                    console.log(
                        "✅ BubbleChart - 氣泡圖渲染成功！(使用 path 元素)"
                    );
                } else {
                    console.log(
                        "❌ BubbleChart - 氣泡圖渲染失敗，沒有找到氣泡元素"
                    );
                }
            } else {
                console.log("❌ BubbleChart - 最終驗證失敗，沒有找到 SVG 元素");
            }
        }, 1000);
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
