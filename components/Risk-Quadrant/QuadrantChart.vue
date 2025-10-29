<template>
    <div class="quadrant-chart-container">
        <!-- 圖表容器 -->
        <div ref="chartContainer" class="quadrant-chart"></div>

        <!-- 象限說明 -->
        <div class="mt-6 grid grid-cols-2 gap-4">
            <div class="text-center">
                <div class="text-sm font-medium text-gray-600 mb-2">
                    風險軸 (Y軸)
                </div>
                <div class="space-y-1">
                    <div class="flex items-center justify-center">
                        <div class="w-3 h-3 bg-red-500 rounded mr-2"></div>
                        <span class="text-sm">高風險</span>
                    </div>
                    <div class="flex items-center justify-center">
                        <div class="w-3 h-3 bg-green-500 rounded mr-2"></div>
                        <span class="text-sm">低風險</span>
                    </div>
                </div>
            </div>

            <div class="text-center">
                <div class="text-sm font-medium text-gray-600 mb-2">
                    回報軸 (X軸)
                </div>
                <div class="space-y-1">
                    <div class="flex items-center justify-center">
                        <span class="text-sm">高回報</span>
                        <div class="w-3 h-3 bg-blue-500 rounded ml-2"></div>
                    </div>
                    <div class="flex items-center justify-center">
                        <span class="text-sm">低回報</span>
                        <div class="w-3 h-3 bg-gray-500 rounded ml-2"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import type { RiskQuadrantResult, Statistics } from "~/types";
import { calculateRiskScore, calculateReturnScore } from "~/utils/dataParser";

// Props
interface Props {
    quadrantData: RiskQuadrantResult;
    riskWeights: {
        fundingRounds: number;
        companyAge: number;
        cbRank: number;
    };
    returnWeights: {
        totalFunding: number;
        valuation: number;
    };
    statistics: Statistics;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
    "quadrant-click": [quadrantType: keyof RiskQuadrantResult];
}>();

// 響應式狀態
const chartContainer = ref<HTMLElement>();
let chart: any = null;

