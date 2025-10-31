<template>
    <div class="sunburst-chart-container">
        <!-- 圖表容器 -->
        <div ref="chartContainer" class="sunburst-chart"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import type { SunburstNode } from "~/types";

// Props
interface Props {
    chartData: SunburstNode[];
    dataField: string;
    loading: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
    "node-click": [node: SunburstNode];
    "node-hover": [node: SunburstNode | null];
}>();

// 響應式狀態
const chartContainer = ref<HTMLElement | null>(null);
let chart: any = null;
let root: any = null;
let series: any = null;
let hasInited = false;
let observer: IntersectionObserver | null = null;
let currentDepth = 1;
let isDrilling = false; // 防止快速連點導致狀態錯亂
let lastClickTime = 0; // 記錄上次點擊時間，用於 debounce

// 初始化圖表
const initChart = async () => {
    if (!chartContainer.value) return;

    try {
        // 使用 CDN 全域物件，避免模組匯入問題
        let am5: any, am5hierarchy: any;
        let attempts = 0;
        const maxAttempts = 200; // 增加等待時間

        console.log("等待 AmCharts 載入...");

        while (
            (!(window as any).am5 || !(window as any).am5hierarchy) &&
            attempts < maxAttempts
        ) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
        }

        console.log("AmCharts 載入檢查:", {
            am5: !!(window as any).am5,
            am5hierarchy: !!(window as any).am5hierarchy,
            attempts,
        });

        if (!(window as any).am5) {
            throw new Error("AmCharts 5 載入失敗");
        }

        if (!(window as any).am5hierarchy) {
            throw new Error(
                "AmCharts 5 hierarchy 模組載入失敗，請檢查 CDN 載入"
            );
        }

        am5 = (window as any).am5;
        am5hierarchy = (window as any).am5hierarchy;
        const am5themes_Animated = (window as any).am5themes_Animated;

        // 清理舊圖表
        if (chart) {
            chart.dispose();
        }

        // 建立根元素
        root = am5.Root.new(chartContainer.value);
        // 重新啟用 Animated 主題，呈現完整圓與順暢互動
        if (am5themes_Animated) {
            root.setThemes([am5themes_Animated.new(root)]);
        } else {
            root.setThemes([]);
        }

        // 建立容器
        const container = root.container.children.push(
            am5.Container.new(root, {
                width: am5.percent(100),
                height: am5.percent(100),
                layout: root.verticalLayout,
            })
        );

        // 建立 Sunburst 圖表 - 使用官方 demo 的設定
        series = container.children.push(
            am5hierarchy.Sunburst.new(root, {
                singleBranchOnly: true,
                downDepth: 2, // 顯示第一層+第二層+第三層
                initialDepth: 2, // 初始顯示三環
                topDepth: 1,
                innerRadius: am5.percent(10),
                startAngle: 0,
                endAngle: 360,
                radius: am5.percent(100),
                valueField: "value",
                categoryField: "name",
                childDataField: "children",
                tooltipText: "{name}: {value}",
                interactive: true,
                cursorOverStyle: "pointer",
            })
        );

        // 診斷：輸出角度與模式
        try {
            console.log("Sunburst config:", {
                startAngle: series.get("startAngle"),
                endAngle: series.get("endAngle"),
                radius: series.get("radius"),
                innerRadius: series.get("innerRadius"),
                singleBranchOnly: series.get("singleBranchOnly"),
                downDepth: series.get("downDepth"),
                initialDepth: series.get("initialDepth"),
            });
        } catch {}

        // 設定顏色主題
        if (series.colors) {
            series.colors.step = 2;
        }

        // 移除中心標籤，保留純圖形

        // 設定點擊事件 - 實作 drill-down 功能
        series.slices.template.setAll({
            cursorOverStyle: "pointer",
            tooltipText: "{name}: {value}",
            interactive: true,
        });
        series.labels.template.setAll({
            cursorOverStyle: "pointer",
            interactive: true,
        });
        if (series.nodes && series.nodes.template) {
            series.nodes.template.setAll({
                cursorOverStyle: "pointer",
                interactive: true,
            });
        }

        // 獲取根節點引用
        const getRootItem = () => {
            return series.dataItems.length > 0 ? series.dataItems[0] : null;
        };

        // 使用 AmCharts 內建的 drill-down 功能
        const handleDrill = (dataItem: any) => {
            if (!dataItem) return;
            const nodeData = dataItem.dataContext;
            const hasChildren =
                nodeData && nodeData.children && nodeData.children.length > 0;

            if (!hasChildren) {
                emit("node-click", nodeData);
                return;
            }

            const now = Date.now();
            const timeSinceLastClick = now - lastClickTime;

            // Debounce：只有在動畫進行中且點擊間隔非常短（< 80ms）時才阻止
            // 如果時間間隔已經足夠長（> 300ms），即使 isDrilling 為 true 也允許通過
            // 這樣可以確保第一次點擊不會被誤擋，同時防止真正的快速連點
            if (
                isDrilling &&
                timeSinceLastClick < 80 &&
                timeSinceLastClick > 0
            ) {
                return;
            }

            // 更新點擊時間
            lastClickTime = now;

            // 立即設置鎖定標誌，防止操作執行期間的重複點擊
            isDrilling = true;

            // 獲取當前選中狀態
            const currentSelected = series.get("selectedDataItem");

            // 為避免重疊/重複，固定只顯示所選分支
            series.set("singleBranchOnly", true);
            series.set("topDepth", 1);
            series.set("initialDepth", 2);
            series.set("downDepth", 2);

            // 統一處理：無論是否已選中，都直接執行選取和縮放
            // 對於已選中的節點，強制觸發縮放動畫
            try {
                // 如果點擊的是已選中的節點，直接強制縮放（不取消選擇）
                if (currentSelected === dataItem) {
                    // 已選中的節點：直接強制縮放，不取消選擇以避免 null 錯誤
                    if (typeof series.zoomToDataItem === "function") {
                        series.zoomToDataItem(dataItem);
                    } else {
                        // 如果 zoomToDataItem 不可用，重新選取
                        series.selectDataItem(dataItem);
                    }
                } else {
                    // 未選中的節點：正常執行選取和縮放
                    series.selectDataItem(dataItem);
                    if (typeof series.zoomToDataItem === "function") {
                        series.zoomToDataItem(dataItem);
                    }
                }
            } catch (e) {
                console.error("處理節點選取時發生錯誤:", e);
                // 發生錯誤時解鎖，避免卡在鎖定狀態
                isDrilling = false;
            }

            // 在動畫完成後解鎖
            setTimeout(() => {
                isDrilling = false;
            }, 300);

            emit("node-click", nodeData);
        };

        series.slices.template.events.on("click", (event: any) => {
            const dataItem = event.target.dataItem;
            handleDrill(dataItem);
        });

        // 讓點擊標籤或節點容器也能鑽取
        series.labels.template.events.on("click", (event: any) =>
            handleDrill(event.target.dataItem)
        );
        if (series.nodes && series.nodes.template) {
            series.nodes.template.events.on("click", (event: any) =>
                handleDrill(event.target.dataItem)
            );
        }

        // 強制顯示標籤文字（第三層數字）
        try {
            series.labels.template.setAll({
                text: "{name}",
                fontSize: 12,
                oversizedBehavior: "hide",
                visible: true,
            });
        } catch {}

        // 設定懸停事件
        series.slices.template.events.on("over", (event: any) => {
            const dataItem = event.target.dataItem;
            if (dataItem) {
                const nodeData = dataItem.dataContext;
                emit("node-hover", nodeData);
            }
        });

        series.slices.template.events.on("out", () => {
            emit("node-hover", null);
        });

        // 設定返回按鈕
        const backButton = container.children.push(
            am5.Button.new(root, {
                x: am5.p100,
                centerX: am5.p100,
                y: 0,
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                background: am5.Rectangle.new(root, {
                    fill: am5.color("#f0f0f0"),
                    stroke: am5.color("#ccc"),
                    strokeWidth: 1,
                }),
                label: am5.Label.new(root, {
                    text: "返回上一層",
                    fontSize: 12,
                    fill: am5.color("#333"),
                }),
            })
        );

        backButton.events.on("click", () => {
            const now = Date.now();
            const timeSinceLastClick = now - lastClickTime;

            // Debounce：只有在動畫進行中且點擊間隔非常短（< 80ms）時才阻止
            // 如果時間間隔已經足夠長（> 300ms），即使 isDrilling 為 true 也允許通過
            if (
                isDrilling &&
                timeSinceLastClick < 80 &&
                timeSinceLastClick > 0
            ) {
                return;
            }

            // 更新點擊時間
            lastClickTime = now;

            // 立即設置鎖定標誌
            isDrilling = true;

            // 返回根節點並恢復三層顯示（固定設定）
            const rootItem = getRootItem();
            if (!rootItem) {
                isDrilling = false;
                return;
            }

            // 獲取當前選中狀態
            const currentSelected = series.get("selectedDataItem");

            // 為避免重疊/重複，固定只顯示所選分支
            series.set("downDepth", 2);
            series.set("initialDepth", 2);
            series.set("topDepth", 1);
            series.set("singleBranchOnly", true);

            // 如果當前已選中根節點，強制觸發縮放動畫
            try {
                if (currentSelected === rootItem) {
                    // 已選中的根節點：直接強制縮放，不取消選擇以避免 null 錯誤
                    if (typeof series.zoomToDataItem === "function") {
                        series.zoomToDataItem(rootItem);
                    } else {
                        // 如果 zoomToDataItem 不可用，重新選取
                        series.selectDataItem(rootItem);
                    }
                } else {
                    // 如果根節點未被選中，正常執行選取和縮放
                    series.selectDataItem(rootItem);
                    if (typeof series.zoomToDataItem === "function") {
                        series.zoomToDataItem(rootItem);
                    }
                }
            } catch (e) {
                console.error("處理回退按鈕時發生錯誤:", e);
                // 發生錯誤時解鎖，避免卡在鎖定狀態
                isDrilling = false;
            }

            // 在動畫完成後解鎖
            setTimeout(() => {
                isDrilling = false;
            }, 300);
        });

        // 初始隱藏返回按鈕
        backButton.hide();

        // 監聽選取：僅控制返回按鈕顯示，不動層級設定
        series.events.on("dataitemselected", (ev: any) => {
            const dataItem = ev.dataItem;
            const rootItem = series.dataItems[0];
            if (dataItem && rootItem && dataItem !== rootItem) {
                backButton.show(0);
            } else {
                backButton.hide(0);
            }
        });

        // 設定資料
        updateChartData();
    } catch (error) {
        console.error("Sunburst 圖表初始化失敗:", error);
        // 顯示錯誤訊息給使用者
        if (chartContainer.value) {
            chartContainer.value.innerHTML = `
                <div class="flex items-center justify-center h-full bg-red-50 rounded-lg">
                    <div class="text-center">
                        <div class="text-red-600 text-lg font-medium mb-2">圖表載入失敗</div>
                        <div class="text-red-500 text-sm">請重新整理頁面或檢查網路連線</div>
                    </div>
                </div>
            `;
        }
    }
};

