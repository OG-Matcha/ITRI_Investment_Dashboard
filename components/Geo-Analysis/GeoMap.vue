<template>
    <div class="geo-map-container">
        <!-- 地圖容器 -->
        <div ref="mapContainer" class="geo-map"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";

// Props
interface MapData {
    name: string;
    companyCount: number;
    totalFunding: number;
    averageFunding: number;
    maxFunding: number;
    industries: Array<{ name: string; count: number }>;
    fundingRounds: Array<{ name: string; count: number }>;
}

interface Props {
    mapData: MapData[];
    dataField: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
    "country-click": [country: MapData];
    "country-hover": [country: MapData, event: MouseEvent];
}>();

// 響應式狀態
const mapContainer = ref<HTMLElement | null>(null);
let chart: any = null;
let root: any = null;

// 固定藍色系配置
const colorScheme = {
    low: "#dbeafe", // 淺藍色
    high: "#1e40af", // 深藍色
};

// 初始化地圖
const initMap = async () => {
    if (!mapContainer.value) return;

    try {
        // 使用 CDN 全域物件，避免 polylabel 匯入問題
        let am5: any, am5map: any, am5geodata: any;
        let attempts = 0;
        const maxAttempts = 100;
        while (
            (!(window as any).am5 ||
                !(window as any).am5map ||
                !(window as any).am5geodata_worldLow) &&
            attempts < maxAttempts
        ) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
        }
        if (
            !(window as any).am5 ||
            !(window as any).am5map ||
            !(window as any).am5geodata_worldLow
        ) {
            throw new Error("AmCharts 5 或 geodata CDN 載入失敗");
        }
        am5 = (window as any).am5;
        am5map = (window as any).am5map;
        am5geodata = (window as any).am5geodata_worldLow;

        // 清理舊圖表
        if (chart) {
            chart.dispose();
        }

        // 建立根元素
        root = am5.Root.new(mapContainer.value);
        root.setThemes([]);

        // 建立地圖圖表 - 參考官方 demo
        chart = root.container.children.push(
            am5map.MapChart.new(root, {
                projection: am5map.geoMercator(), // 使用官方 demo 的投影
                // 官方 demo 沒有設定這些參數，讓 AmCharts 使用預設值
            })
        );

        // 建立地圖多邊形系列
        const polygonSeries = chart.series.push(
            am5map.MapPolygonSeries.new(root, {
                geoJSON: am5geodata,
                valueField: "value",
                calculateAggregates: true,
                // 改善互動響應
                interactive: true,
                cursorOverStyle: "pointer",
            })
        );

        // 初始化 heatRules 為空數組
        polygonSeries.set("heatRules", []);

        // 驗證 polygonSeries 創建成功
        console.log("polygonSeries 創建成功:", {
            seriesType: polygonSeries.constructor.name,
            hasGeoJSON: !!polygonSeries.get("geoJSON"),
            valueField: polygonSeries.get("valueField"),
            interactive: polygonSeries.get("interactive"),
        });

        // 驗證地圖配置 - 參考官方 demo
        console.log("地圖配置設定:", {
            projection: chart.get("projection")?.constructor?.name || "unknown",
            panX: chart.get("panX"),
            panY: chart.get("panY"),
            wheelX: chart.get("wheelX"),
            wheelY: chart.get("wheelY"),
            wheelZ: chart.get("wheelZ"),
            // 官方 demo 使用預設值，所以這些可能為 undefined
        });

        // 設定多邊形模板
        const polygonTemplate = polygonSeries.mapPolygons.template;
        polygonTemplate.setAll({
            tooltipText: "{name}: {value}",
            interactive: true,
            stroke: am5.color("#ffffff"),
            strokeWidth: 1,
            // 改善互動響應
            cursorOverStyle: "pointer",
            tooltipY: 0,
        });

        // 設定數據
        updateMapData();

        // 添加垂直熱力圖例 - 參考官方 demo
        const heatLegend = chart.children.push(
            am5.HeatLegend.new(root, {
                orientation: "vertical",
                startColor: am5.color(colorScheme.low),
                endColor: am5.color(colorScheme.high),
                startText: "最低",
                endText: "最高",
                stepCount: 8,
                x: am5.p100,
                centerX: am5.p100,
                paddingRight: 20,
                paddingTop: 20,
                paddingBottom: 20,
            })
        );

        // 設定圖例標籤樣式 - 參考官方 demo
        heatLegend.startLabel.setAll({
            fontSize: 12,
            fill: heatLegend.get("startColor"),
        });

        heatLegend.endLabel.setAll({
            fontSize: 12,
            fill: heatLegend.get("endColor"),
        });

        // 點擊事件
        polygonTemplate.events.on("click", (ev: any) => {
            const dataItem = ev.target?.dataItem;
            if (!dataItem) return;
            const name = dataItem.dataContext?.name;
            if (!name) return;
            const countryData = props.mapData.find((d) => d.name === name);
            if (countryData) {
                emit("country-click", countryData);
            }
        });

        // 懸停事件 - 參考官方 demo
        polygonTemplate.events.on("pointerover", (ev: any) => {
            const dataItem = ev.target?.dataItem;
            if (!dataItem) return;
            const name = dataItem.dataContext?.name;
            if (!name) return;
            const countryData = props.mapData.find((d) => d.name === name);
            if (countryData) {
                // 使用官方 demo 的方式顯示圖例指針
                const value = getFieldValue(countryData, props.dataField);
                if (value > 0) {
                    heatLegend.showValue(value);
                }

                const oe = ev.originalEvent || ev.nativeEvent || {};
                emit("country-hover", countryData, oe);
            }
        });

        // 離開事件 - 官方 demo 不隱藏指針
        polygonTemplate.events.on("pointerout", (ev: any) => {
            // 官方 demo 保持指針顯示
        });

        // 添加 datavalidated 事件來自動設定圖例範圍 - 參考官方 demo
        polygonSeries.events.on("datavalidated", function () {
            heatLegend.set("startValue", polygonSeries.getPrivate("valueLow"));
            heatLegend.set("endValue", polygonSeries.getPrivate("valueHigh"));
        });

        // 添加內建的縮放控制 - 使用 AmCharts 5 官方功能
        chart.set(
            "zoomControl",
            am5map.ZoomControl.new(root, {
                // 設定縮放控制的位置 - 更深入地圖內部
                x: 60,
                y: am5.p50,
                centerY: am5.p50,
            })
        );

        console.log("地圖初始化完成");
    } catch (error) {
        console.error("地圖初始化失敗:", error);
    }
};

