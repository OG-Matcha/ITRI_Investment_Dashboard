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
let formatTooltipTextFn: ((text: string, target: any) => string) | null = null; // 保存格式化函數，用於重新應用
let applyTooltipAdapterFn: (() => void) | null = null; // 保存應用 adapter 的函數

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

        // 建立 Sunburst 圖表 - 兩層結構：SubIndustry（第1層）→ ProductServiceType（第2層）
        // 數據會被包裝成 root（第0層），但 topDepth: 1 會跳過它
        series = container.children.push(
            am5hierarchy.Sunburst.new(root, {
                singleBranchOnly: false, // 顯示完整圓形（所有分支）
                downDepth: 1, // 向下顯示一層
                initialDepth: 2, // 初始顯示到第2層（SubIndustry + ProductServiceType）
                topDepth: 1, // 從第1層 SubIndustry 開始顯示（跳過 root 層）
                innerRadius: am5.percent(10),
                startAngle: 0,
                endAngle: 360,
                radius: am5.percent(100),
                valueField: "value",
                categoryField: "name",
                childDataField: "children",
                // tooltipText 由 adapter 處理，不在這裡設置
                interactive: true,
                cursorOverStyle: "pointer",
                // 不使用 nodeClickBehavior，我們手動處理點擊邏輯以確保 singleBranchOnly 正確工作
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
        // 增強 tooltip：格式化數值顯示（hover 時顯示）
        series.slices.template.setAll({
            cursorOverStyle: "pointer",
            tooltipText: "{name}\n{value}", // 設置初始值，讓 adapter 可以處理
            interactive: true,
        });

        // 格式化 tooltip 的函數（統一使用，避免重複）
        formatTooltipTextFn = (text: string, target: any): string => {
            const dataItem = target.dataItem;
            if (!dataItem) return text || "";

            const dataContext = dataItem.dataContext;
            if (!dataContext) return text || "";

            // 根據 dataField 格式化數值顯示
            let formattedValue = "";
            const value = dataContext.value;

            if (typeof value === "number" && !isNaN(value)) {
                if (props.dataField === "companyCount") {
                    // 公司數量：顯示「X 家數」
                    formattedValue = `${value.toLocaleString()} 家公司`;
                } else if (
                    props.dataField === "totalFunding" ||
                    props.dataField === "averageFunding"
                ) {
                    // 金額：統一使用 M（百萬）作為單位，標示為美元
                    const valueInMillions = value / 1000000;
                    formattedValue = `$${valueInMillions.toFixed(2)} M USD`;
                } else {
                    formattedValue = value.toLocaleString();
                }
            } else {
                formattedValue = String(value || "");
            }

            return `${dataContext.name}\n${formattedValue}`;
        };

        // 應用 tooltip adapter（只添加一次，函數內部會讀取最新的 props.dataField）
        // 注意：adapter 函數內部會讀取 props.dataField，所以不需要重新添加
        series.slices.template.adapters.add("tooltipText", formatTooltipTextFn);
        if (series.nodes && series.nodes.template) {
            series.nodes.template.adapters.add(
                "tooltipText",
                formatTooltipTextFn
            );
        }

        // 應用 tooltip adapter 的函數（用於數據更新時確保 adapter 存在）
        applyTooltipAdapterFn = () => {
            // adapter 已經添加，不需要重新添加
            // formatTooltipTextFn 內部會讀取最新的 props.dataField
        };
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
            const nodeHasChildren =
                nodeData && nodeData.children && nodeData.children.length > 0;

            if (!nodeHasChildren) {
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

            // 如果點擊的是已選中的節點，取消選取以返回完整圓形
            if (currentSelected === dataItem) {
                try {
                    // 已選中的節點：取消選取，返回完整圓形
                    series.set("selectedDataItem", null);
                    series.set("singleBranchOnly", false); // 恢復完整圓形顯示
                    series.set("topDepth", 1); // 跳過 root 層，從第1層 SubIndustry 開始
                    series.set("initialDepth", 2); // 顯示到第2層（ProductServiceType）
                    series.set("downDepth", 1); // 向下顯示一層
                } catch (e) {
                    console.error("處理節點取消選取時發生錯誤:", e);
                    isDrilling = false;
                }
            } else {
                // 未選中的節點：先取消之前的選取，設置配置，再選取新節點
                try {
                    // 如果是點擊 SubIndustry（第1層，有 children），設置為只顯示該分支
                    if (nodeHasChildren) {
                        // 先取消之前的選取（如果有的話）
                        if (currentSelected) {
                            series.set("selectedDataItem", null);
                        }

                        // 設置 singleBranchOnly，確保只顯示被點擊的分支
                        series.set("singleBranchOnly", true); // 只顯示被點擊的分支
                        series.set("topDepth", 1); // 跳過 root 層，從第1層 SubIndustry 開始
                        series.set("initialDepth", 2); // 顯示到第2層（ProductServiceType）
                        series.set("downDepth", 1); // 向下顯示一層

                        // 等待配置生效後再選取節點
                        setTimeout(() => {
                            try {
                                series.selectDataItem(dataItem);
                                if (
                                    typeof series.zoomToDataItem === "function"
                                ) {
                                    series.zoomToDataItem(dataItem);
                                }
                            } catch (e) {
                                console.error("選取節點時發生錯誤:", e);
                            }
                        }, 50); // 增加等待時間，確保配置生效
                    } else {
                        // 如果沒有 children，直接選取（雖然不應該發生，因為前面已經過濾）
                        series.selectDataItem(dataItem);
                    }
                } catch (e) {
                    console.error("處理節點選取時發生錯誤:", e);
                    // 發生錯誤時解鎖，避免卡在鎖定狀態
                    isDrilling = false;
                }
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

        // 設定標籤文字（只顯示名稱，不顯示數字，數字在 hover 時顯示）
        try {
            series.labels.template.setAll({
                text: "{name}",
                fontSize: 12,
                oversizedBehavior: "hide",
                visible: true,
            });
        } catch {}

        // 設定懸停事件 - 增強 tooltip 顯示
        series.slices.template.events.on("over", (event: any) => {
            const dataItem = event.target.dataItem;
            if (dataItem) {
                const nodeData = dataItem.dataContext;
                // 觸發 hover 事件，讓父組件可以顯示額外資訊
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

            // 返回完整圓形顯示
            series.set("downDepth", 1); // 向下顯示一層
            series.set("initialDepth", 2); // 顯示到第2層（ProductServiceType）
            series.set("topDepth", 1); // 跳過 root 層，從第1層 SubIndustry 開始
            series.set("singleBranchOnly", false);

            // 返回完整圓形顯示（取消選取，顯示所有分支）
            try {
                // 取消選取，恢復完整圓形顯示
                series.set("selectedDataItem", null);
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

        // 監聽選取：當有選取節點時顯示返回按鈕（用於返回完整圓形）
        series.events.on("dataitemselected", (ev: any) => {
            const dataItem = ev.dataItem;
            // 如果有選取任何節點（包括根節點），顯示返回按鈕
            if (dataItem) {
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
        // 驗證數據格式
        if (!Array.isArray(props.chartData) || props.chartData.length === 0) {
            console.warn("Sunburst chartData 為空或格式不正確");
            return;
        }

        // 調試：輸出傳入的數據（可選，用於驗證）
        if (process.env.NODE_ENV === "development") {
            console.log("=== Sunburst Chart 接收的數據 ===");
            console.log("SubIndustry 節點數:", props.chartData.length);
            const totalValue = props.chartData.reduce(
                (sum, node) => sum + (node.value || 0),
                0
            );
            console.log("總 value:", totalValue);
        }

        // 包裝成統一根節點，確保所有 SubIndustry 都能顯示
        // 第一層（root）→ 第二層（SubIndustry）→ 第三層（ProductServiceType）
        // 但我們設置 topDepth: 1 來跳過 root 層，只顯示 SubIndustry 和 ProductServiceType
        // root 的 value 為所有子節點的 value 總和
        const rootValue = props.chartData.reduce(
            (sum, node) => sum + (node.value || 0),
            0
        );
        const wrappedData = {
            name: "root",
            value: rootValue, // root 也需要有 value
            children: props.chartData,
        };

        // root value 已計算，用於確保完整圓形顯示
        series.data.setAll([wrappedData]);

        // 確保配置正確
        series.set("singleBranchOnly", false);
        series.set("topDepth", 1); // 跳過 root 層（第0層），從 SubIndustry 開始顯示（第1層）
        series.set("initialDepth", 2); // 顯示到第2層（ProductServiceType）
        series.set("downDepth", 1); // 向下顯示一層

        // 重新應用 tooltip adapter，確保數據更新後仍然有效
        if (applyTooltipAdapterFn) {
            applyTooltipAdapterFn();
        }

        // 初始狀態顯示完整圓形（不選取任何節點，顯示所有分支）
        series.appear(1000, 100);
    } catch (error) {
        console.error("更新圖表資料失敗:", error);
    }
};

// 重置視圖 - 恢復完整圓形顯示
const resetView = () => {
    if (!series) return;

    // 重置為完整圓形顯示（兩層：SubIndustry → ProductServiceType）
    series.set("singleBranchOnly", false);
    series.set("topDepth", 1); // 跳過 root 層，從第1層 SubIndustry 開始
    series.set("initialDepth", 2); // 顯示到第2層（ProductServiceType）
    series.set("downDepth", 1); // 向下顯示一層

    // 取消選取，顯示所有分支
    series.set("selectedDataItem", null);

    // 如果需要重新載入資料
    if (series.dataItems.length > 0) {
        updateChartData();
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
            // 當 dataField 改變時，需要重新應用 tooltip adapter
            if (applyTooltipAdapterFn) {
                applyTooltipAdapterFn();
            }
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