// 更新圖表資料
const updateChartData = () => {
    if (!series || !props.chartData) return;

    try {
        // 包裝資料為正確的格式
        const wrappedData = {
            name: "root",
            children: props.chartData,
        };

        // 設定資料
        series.data.setAll([wrappedData]);

        // 預設選取 root，讓初始顯示完整三層
        if (series.dataItems.length > 0) {
            series.selectDataItem(series.dataItems[0]);
        }
        series.appear(1000, 100);
    } catch (error) {
        console.error("更新圖表資料失敗:", error);
    }
};

// 重置視圖
const resetView = () => {
    if (!series) return;

    if (series.dataItems.length > 0) {
        const rootItem = series.dataItems[0];
        if (typeof series.zoomToDataItem === "function") {
            series.zoomToDataItem(rootItem);
        } else {
            series.set("selectedDataItem", rootItem);
        }
    }
};

// 暴露方法給父組件
defineExpose({
    resetView,
});

// 監聽 props 變化
// 簡單防抖，避免高頻重繪
let updateTimer: any = null;
const scheduleUpdate = () => {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
        if (series) updateChartData();
    }, 100);
};

watch(
    () => props.chartData,
    (newData) => {
        if (newData && series) {
            scheduleUpdate();
        }
    }
);

watch(
    () => props.dataField,
    (newField) => {
        if (newField && series) {
            scheduleUpdate();
        }
    }
);