// 更新地圖數據
const updateMapData = () => {
    if (!chart || !props.mapData) return;

    const polygonSeries = chart.series.getIndex(0);
    if (!polygonSeries) return;

    // 準備數據 - 使用國家代碼作為 ID
    const data = props.mapData
        .map((country) => {
            const countryCode = getCountryCode(country.name);
            const value = getFieldValue(country, props.dataField);

            // 調試：檢查國家名稱映射
            if (countryCode === country.name) {
                console.log("國家名稱映射失敗:", {
                    originalName: country.name,
                    mappedCode: countryCode,
                    value: value,
                });
            }

            return {
                id: countryCode,
                name: country.name,
                value: value, // 保持原始值，包括 0
                hasData: value > 0, // 添加標記來區分是否有數據
            };
        })
        .filter((country) => country.hasData); // 只保留有數據的國家

    // 計算數據範圍 - 現在所有數據都是 > 0 的
    const values = data.map((d) => d.value);
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 1;

    // 調試：檢查實際的數據範圍
    console.log("數據範圍調試:", {
        totalCountries: data.length,
        allValues: data.map((d) => ({ name: d.name, value: d.value })),
        minValue,
        maxValue,
        range: maxValue - minValue,
        isUSAMaxValue:
            data.find((d) => d.name === "United States" || d.id === "US")
                ?.value === maxValue,
        top5Countries: data
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((d) => ({ name: d.name, value: d.value })),
    });

    // 更新組件級別的變數
    currentMinValue = minValue;
    currentMaxValue = maxValue;

    console.log("數據範圍分析:", {
        totalCountries: data.length,
        countriesWithData: values.length,
        minValue,
        maxValue,
        sampleData: data
            .slice(0, 10)
            .map((d) => ({ name: d.name, value: d.value, hasData: d.hasData })),
        topCountries: data
            .filter((d) => d.hasData)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((d) => ({ name: d.name, value: d.value })),
        usaData: data.find((d) => d.name === "United States" || d.id === "US"),
    });

    // 設定數據
    polygonSeries.data.setAll(data);

    // 使用 AmCharts 5 原生 heatRules - 參考官方 demo
    const am5 = (window as any).am5;

    if (maxValue > minValue) {
        // 使用官方 demo 的 heatRules 語法 - 不設定 minValue 和 maxValue
        // AmCharts 5 會自動從數據中計算這些值
        polygonSeries.set("heatRules", [
            {
                target: polygonSeries.mapPolygons.template,
                dataField: "value",
                min: am5.color(colorScheme.low), // 低值 = 淺色
                max: am5.color(colorScheme.high), // 高值 = 深色
                key: "fill",
            },
        ]);

        // 驗證最高值國家的顏色映射
        const maxValueCountry = data.find((d) => d.value === maxValue);
        const minValueCountry = data.find((d) => d.value === minValue);

        console.log("使用官方 demo heatRules 設定顏色映射:", {
            minValue,
            maxValue,
            colorScheme,
            lowColor: colorScheme.low,
            highColor: colorScheme.high,
            countriesWithData: values.length,
            range: `${minValue} - ${maxValue}`,
            heatRulesApplied: true,
            maxValueCountry: maxValueCountry
                ? {
                      name: maxValueCountry.name,
                      value: maxValueCountry.value,
                      shouldBeDarkest: true,
                  }
                : null,
            minValueCountry: minValueCountry
                ? {
                      name: minValueCountry.name,
                      value: minValueCountry.value,
                      shouldBeLightest: true,
                  }
                : null,
        });
    } else {
        // 如果沒有數據差異，設定統一顏色
        polygonSeries.mapPolygons.template.set(
            "fill",
            am5.color(colorScheme.low)
        );
        console.log("設定統一顏色:", colorScheme.low);
    }

    // 重要：確保沒有數據的國家顯示為最淺色
    console.log(
        "檢查無數據國家:",
        data.filter((d) => !d.hasData).map((d) => d.name)
    );

    // 直接設定模板的默認顏色，然後讓 heatRules 覆蓋有數據的國家
    polygonSeries.mapPolygons.template.set("fill", am5.color(colorScheme.low));

    // 使用 setTimeout 確保地圖完全渲染後再設定顏色
    setTimeout(() => {
        data.forEach((country) => {
            if (!country.hasData) {
                // 直接通過 ID 找到多邊形
                const polygon = polygonSeries.mapPolygons.getIndex(
                    polygonSeries.data.indexOf(country)
                );
                if (polygon) {
                    polygon.set("fill", am5.color(colorScheme.low));
                    console.log(`設定 ${country.name} 為最淺色（無數據）`);
                } else {
                    // 嘗試通過 ID 查找
                    const polygonById = polygonSeries.mapPolygons.getIndex(
                        country.id
                    );
                    if (polygonById) {
                        polygonById.set("fill", am5.color(colorScheme.low));
                        console.log(
                            `通過 ID 設定 ${country.name} 為最淺色（無數據）`
                        );
                    }
                }
            }
        });
    }, 200);

    console.log(
        "地圖數據已更新:",
        data.length,
        "個國家",
        "值範圍:",
        minValue,
        "-",
        maxValue
    );
};