// 方法
const createQuadrantChart = async () => {
    if (!chartContainer.value) return;

    try {
        // 嘗試動態 import，如果失敗則使用 CDN
        let am5, am5xy;

        try {
            const [am5Module, am5xyModule] = await Promise.all([
                import("@amcharts/amcharts5"),
                import("@amcharts/amcharts5/xy"),
            ]);

            am5 = am5Module.default || am5Module.am5 || am5Module;
            am5xy = am5xyModule.default || am5xyModule.am5xy || am5xyModule;
        } catch (error) {
            // 等待 CDN 載入
            let attempts = 0;
            const maxAttempts = 50;

            while ((!window.am5 || !window.am5xy) && attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                attempts++;
            }

            if (!window.am5 || !window.am5xy) {
                throw new Error("AmCharts 5 載入失敗");
            }

            am5 = window.am5;
            am5xy = window.am5xy;
        }

        // 清理舊圖表
        if (chart) {
            chart.dispose();
        }

        // 建立根元素
        const root = am5.Root.new(chartContainer.value);
        // 使用預設主題，避免主題載入問題
        // root.setThemes([am5themes.AnimatedTheme.new(root)]);

        // 建立圖表
        chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                wheelX: "none",
                wheelY: "none",
                paddingLeft: 0,
                paddingRight: 0,
            })
        );

        // 建立 X 軸 (回報軸)
        const xAxis = chart.xAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererX.new(root, {
                    minGridDistance: 30,
                }),
                min: 0,
                max: 100,
            })
        );

        // 建立 Y 軸 (風險軸)
        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererY.new(root, {
                    minGridDistance: 30,
                }),
                min: 0,
                max: 100,
            })
        );

        // 建立象限背景
        const quadrantSeries = chart.series.push(
            am5xy.LineSeries.new(root, {
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "y",
                valueXField: "x",
                stroke: am5.color("#e5e7eb"),
                strokeWidth: 2,
            })
        );

        // 象限背景資料
        const quadrantBackgroundData = [
            { x: 50, y: 0 },
            { x: 50, y: 100 },
            { x: 0, y: 50 },
            { x: 100, y: 50 },
        ];
        quadrantSeries.data.setAll(quadrantBackgroundData);

        // 建立散點圖系列
        const scatterSeries = chart.series.push(
            am5xy.LineSeries.new(root, {
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "risk",
                valueXField: "return",
                stroke: am5.color("#3b82f6"),
                fill: am5.color("#3b82f6"),
                strokeWidth: 2,
                radius: 8,
            })
        );

        // 準備資料
        const chartData = [];

        // 高風險高回報
        props.quadrantData.highRiskHighReturn.forEach((company) => {
            chartData.push({
                risk: calculateRiskScore(company),
                return: calculateReturnScore(company),
                company: company.name,
                quadrant: "highRiskHighReturn",
                color: am5.color("#ef4444"),
            });
        });

        // 高風險低回報
        props.quadrantData.highRiskLowReturn.forEach((company) => {
            chartData.push({
                risk: calculateRiskScore(company),
                return: calculateReturnScore(company),
                company: company.name,
                quadrant: "highRiskLowReturn",
                color: am5.color("#f97316"),
            });
        });

        // 低風險高回報
        props.quadrantData.lowRiskHighReturn.forEach((company) => {
            chartData.push({
                risk: calculateRiskScore(company),
                return: calculateReturnScore(company),
                company: company.name,
                quadrant: "lowRiskHighReturn",
                color: am5.color("#10b981"),
            });
        });

        // 低風險低回報
        props.quadrantData.lowRiskLowReturn.forEach((company) => {
            chartData.push({
                risk: calculateRiskScore(company),
                return: calculateReturnScore(company),
                company: company.name,
                quadrant: "lowRiskLowReturn",
                color: am5.color("#6366f1"),
            });
        });

        scatterSeries.data.setAll(chartData);

        // 設定工具提示
        scatterSeries.set(
            "tooltip",
            am5.Tooltip.new(root, {
                labelText: "{company}\n風險: {risk}%\n回報: {return}%",
            })
        );

        // 點擊事件
        scatterSeries.bullets.push(() => {
            return am5.Bullet.new(root, {
                sprite: am5.Circle.new(root, {
                    radius: 6,
                    fill: am5.color("#3b82f6"),
                    stroke: am5.color("#ffffff"),
                    strokeWidth: 2,
                }),
            });
        });

        // 調試 scatterSeries 對象結構

        // 嘗試不同的方式設定點擊事件
        try {
            // 方法1: 直接設定 series 的點擊事件
            if (scatterSeries.events && scatterSeries.events.on) {
                scatterSeries.events.on("hit", (ev) => {
                    const dataContext = ev.target.dataItem?.dataContext;
                    if (dataContext?.quadrant) {
                        emit("quadrant-click", dataContext.quadrant);
                    }
                });
            }
            // 方法2: 檢查 bullets 的實際結構
            else if (scatterSeries.bullets) {
                const bulletsInfo = {
                    "bullets 可用屬性:": Object.keys(scatterSeries.bullets),
                };

                // 嘗試直接設定 bullets 事件
                if (
                    scatterSeries.bullets.events &&
                    scatterSeries.bullets.events.on
                ) {
                    scatterSeries.bullets.events.on("hit", (ev) => {
                        const dataContext = ev.target.dataItem?.dataContext;
                        if (dataContext?.quadrant) {
                            emit("quadrant-click", dataContext.quadrant);
                        }
                    });
                } else {
                }
            } else {
            }
        } catch (error) {}

        // 設定圖表尺寸
        chart.set("width", 600);
        chart.set("height", 400);

        // 添加象限標籤
        const labelContainer = chart.plotContainer.children.push(
            am5.Container.new(root, {
                width: am5.percent(100),
                height: am5.percent(100),
                layout: root.verticalLayout,
            })
        );

        // 象限標籤
        const labels = [
            { text: "高風險高回報", x: 75, y: 25, color: "#ef4444" },
            { text: "高風險低回報", x: 25, y: 25, color: "#f97316" },
            { text: "低風險高回報", x: 75, y: 75, color: "#10b981" },
            { text: "低風險低回報", x: 25, y: 75, color: "#6366f1" },
        ];

        labels.forEach((label) => {
            const labelElement = labelContainer.children.push(
                am5.Label.new(root, {
                    text: label.text,
                    x: am5.percent(label.x),
                    y: am5.percent(label.y),
                    centerX: am5.percent(50),
                    centerY: am5.percent(50),
                    fill: am5.color(label.color),
                    fontSize: 14,
                    fontWeight: "bold",
                })
            );
        });
    } catch (error) {}
};

// 生命週期
onMounted(async () => {
    await nextTick();
    await createQuadrantChart();
});

onUnmounted(() => {
    if (chart) {
        chart.dispose();
    }
});

// 監聽資料變化
watch(
    () => props.quadrantData,
    async () => {
        await nextTick();
        await createQuadrantChart();
    },
    { deep: true }
);
</script>

<style scoped>
.quadrant-chart-container {
    width: 100%;
}

.quadrant-chart {
    width: 100%;
    height: 400px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fafafa;
}
</style>
