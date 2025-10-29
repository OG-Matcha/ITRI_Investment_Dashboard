<template>
    <div class="geo-analysis">
        <!-- 標題 -->
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-2xl font-bold text-gray-800">地理分佈分析</h2>
            <p class="text-sm text-gray-600 mt-1">
                全球能源儲能投資地理分佈與熱點分析
            </p>
        </div>

        <!-- 控制面板 -->
        <div class="px-6 py-4 border-b border-gray-200">
            <GeoControls
                :data-field="dataField"
                :data-fields="dataFields"
                @update:data-field="handleControlChange('dataField', $event)"
            />
        </div>

        <!-- 地圖區域 -->
        <div class="relative">
            <GeoMap
                :map-data="mapData"
                :data-field="dataField"
                @country-click="handleCountryClick"
                @country-hover="handleCountryHover"
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
                    <span class="text-gray-600">載入地圖中...</span>
                </div>
            </div>
        </div>

        <!-- 側邊欄 -->
        <div
            v-if="selectedCountry"
            class="w-80 bg-gray-50 rounded-lg border border-gray-200 p-4 m-4"
        >
            <h3 class="text-lg font-semibold text-gray-800 mb-3">
                {{ selectedCountry.name }}
            </h3>

            <div class="space-y-3">
                <!-- 基本統計 -->
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-white p-2 rounded">
                        <div class="text-gray-500">公司數量</div>
                        <div class="font-semibold">
                            {{ selectedCountry.companyCount }}
                        </div>
                    </div>
                    <div class="bg-white p-2 rounded">
                        <div class="text-gray-500">總募資</div>
                        <div class="font-semibold">
                            {{ formatCurrency(selectedCountry.totalFunding) }}
                        </div>
                    </div>
                    <div class="bg-white p-2 rounded">
                        <div class="text-gray-500">平均募資</div>
                        <div class="font-semibold">
                            {{ formatCurrency(selectedCountry.averageFunding) }}
                        </div>
                    </div>
                    <div class="bg-white p-2 rounded">
                        <div class="text-gray-500">最大募資</div>
                        <div class="font-semibold">
                            {{ formatCurrency(selectedCountry.maxFunding) }}
                        </div>
                    </div>
                </div>

                <!-- 產業分佈 -->
                <div v-if="selectedCountry.industries.length > 0">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">
                        主要產業
                    </h4>
                    <div class="space-y-1">
                        <div
                            v-for="industry in selectedCountry.industries.slice(
                                0,
                                5
                            )"
                            :key="industry.name"
                            class="flex justify-between text-xs"
                        >
                            <span class="text-gray-600">{{
                                industry.name
                            }}</span>
                            <span class="text-gray-800 font-medium">{{
                                industry.count
                            }}</span>
                        </div>
                    </div>
                </div>

                <!-- 募資輪次 -->
                <div v-if="selectedCountry.fundingRounds.length > 0">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">
                        募資輪次
                    </h4>
                    <div class="space-y-1">
                        <div
                            v-for="round in selectedCountry.fundingRounds.slice(
                                0,
                                5
                            )"
                            :key="round.name"
                            class="flex justify-between text-xs"
                        >
                            <span class="text-gray-600">{{ round.name }}</span>
                            <span class="text-gray-800 font-medium">{{
                                round.count
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 篩選狀態 -->
        <div v-if="hasActiveFilters" class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-gray-700"
                        >篩選狀態:</span
                    >
                    <div class="flex flex-wrap gap-2">
                        <span
                            v-if="selectedSubIndustries.length > 0"
                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                            子產業: {{ selectedSubIndustries.length }} 項
                        </span>
                        <span
                            v-if="selectedProductTypes.length > 0"
                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                            產品類型: {{ selectedProductTypes.length }} 項
                        </span>
                    </div>
                </div>
                <button
                    @click="clearAllFilters"
                    class="text-sm text-gray-500 hover:text-gray-700"
                >
                    清除篩選
                </button>
            </div>
        </div>

        <!-- 懸停信息 -->
        <div
            v-if="hoverInfo"
            class="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10"
        >
            <h4 class="font-semibold text-gray-800">{{ hoverInfo.name }}</h4>
            <p class="text-sm text-gray-600">{{ hoverInfo.value }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useDataProcessing } from "~/composables/useDataProcessing";
import { useFiltering } from "~/composables/useFiltering";
import { formatCurrency } from "~/utils/dataParser";
import type { CountryData, DataField, ColorScheme } from "~/types";

// 組件導入
import GeoControls from "./GeoControls.vue";
import GeoMap from "./GeoMap.vue";

// 使用 Composables
const { processedData } = useDataProcessing();
const { filteredData } = useFiltering(processedData, "geo-analysis");

// 響應式數據
const dataField = ref<DataField>("companyCount");
const selectedCountry = ref<CountryData | null>(null);
const hoverInfo = ref<{ name: string; value: string } | null>(null);
const loading = ref(false);

// 篩選選項
const selectedSubIndustries = ref<string[]>([]);
const selectedProductTypes = ref<string[]>([]);

// 數據字段選項
const dataFields: Array<{ value: DataField; label: string }> = [
    { value: "companyCount", label: "公司數量" },
    { value: "totalFunding", label: "總募資金額" },
    { value: "averageFunding", label: "平均募資金額" },
    { value: "maxFunding", label: "最大募資金額" },
];

// 計算屬性
const subIndustryOptions = computed(() => {
    const industries = new Set<string>();
    filteredData.value.forEach((company) => {
        if (company.sub_industry) {
            industries.add(company.sub_industry);
        }
    });
    return Array.from(industries).sort();
});

const productTypeOptions = computed(() => {
    const types = new Set<string>();
    filteredData.value.forEach((company) => {
        if (company.product_service_type) {
            types.add(company.product_service_type);
        }
    });
    return Array.from(types).sort();
});

const hasActiveFilters = computed(() => {
    return (
        selectedSubIndustries.value.length > 0 ||
        selectedProductTypes.value.length > 0
    );
});

// 地圖數據
const mapData = computed(() => {
    console.log("GeoAnalysis - 開始計算 mapData");
    console.log("GeoAnalysis - filteredData 長度:", filteredData.value.length);

    // 定義所有需要顯示的國家列表（基於世界地圖的國家）
    const allCountries = [
        "United States",
        "China",
        "Japan",
        "Germany",
        "United Kingdom",
        "France",
        "India",
        "Italy",
        "Brazil",
        "Canada",
        "South Korea",
        "Russia",
        "Australia",
        "Spain",
        "Mexico",
        "Indonesia",
        "Netherlands",
        "Saudi Arabia",
        "Turkey",
        "Switzerland",
        "Taiwan",
        "Belgium",
        "Argentina",
        "Nigeria",
        "Austria",
        "Israel",
        "Sweden",
        "Poland",
        "Norway",
        "United Arab Emirates",
        "Thailand",
        "South Africa",
        "Denmark",
        "Malaysia",
        "Singapore",
        "Philippines",
        "Chile",
        "Finland",
        "Bangladesh",
        "Vietnam",
        "Romania",
        "Czech Republic",
        "New Zealand",
        "Peru",
        "Iraq",
        "Greece",
        "Portugal",
        "Algeria",
        "Kazakhstan",
        "Hungary",
        "Kuwait",
        "Ukraine",
        "Morocco",
        "Ecuador",
        "Ethiopia",
        "Angola",
        "Venezuela",
        "Ghana",
        "Kenya",
        "Tanzania",
        "Myanmar",
        "Uzbekistan",
        "Nepal",
        "Afghanistan",
        "Yemen",
        "Mozambique",
        "Madagascar",
        "Cameroon",
        "Côte d'Ivoire",
        "Niger",
        "Burkina Faso",
        "Mali",
        "Malawi",
        "Zambia",
        "Somalia",
        "Senegal",
        "Chad",
        "Zimbabwe",
        "Guinea",
        "Rwanda",
        "Benin",
        "Burundi",
        "Tunisia",
        "South Sudan",
        "Sierra Leone",
        "Libya",
        "Liberia",
        "Central African Republic",
        "Mauritania",
        "Eritrea",
        "Gambia",
        "Botswana",
        "Namibia",
        "Gabon",
        "Lesotho",
        "Guinea-Bissau",
        "Equatorial Guinea",
        "Mauritius",
        "Eswatini",
        "Djibouti",
        "Fiji",
        "Comoros",
        "Guyana",
        "Bhutan",
        "Solomon Islands",
        "Macao",
        "Montenegro",
        "Luxembourg",
        "Western Sahara",
        "Suriname",
        "Cape Verde",
        "Micronesia",
        "Maldives",
        "Malta",
        "Brunei",
        "Belize",
        "Bahamas",
        "Iceland",
        "Vanuatu",
        "Barbados",
        "Sao Tome and Principe",
        "Samoa",
        "Saint Lucia",
        "Kiribati",
        "Grenada",
        "Tonga",
        "Seychelles",
        "Antigua and Barbuda",
        "Andorra",
        "Dominica",
        "Marshall Islands",
        "Saint Kitts and Nevis",
        "Liechtenstein",
        "Monaco",
        "San Marino",
        "Palau",
        "Tuvalu",
        "Nauru",
        "Vatican City",
    ];

    const countryMap = new Map<string, CountryData>();

    // 先初始化所有國家為0
    allCountries.forEach((countryName) => {
        countryMap.set(countryName, {
            name: countryName,
            companyCount: 0,
            totalFunding: 0,
            averageFunding: 0,
            maxFunding: 0,
            companies: [],
            industries: [],
            fundingRounds: [],
        });
    });

    // 處理有數據的公司
    filteredData.value.forEach((company) => {
        // 調試：檢查數據結構
        if (Math.random() < 0.05) {
            // 顯示5%的調試信息
            console.log("公司數據結構:", {
                company: company,
                country: company.country,
                country_name: company.country_name,
                countryName: company.countryName,
                location: company.location,
                headquarters: company.headquarters,
                allKeys: Object.keys(company),
            });
        }

        // 嘗試多個可能的國家字段
        const countryName =
            company.country ||
            company.country_name ||
            company.countryName ||
            company.location ||
            company.headquarters;

        // 調試：檢查美國相關的公司
        if (
            countryName &&
            (countryName.toLowerCase().includes("united states") ||
                countryName.toLowerCase().includes("usa") ||
                countryName.toLowerCase().includes("america") ||
                countryName.toLowerCase().includes("us"))
        ) {
            console.log("美國相關公司:", {
                originalName: countryName,
                companyName: company.company_name,
                value: company.total_funding_usd || 0,
            });
        }

        // 如果國家在列表中，更新數據
        if (countryName && countryMap.has(countryName)) {
            const country = countryMap.get(countryName)!;
            country.companies.push(company);
            country.companyCount++;
            country.totalFunding += company.total_funding_usd || 0;
            country.maxFunding = Math.max(
                country.maxFunding,
                company.total_funding_usd || 0
            );
        } else if (countryName) {
            // 如果國家不在預定義列表中，創建新的國家條目
            console.log("未知國家，創建新條目:", countryName);
            countryMap.set(countryName, {
                name: countryName,
                companyCount: 1,
                totalFunding: company.total_funding_usd || 0,
                averageFunding: company.total_funding_usd || 0,
                maxFunding: company.total_funding_usd || 0,
                companies: [company],
                industries: [],
                fundingRounds: [],
            });
        }
    });

    // 計算平均募資和產業分佈
    countryMap.forEach((country) => {
        country.averageFunding =
            country.companyCount > 0
                ? country.totalFunding / country.companyCount
                : 0;

        // 統計產業分佈
        const industryMap = new Map<string, number>();
        country.companies.forEach((company) => {
            if (company.sub_industry) {
                industryMap.set(
                    company.sub_industry,
                    (industryMap.get(company.sub_industry) || 0) + 1
                );
            }
        });
        country.industries = Array.from(industryMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // 統計募資輪次
        const roundMap = new Map<string, number>();
        country.companies.forEach((company) => {
            if (company.funding_round) {
                roundMap.set(
                    company.funding_round,
                    (roundMap.get(company.funding_round) || 0) + 1
                );
            }
        });
        country.fundingRounds = Array.from(roundMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    });

    const result = Array.from(countryMap.values()).sort(
        (a, b) => b.companyCount - a.companyCount
    );
    console.log("GeoAnalysis - mapData 計算完成:", result.length, "個國家");
    return result;
});

// 方法
const handleControlChange = (field: string, value: any) => {
    console.log("控制變更:", { [field]: value });
    if (field === "dataField") {
        dataField.value = value;
    }
};

const handleCountryClick = (country: CountryData) => {
    selectedCountry.value = country;
};

const handleCountryHover = (country: CountryData, event: MouseEvent) => {
    const value = getFieldValue(country, dataField.value);
    hoverInfo.value = {
        name: country.name,
        value: `${getFieldLabel(dataField.value)}: ${formatValue(
            value,
            dataField.value
        )}`,
    };
};

const selectAllSubIndustries = () => {
    selectedSubIndustries.value = [...subIndustryOptions.value];
};

const clearAllSubIndustries = () => {
    selectedSubIndustries.value = [];
};

const selectAllProductTypes = () => {
    selectedProductTypes.value = [...productTypeOptions.value];
};

const clearAllProductTypes = () => {
    selectedProductTypes.value = [];
};

const clearAllFilters = () => {
    selectedSubIndustries.value = [];
    selectedProductTypes.value = [];
};

const reloadData = () => {
    loading.value = true;
    // 觸發重新計算
    setTimeout(() => {
        loading.value = false;
    }, 1000);
};

// 輔助函數
const getFieldValue = (country: CountryData, field: string): number => {
    switch (field) {
        case "companyCount":
            return country.companyCount;
        case "totalFunding":
            return country.totalFunding;
        case "averageFunding":
            return country.averageFunding;
        case "maxFunding":
            return country.maxFunding;
        default:
            return country.companyCount;
    }
};

const getFieldLabel = (field: string): string => {
    const fieldOption = dataFields.find((f) => f.value === field);
    return fieldOption ? fieldOption.label : "公司數量";
};

const formatValue = (value: number, field: string): string => {
    if (field === "companyCount") {
        return value.toString();
    } else {
        return formatCurrency(value);
    }
};

// 監聽數據變化
watch(
    [processedData, filteredData],
    () => {
        console.log(
            "GeoAnalysis - processedData 變化:",
            processedData.value.length
        );
        console.log(
            "GeoAnalysis - filteredData 變化:",
            filteredData.value.length
        );
    },
    { deep: true }
);

onMounted(() => {
    console.log("GeoAnalysis - 組件掛載完成");
    console.log(
        "GeoAnalysis - processedData 長度:",
        processedData.value.length
    );
    console.log("GeoAnalysis - filteredData 長度:", filteredData.value.length);
});
</script>

<style scoped>
.geo-analysis {
    @apply relative;
}
</style>