// 獲取欄位值
const getFieldValue = (country: MapData, field: string): number => {
    let value: number;
    switch (field) {
        case "companyCount":
            value = country.companyCount;
            break;
        case "totalFunding":
            value = country.totalFunding;
            break;
        case "averageFunding":
            value = country.averageFunding;
            break;
        case "maxFunding":
            value = country.maxFunding;
            break;
        default:
            value = country.companyCount;
    }

    // 調試信息
    if (Math.random() < 0.1) {
        // 只顯示 10% 的調試信息
        console.log(`國家 ${country.name} 的 ${field} 值:`, value);
    }

    return value;
};

// 組件級別的變數來存儲數據範圍
let currentMinValue = 0;
let currentMaxValue = 1;

// 國家名稱到 ISO 代碼的映射
const getCountryCode = (countryName: string): string => {
    const countryMap: { [key: string]: string } = {
        // 美國的各種變體
        "United States": "US",
        "United States of America": "US",
        USA: "US",
        US: "US",
        America: "US",

        // 中國的各種變體
        China: "CN",
        "People's Republic of China": "CN",
        PRC: "CN",
        "Mainland China": "CN",

        // 其他主要國家
        Japan: "JP",
        Germany: "DE",
        "United Kingdom": "GB",
        UK: "GB",
        "Great Britain": "GB",
        Britain: "GB",
        France: "FR",
        India: "IN",
        Italy: "IT",
        Brazil: "BR",
        Canada: "CA",
        "South Korea": "KR",
        Korea: "KR",
        "Republic of Korea": "KR",
        Russia: "RU",
        "Russian Federation": "RU",
        Australia: "AU",
        Spain: "ES",
        Mexico: "MX",
        Indonesia: "ID",
        Netherlands: "NL",
        Holland: "NL",
        "Saudi Arabia": "SA",
        Turkey: "TR",
        Switzerland: "CH",
        Taiwan: "TW",
        "Republic of China": "TW",
        Belgium: "BE",
        Argentina: "AR",
        Nigeria: "NG",
        Austria: "AT",
        Israel: "IL",
        Sweden: "SE",
        Poland: "PL",
        Norway: "NO",
        "United Arab Emirates": "AE",
        UAE: "AE",
        Thailand: "TH",
        "South Africa": "ZA",
        Denmark: "DK",
        Malaysia: "MY",
        Singapore: "SG",
        Philippines: "PH",
        Chile: "CL",
        Finland: "FI",
        Bangladesh: "BD",
        Vietnam: "VN",
        "Viet Nam": "VN",
        Romania: "RO",
        "Czech Republic": "CZ",
        Czechia: "CZ",
        "New Zealand": "NZ",
        Peru: "PE",
        Iraq: "IQ",
        Greece: "GR",
        Portugal: "PT",
        Algeria: "DZ",
        Kazakhstan: "KZ",
        Hungary: "HU",
        Kuwait: "KW",
        Ukraine: "UA",
        Morocco: "MA",
        Ecuador: "EC",
        Ethiopia: "ET",
        Angola: "AO",
        Venezuela: "VE",
        Ghana: "GH",
        Kenya: "KE",
        Tanzania: "TZ",
        Myanmar: "MM",
        Burma: "MM",
        Uzbekistan: "UZ",
        Nepal: "NP",
        Afghanistan: "AF",
        Yemen: "YE",
        Mozambique: "MZ",
        Madagascar: "MG",
        Cameroon: "CM",
        "Côte d'Ivoire": "CI",
        "Ivory Coast": "CI",
        Niger: "NE",
        "Burkina Faso": "BF",
        Mali: "ML",
        Malawi: "MW",
        Zambia: "ZM",
        Somalia: "SO",
        Senegal: "SN",
        Chad: "TD",
        Zimbabwe: "ZW",
        Guinea: "GN",
        Rwanda: "RW",
        Benin: "BJ",
        Burundi: "BI",
        Tunisia: "TN",
        "South Sudan": "SS",
        "Sierra Leone": "SL",
        Libya: "LY",
        Liberia: "LR",
        "Central African Republic": "CF",
        Mauritania: "MR",
        Eritrea: "ER",
        Gambia: "GM",
        Botswana: "BW",
        Namibia: "NA",
        Gabon: "GA",
        Lesotho: "LS",
        "Guinea-Bissau": "GW",
        "Equatorial Guinea": "GQ",
        Mauritius: "MU",
        Eswatini: "SZ",
        Swaziland: "SZ",
        Djibouti: "DJ",
        Fiji: "FJ",
        Comoros: "KM",
        Guyana: "GY",
        Bhutan: "BT",
        "Solomon Islands": "SB",
        Macao: "MO",
        Macau: "MO",
        Montenegro: "ME",
        Luxembourg: "LU",
        "Western Sahara": "EH",
        Suriname: "SR",
        "Cape Verde": "CV",
        Micronesia: "FM",
        Maldives: "MV",
        Malta: "MT",
        Brunei: "BN",
        "Brunei Darussalam": "BN",
        Belize: "BZ",
        Bahamas: "BS",
        Iceland: "IS",
        Vanuatu: "VU",
        Barbados: "BB",
        "Sao Tome and Principe": "ST",
        Samoa: "WS",
        "Saint Lucia": "LC",
        Kiribati: "KI",
        Grenada: "GD",
        Tonga: "TO",
        Seychelles: "SC",
        "Antigua and Barbuda": "AG",
        Andorra: "AD",
        Dominica: "DM",
        "Marshall Islands": "MH",
        "Saint Kitts and Nevis": "KN",
        Liechtenstein: "LI",
        Monaco: "MC",
        "San Marino": "SM",
        Palau: "PW",
        Tuvalu: "TV",
        Nauru: "NR",
        "Vatican City": "VA",
        Vatican: "VA",
    };

    // 先嘗試直接匹配
    if (countryMap[countryName]) {
        return countryMap[countryName];
    }

    // 嘗試不區分大小寫的匹配
    const lowerName = countryName.toLowerCase();
    for (const [key, value] of Object.entries(countryMap)) {
        if (key.toLowerCase() === lowerName) {
            return value;
        }
    }

    // 如果都找不到，返回原名稱
    console.log("未找到國家代碼:", countryName);
    return countryName;
};

// 監聽 props 變化
watch(
    () => props.mapData,
    () => {
        nextTick(() => {
            updateMapData();
        });
    },
    { deep: true }
);

watch(
    () => props.dataField,
    () => {
        nextTick(() => {
            updateMapData();
        });
    }
);

// 組件掛載
onMounted(() => {
    nextTick(() => {
        initMap();
    });
});

// 組件卸載
onUnmounted(() => {
    if (chart) {
        chart.dispose();
    }
    if (root) {
        root.dispose();
    }
});
</script>

<style scoped>
.geo-map-container {
    width: 100%;
    height: 500px;
    position: relative;
}

.geo-map {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
}

/* 確保地圖容器有適當的尺寸 */
.geo-map :deep(svg) {
    width: 100%;
    height: 100%;
}

/* AmCharts 內建縮放控制樣式 - 使用預設樣式 */
</style>