// 組件掛載
onMounted(() => {
    nextTick(() => {
        // 僅在進入視窗時才初始化，避免初次大量運算造成卡頓
        if (chartContainer.value && "IntersectionObserver" in window) {
            observer = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0];
                    if (entry && entry.isIntersecting && !hasInited) {
                        hasInited = true;
                        initChart();
                        if (observer) {
                            observer.disconnect();
                            observer = null;
                        }
                    }
                },
                { threshold: 0.1 }
            );
            observer.observe(chartContainer.value);
        } else {
            initChart();
        }
    });
});

// 組件卸載
onUnmounted(() => {
    try {
        if (series) {
            series.dispose();
            series = null;
        }
        if (root) {
            root.dispose();
            root = null;
        }
        if (chart) {
            chart.dispose();
            chart = null;
        }
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    } catch (error) {
        console.error("清理圖表資源時發生錯誤:", error);
    }
});
</script>

<style scoped>
.sunburst-chart-container {
    width: 100%;
    height: 960px;
    position: relative;
    display: flex;
    align-items: center;
}

.sunburst-chart {
    width: 100%;
    height: 90%;
    border-radius: 8px;
    overflow: hidden;
}

/* 確保圖表容器有適當的尺寸 */
.sunburst-chart :deep(svg) {
    width: 100%;
    height: 100%;
}

/* 響應式設計 */
@media (max-width: 768px) {
    .sunburst-chart-container {
        height: 720px;
    }
}
</style>
