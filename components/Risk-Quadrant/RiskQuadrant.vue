<template>
    <div class="risk-quadrant-container bg-white rounded-lg shadow-lg p-6">
        <!-- 標題區域 -->
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">風險象限分析</h2>
            <p class="text-gray-600">2x2 風險回報投資分析</p>
        </div>

        <!-- 風險評估設定 -->
        <div class="mb-6">
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    風險回報評估設定
                </h3>
                <RiskAssessment
                    v-model:risk-weights="riskWeights"
                    v-model:return-weights="returnWeights"
                    @update="handleAssessmentUpdate"
                />
            </div>
        </div>

        <!-- 載入狀態 -->
        <div v-if="loading" class="flex justify-center items-center h-64">
            <div
                class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            ></div>
        </div>

        <!-- 錯誤狀態 -->
        <div v-else-if="error" class="text-center py-8">
            <div class="text-red-500 text-lg font-semibold mb-2">載入失敗</div>
            <p class="text-gray-600">{{ error }}</p>
            <button
                @click="reloadData"
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                重新載入
            </button>
        </div>

        <!-- 風險象限內容 -->
        <div v-else class="risk-quadrant-content">
            <!-- 篩選區域 -->
            <div class="filter-section">
                <div class="filter-controls">
                    <div class="filter-group">
                        <div class="filter-header">
                            <label class="filter-label">子產業篩選</label>
                            <div class="filter-actions">
                                <button
                                    type="button"
                                    class="filter-action-btn"
                                    @click.stop="selectAllSubIndustries"
                                >
                                    全選
                                </button>
                                <button
                                    type="button"
                                    class="filter-action-btn"
                                    @click.stop="clearAllSubIndustries"
                                >
                                    全取消
                                </button>
                            </div>
                        </div>
                        <div class="filter-checkbox-container">
                            <div
                                v-for="industry in subIndustryOptions"
                                :key="industry"
                                class="filter-checkbox-item"
                            >
                                <input
                                    type="checkbox"
                                    :id="`risk-quadrant-sub-industry-${industry}`"
                                    :value="industry"
                                    v-model="selectedSubIndustries"
                                    @change.stop
                                    class="filter-checkbox"
                                />
                                <label
                                    :for="`risk-quadrant-sub-industry-${industry}`"
                                    class="filter-checkbox-label"
                                >
                                    {{ industry }}
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="filter-group">
                        <div class="filter-header">
                            <label class="filter-label">產品/服務類型</label>
                            <div class="filter-actions">
                                <button
                                    type="button"
                                    class="filter-action-btn"
                                    @click.stop="selectAllProductTypes"
                                >
                                    全選
                                </button>
                                <button
                                    type="button"
                                    class="filter-action-btn"
                                    @click.stop="clearAllProductTypes"
                                >
                                    全取消
                                </button>
                            </div>
                        </div>
                        <div class="filter-checkbox-container">
                            <div
                                v-for="type in productTypeOptions"
                                :key="type"
                                class="filter-checkbox-item"
                            >
                                <input
                                    type="checkbox"
                                    :id="`risk-quadrant-product-type-${type}`"
                                    :value="type"
                                    v-model="selectedProductTypes"
                                    @change.stop
                                    class="filter-checkbox"
                                />
                                <label
                                    :for="`risk-quadrant-product-type-${type}`"
                                    class="filter-checkbox-label"
                                >
                                    {{ type }}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 主要內容區域 -->
            <div class="flex flex-col lg:flex-row gap-6 min-h-[600px]">
                <!-- 左側：2x2 風險象限矩陣 -->
                <div class="flex-1">
                    <div class="matrix-layout">
                        <!-- 矩陣標題 -->
                        <div class="text-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">
                                風險象限矩陣
                            </h3>
                            <p class="text-sm text-gray-600">
                                Y軸：風險等級 | X軸：回報等級
                            </p>
                        </div>

                        <!-- 2x2 矩陣 - 真正的四格正方形 -->
                        <div class="matrix-grid-square">
                            <div
                                class="matrix-cell high-risk-high-return"
                                @click="
                                    handleQuadrantClick('highRiskHighReturn')
                                "
                            >
                                <div class="cell-label">高風險高回報</div>
                                <div class="cell-count">
                                    {{ getQuadrantCount("highRiskHighReturn") }}
                                </div>
                                <div class="cell-companies">
                                    {{ getQuadrantCount("highRiskHighReturn") }}
                                    家公司
                                </div>
                            </div>
                            <div
                                class="matrix-cell high-risk-low-return"
                                @click="
                                    handleQuadrantClick('highRiskLowReturn')
                                "
                            >
                                <div class="cell-label">高風險低回報</div>
                                <div class="cell-count">
                                    {{ getQuadrantCount("highRiskLowReturn") }}
                                </div>
                                <div class="cell-companies">
                                    {{ getQuadrantCount("highRiskLowReturn") }}
                                    家公司
                                </div>
                            </div>
                            <div
                                class="matrix-cell low-risk-high-return"
                                @click="
                                    handleQuadrantClick('lowRiskHighReturn')
                                "
                            >
                                <div class="cell-label">低風險高回報</div>
                                <div class="cell-count">
                                    {{ getQuadrantCount("lowRiskHighReturn") }}
                                </div>
                                <div class="cell-companies">
                                    {{ getQuadrantCount("lowRiskHighReturn") }}
                                    家公司
                                </div>
                            </div>
                            <div
                                class="matrix-cell low-risk-low-return"
                                @click="handleQuadrantClick('lowRiskLowReturn')"
                            >
                                <div class="cell-label">低風險低回報</div>
                                <div class="cell-count">
                                    {{ getQuadrantCount("lowRiskLowReturn") }}
                                </div>
                                <div class="cell-companies">
                                    {{ getQuadrantCount("lowRiskLowReturn") }}
                                    家公司
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右側：風險標準說明和統計 -->
                <div class="w-full lg:w-80">
                    <div class="space-y-6">
                        <!-- 當前評估參數 -->
                        <div
                            class="bg-gray-50 border border-gray-200 rounded-lg p-4"
                        >
                            <h4
                                class="text-lg font-semibold text-gray-800 mb-3"
                            >
                                當前評估參數
                            </h4>
                            <div class="space-y-3">
                                <div class="text-sm text-gray-600">
                                    <p class="font-medium mb-2">
                                        風險評分計算：
                                    </p>
                                    <p>
                                        • 投資輪次權重：{{
                                            Math.round(
                                                riskWeights.fundingRounds * 100
                                            )
                                        }}%
                                    </p>
                                    <p>
                                        • 公司年齡權重：{{
                                            Math.round(
                                                riskWeights.companyAge * 100
                                            )
                                        }}%
                                    </p>
                                    <p>
                                        • CB Rank 權重：{{
                                            Math.round(
                                                riskWeights.cbRank * 100
                                            )
                                        }}%
                                    </p>
                                </div>
                                <div class="text-sm text-gray-600">
                                    <p class="font-medium mb-2">
                                        回報評分計算：
                                    </p>
                                    <p>
                                        • 總募資金額權重：{{
                                            Math.round(
                                                returnWeights.totalFunding * 100
                                            )
                                        }}%
                                    </p>
                                    <p>
                                        • 投後估值權重：{{
                                            Math.round(
                                                returnWeights.valuation * 100
                                            )
                                        }}%
                                    </p>
                                </div>
                                <div class="text-xs text-gray-500 mt-2">
                                    <p>評分範圍：0-100 分</p>
                                    <p>分類標準：動態分位數計算</p>
                                </div>
                            </div>
                        </div>

                        <!-- 象限分類說明 -->
                        <div
                            class="bg-gray-50 border border-gray-200 rounded-lg p-4"
                        >
                            <h4
                                class="text-lg font-semibold text-gray-800 mb-3"
                            >
                                象限分類說明
                            </h4>
                            <div class="space-y-3">
                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-4 h-4 bg-red-500 rounded"
                                    ></div>
                                    <span
                                        class="text-sm font-medium text-gray-700"
                                        >高風險高回報</span
                                    >
                                </div>
                                <div class="text-sm text-gray-600 ml-6">
                                    <p>• 風險評分：前 25%</p>
                                    <p>• 回報評分：前 25%</p>
                                </div>

                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-4 h-4 bg-orange-500 rounded"
                                    ></div>
                                    <span
                                        class="text-sm font-medium text-gray-700"
                                        >高風險低回報</span
                                    >
                                </div>
                                <div class="text-sm text-gray-600 ml-6">
                                    <p>• 風險評分：前 25%</p>
                                    <p>• 回報評分：後 25%</p>
                                </div>

                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-4 h-4 bg-green-500 rounded"
                                    ></div>
                                    <span
                                        class="text-sm font-medium text-gray-700"
                                        >低風險高回報</span
                                    >
                                </div>
                                <div class="text-sm text-gray-600 ml-6">
                                    <p>• 風險評分：後 25%</p>
                                    <p>• 回報評分：前 25%</p>
                                </div>

                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-4 h-4 bg-gray-500 rounded"
                                    ></div>
                                    <span
                                        class="text-sm font-medium text-gray-700"
                                        >低風險低回報</span
                                    >
                                </div>
                                <div class="text-sm text-gray-600 ml-6">
                                    <p>• 風險評分：後 25%</p>
                                    <p>• 回報評分：後 25%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 篩選狀態顯示 -->
            <div class="mt-6">
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div class="filter-status">
                        <div class="filter-status-title">目前篩選條件：</div>
                        <div class="filter-tags">
                            <div
                                v-if="selectedSubIndustries.length > 0"
                                class="filter-tag-group"
                            >
                                <span class="filter-tag-label">子產業：</span>
                                <span
                                    v-for="industry in selectedSubIndustries"
                                    :key="industry"
                                    class="filter-tag"
                                >
                                    {{ industry }}
                                </span>
                            </div>
                            <div
                                v-if="selectedProductTypes.length > 0"
                                class="filter-tag-group"
                            >
                                <span class="filter-tag-label"
                                    >產品/服務類型：</span
                                >
                                <span
                                    v-for="type in selectedProductTypes"
                                    :key="type"
                                    class="filter-tag"
                                >
                                    {{ type }}
                                </span>
                            </div>
                            <div
                                v-if="
                                    selectedSubIndustries.length === 0 &&
                                    selectedProductTypes.length === 0
                                "
                                class="filter-tag"
                            >
                                無篩選條件
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 側邊欄遮罩 -->
        <div
            v-if="selectedQuadrant"
            class="fixed inset-0 bg-black bg-opacity-50 z-40"
            @click="selectedQuadrant = null"
        ></div>

        <!-- 右側邊欄 -->
        <div
            v-if="selectedQuadrant"
            class="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
            @click.stop
        >
            <div class="h-full flex flex-col">
                <!-- 邊欄標題 -->
                <div
                    class="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50"
                >
                    <h3 class="text-lg font-bold text-gray-800">
                        {{ selectedQuadrant.title }}
                    </h3>
                    <button
                        @click="selectedQuadrant = null"
                        class="text-gray-500 hover:text-gray-700 text-xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <!-- 排序控制 -->
                <div class="p-4 border-b border-gray-200 bg-gray-50">
                    <div class="flex items-center gap-4">
                        <div class="flex-1">
                            <label
                                class="block text-sm font-medium text-gray-700 mb-2"
                            >
                                排序欄位
                            </label>
                            <select
                                v-model="sortField"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="name">公司名稱</option>
                                <option value="total_funding_usd">
                                    總募資金額
                                </option>
                                <option value="post_money_valuation_usd">
                                    投後估值
                                </option>
                                <option value="num_funding_rounds">
                                    投資輪次
                                </option>
                                <option value="employee_count">員工數量</option>
                                <option value="rank">CB Rank 排名</option>
                                <option value="founded_year">成立年份</option>
                                <option value="funding_year">募資年份</option>
                                <option value="risk_score">風險評分</option>
                                <option value="return_score">回報評分</option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="block text-sm font-medium text-gray-700 mb-2"
                            >
                                排序方式
                            </label>
                            <select
                                v-model="sortOrder"
                                class="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="asc">正序</option>
                                <option value="desc">倒序</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 搜尋控制 -->
                <div class="p-4 border-b border-gray-200 bg-gray-50">
                    <div class="relative">
                        <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            搜尋公司名稱
                        </label>
                        <div class="relative">
                            <input
                                v-model="searchQuery"
                                type="text"
                                placeholder="輸入公司名稱進行搜尋..."
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <div
                                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                            >
                                <svg
                                    class="h-5 w-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <button
                                v-if="searchQuery"
                                @click="searchQuery = ''"
                                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <svg
                                    class="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div
                            v-if="searchQuery"
                            class="mt-2 text-sm text-gray-600"
                        >
                            找到 {{ filteredCompanies.length }} 家公司
                        </div>
                    </div>
                </div>

                <!-- 風險回報篩選 -->
                <div class="p-4 border-b border-gray-200 bg-gray-50">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="block text-sm font-medium text-gray-700 mb-2"
                            >
                                風險評分篩選 (≥)
                            </label>
                            <input
                                v-model.number="riskFilterMin"
                                type="number"
                                min="0"
                                max="100"
                                placeholder="輸入最小風險評分"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-sm font-medium text-gray-700 mb-2"
                            >
                                回報評分篩選 (≥)
                            </label>
                            <input
                                v-model.number="returnFilterMin"
                                type="number"
                                min="0"
                                max="100"
                                placeholder="輸入最小回報評分"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <!-- 公司列表 -->
                <div class="flex-1 overflow-y-auto p-4">
                    <div class="mb-4">
                        <h4 class="text-sm font-semibold text-gray-600 mb-2">
                            共 {{ filteredCompanies.length }} 家公司
                        </h4>
                    </div>

                    <div
                        v-if="filteredCompanies.length === 0"
                        class="text-center py-8 text-gray-500"
                    >
                        <svg
                            class="mx-auto h-12 w-12 text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <p
                            v-if="
                                searchQuery ||
                                riskFilterMin !== null ||
                                returnFilterMin !== null
                            "
                        >
                            沒有找到符合篩選條件的公司
                        </p>
                        <p v-else>此象限暫無公司資料</p>
                    </div>

                    <div v-else class="space-y-3">
                        <div
                            v-for="company in filteredCompanies"
                            :key="company.name"
                            class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                            <!-- 公司基本資訊 -->
                            <div class="mb-3">
                                <h5
                                    class="font-semibold text-gray-800 text-lg mb-2"
                                >
                                    {{ company.name }}
                                </h5>
                                <div class="text-sm text-gray-600 space-y-1">
                                    <div class="flex justify-between">
                                        <span class="font-medium">產業:</span>
                                        <span>{{
                                            company.Industry || "N/A"
                                        }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="font-medium">子產業:</span>
                                        <span>{{
                                            company.SubIndustry || "N/A"
                                        }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="font-medium">國家:</span>
                                        <span>{{
                                            company.country_name || "N/A"
                                        }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 風險回報分析 -->
                            <div class="mb-3">
                                <h6
                                    class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2"
                                >
                                    風險回報分析
                                </h6>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-center">
                                        <div
                                            class="text-2xl font-bold text-red-600"
                                        >
                                            {{ getRiskScore(company) }}%
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            風險評分
                                        </div>
                                    </div>
                                    <div class="text-center">
                                        <div
                                            class="text-2xl font-bold text-green-600"
                                        >
                                            {{ getReturnScore(company) }}%
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            回報評分
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 募資資訊 -->
                            <div class="border-t border-gray-300 pt-3">
                                <h6
                                    class="text-sm font-semibold text-gray-700 mb-2"
                                >
                                    募資資訊
                                </h6>
                                <div class="text-sm text-gray-600 space-y-1">
                                    <div class="flex justify-between">
                                        <span class="font-medium"
                                            >總募資金額:</span
                                        >
                                        <span
                                            class="text-green-600 font-semibold"
                                        >
                                            {{
                                                formatCurrency(
                                                    company.total_funding_usd
                                                )
                                            }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="font-medium"
                                            >投後估值:</span
                                        >
                                        <span>{{
                                            formatCurrency(
                                                company.post_money_valuation_usd ||
                                                    0
                                            )
                                        }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="font-medium"
                                            >投資輪次:</span
                                        >
                                        <span
                                            >{{
                                                company.num_funding_rounds || 0
                                            }}
                                            輪</span
                                        >
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="font-medium"
                                            >募資年份:</span
                                        >
                                        <span>{{
                                            company.funding_year || "N/A"
                                        }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 公司資訊 -->
                            <div class="border-t border-gray-300 pt-3">
                                <h6
                                    class="text-sm font-semibold text-gray-700 mb-2"
                                >
                                    公司資訊
                                </h6>
                                <div class="text-sm text-gray-600 space-y-1">
                                    <div class="flex justify-between">
                                        <span class="font-medium"
                                            >成立年份:</span
                                        >
                                        <span>{{
                                            company.founded_year || "N/A"
                                        }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="font-medium"
                                            >員工數量:</span
                                        >
                                        <span
                                            >{{
                                                company.employee_count || "N/A"
                                            }}
                                            人</span
                                        >
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="font-medium"
                                            >CB Rank:</span
                                        >
                                        <span>{{ company.rank || "N/A" }}</span>
                                    </div>
                                    <!-- 外部連結 -->
                                    <div
                                        class="border-t border-gray-300 pt-3 mt-3"
                                    >
                                        <a
                                            :href="company.cb_url"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            <svg
                                                class="w-4 h-4 mr-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                ></path>
                                            </svg>
                                            查看 Crunchbase 詳情
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type {
    EnergyStorageData,
    RiskQuadrantResult,
    Statistics,
} from "~/types";
import { useDataProcessing } from "~/composables/useDataProcessing";
import { calculateRiskQuadrant } from "~/utils/dataUtils";
import { calculateRiskScore, calculateReturnScore } from "~/utils/dataParser";
import { formatCurrency } from "~/utils/dataParser";

// 元件引入
import RiskAssessment from "./RiskAssessment.vue";
import QuadrantChart from "./QuadrantChart.vue";

// 響應式狀態
const riskWeights = ref({
    fundingRounds: 0.4,
    companyAge: 0.3,
    cbRank: 0.3,
});

const returnWeights = ref({
    totalFunding: 0.5,
    valuation: 0.5,
});

const selectedQuadrant = ref<{
    title: string;
    companies: EnergyStorageData[];
} | null>(null);

// 篩選狀態 - 完全獨立，不與其他組件共享
const selectedSubIndustries = ref<string[]>([]);
const selectedProductTypes = ref<string[]>([]);

// 排序狀態
const sortField = ref("name");
const sortOrder = ref<"asc" | "desc">("asc");

// 搜尋狀態
const searchQuery = ref("");

// 風險回報篩選狀態
const riskFilterMin = ref<number | null>(null);
const returnFilterMin = ref<number | null>(null);

// 使用 Composables
const { processedData, loading, error, statistics, reloadData } =
    useDataProcessing();

// 計算篩選選項
const subIndustryOptions = computed(() => {
    const industries = new Set<string>();
    if (processedData.value.length === 0) return [];

    processedData.value.forEach((item) => {
        if (item.SubIndustry) {
            item.SubIndustry.split(",").forEach((industry) => {
                const trimmed = industry.trim();
                if (trimmed) industries.add(trimmed);
            });
        }
    });
    return Array.from(industries).sort();
});

const productTypeOptions = computed(() => {
    const types = new Set<string>();
    if (processedData.value.length === 0) return [];

    processedData.value.forEach((item) => {
        if (item.ProductServiceType) {
            item.ProductServiceType.split(",").forEach((type) => {
                const trimmed = type.trim();
                if (trimmed) types.add(trimmed);
            });
        }
    });
    return Array.from(types).sort();
});

// 獨立的篩選邏輯
const filteredData = computed(() => {
    let data = processedData.value;

    if (selectedSubIndustries.value.length > 0) {
        data = data.filter((company) =>
            selectedSubIndustries.value.some((industry) =>
                company.SubIndustry?.includes(industry)
            )
        );
    }

    if (selectedProductTypes.value.length > 0) {
        data = data.filter((company) =>
            selectedProductTypes.value.some((type) =>
                company.ProductServiceType?.includes(type)
            )
        );
    }

    return data;
});

// 計算屬性
const quadrantData = computed((): RiskQuadrantResult => {
    if (filteredData.value.length === 0) {
        return {
            highRiskHighReturn: [],
            highRiskLowReturn: [],
            lowRiskHighReturn: [],
            lowRiskLowReturn: [],
        };
    }

    // 使用當前的風險和回報權重重新計算
    return calculateRiskQuadrant(
        [...filteredData.value],
        riskWeights.value,
        returnWeights.value
    );
});

// 排序後的公司列表
const sortedCompanies = computed(() => {
    if (!selectedQuadrant.value?.companies) return [];

    const companies = [...selectedQuadrant.value.companies];

    return companies.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        // 處理評分排序
        if (sortField.value === "risk_score") {
            aValue = calculateRiskScore(a, riskWeights.value);
            bValue = calculateRiskScore(b, riskWeights.value);
        } else if (sortField.value === "return_score") {
            aValue = calculateReturnScore(a, returnWeights.value);
            bValue = calculateReturnScore(b, returnWeights.value);
        } else {
            // 處理其他欄位
            aValue = a[sortField.value as keyof EnergyStorageData];
            bValue = b[sortField.value as keyof EnergyStorageData];
        }

        // 處理數值欄位
        if (sortField.value !== "name") {
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
        }

        // 處理字串欄位
        if (sortField.value === "name") {
            aValue = String(aValue || "").toLowerCase();
            bValue = String(bValue || "").toLowerCase();
        }

        if (sortOrder.value === "asc") {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
    });
});

// 搜尋過濾後的公司列表
const filteredCompanies = computed(() => {
    let companies = sortedCompanies.value;

    // 搜尋過濾
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        companies = companies.filter((company) => {
            const companyName = String(company.name || "").toLowerCase();
            return companyName.includes(query);
        });
    }

    // 風險篩選
    if (riskFilterMin.value !== null) {
        companies = companies.filter((company) => {
            const riskScore = calculateRiskScore(company, riskWeights.value);
            return riskScore >= riskFilterMin.value!;
        });
    }

    // 回報篩選
    if (returnFilterMin.value !== null) {
        companies = companies.filter((company) => {
            const returnScore = calculateReturnScore(
                company,
                returnWeights.value
            );
            return returnScore >= returnFilterMin.value!;
        });
    }

    return companies;
});

// 方法
const handleAssessmentUpdate = (newRiskWeights: any, newReturnWeights: any) => {
    riskWeights.value = newRiskWeights;
    returnWeights.value = newReturnWeights;
};

// 全選/全取消方法
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

// 監聽權重變更，確保矩陣即時更新
watch(
    [riskWeights, returnWeights, filteredData],
    () => {
        // 當權重或篩選資料變更時，quadrantData 會自動重新計算
    },
    { deep: true }
);

const handleQuadrantClick = (quadrantType: keyof RiskQuadrantResult) => {
    const companies = quadrantData.value[quadrantType];
    const quadrantLabels = {
        highRiskHighReturn: "高風險高回報",
        highRiskLowReturn: "高風險低回報",
        lowRiskHighReturn: "低風險高回報",
        lowRiskLowReturn: "低風險低回報",
    };

    selectedQuadrant.value = {
        title: `${quadrantLabels[quadrantType]} 象限 (${companies.length} 家公司)`,
        companies,
    };
};

const getQuadrantCount = (quadrantType: keyof RiskQuadrantResult): number => {
    return quadrantData.value[quadrantType].length;
};

const getHighRiskCount = (): number => {
    return (
        getQuadrantCount("highRiskHighReturn") +
        getQuadrantCount("highRiskLowReturn")
    );
};

const getLowRiskCount = (): number => {
    return (
        getQuadrantCount("lowRiskHighReturn") +
        getQuadrantCount("lowRiskLowReturn")
    );
};

const getHighReturnCount = (): number => {
    return (
        getQuadrantCount("highRiskHighReturn") +
        getQuadrantCount("lowRiskHighReturn")
    );
};

const getLowReturnCount = (): number => {
    return (
        getQuadrantCount("highRiskLowReturn") +
        getQuadrantCount("lowRiskLowReturn")
    );
};

const getHighRiskPercentage = (): number => {
    const total = getHighRiskCount() + getLowRiskCount();
    return total > 0 ? Math.round((getHighRiskCount() / total) * 100) : 0;
};

const getHighReturnPercentage = (): number => {
    const total = getHighReturnCount() + getLowReturnCount();
    return total > 0 ? Math.round((getHighReturnCount() / total) * 100) : 0;
};

const getRiskScore = (company: EnergyStorageData): number => {
    return Math.round(calculateRiskScore(company, riskWeights.value));
};

const getReturnScore = (company: EnergyStorageData): number => {
    return Math.round(calculateReturnScore(company, returnWeights.value));
};

// 生命週期
onMounted(() => {
    // 元件掛載時載入資料
});
</script>

<style scoped>
.risk-quadrant-container {
    min-height: 600px;
}

.risk-quadrant-content {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 矩陣佈局樣式 */
.matrix-layout {
    @apply flex flex-col gap-4 h-full;
}

.matrix-grid-square {
    @apply grid grid-cols-2 gap-6 max-w-2xl mx-auto h-full;
    aspect-ratio: 1;
}

.matrix-row {
    @apply flex gap-4;
}

.matrix-cell {
    @apply flex-1 p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.cell-label {
    @apply text-lg font-semibold mb-2;
}

.cell-count {
    @apply text-3xl font-bold mb-1;
}

.cell-companies {
    @apply text-sm text-gray-600;
}

/* 象限顏色樣式 */
.high-risk-high-return {
    @apply bg-red-50 border-red-300 text-red-800;
}

.high-risk-high-return:hover {
    @apply bg-red-100 border-red-400;
}

.high-risk-low-return {
    @apply bg-orange-50 border-orange-300 text-orange-800;
}

.high-risk-low-return:hover {
    @apply bg-orange-100 border-orange-400;
}

.low-risk-high-return {
    @apply bg-green-50 border-green-300 text-green-800;
}

.low-risk-high-return:hover {
    @apply bg-green-100 border-green-400;
}

.low-risk-low-return {
    @apply bg-gray-50 border-gray-300 text-gray-800;
}

.low-risk-low-return:hover {
    @apply bg-gray-100 border-gray-400;
}

/* 篩選狀態樣式 */
.filter-status {
    @apply space-y-3;
}

.filter-status-title {
    @apply text-sm font-semibold text-gray-700;
}

.filter-tags {
    @apply flex flex-wrap gap-2;
}

.filter-tag-group {
    @apply flex flex-wrap gap-2 items-center;
}

.filter-tag-label {
    @apply text-sm font-medium text-gray-600;
}

.filter-tag {
    @apply px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md;
}

/* 篩選區域樣式 - 與 GE 矩陣完全一致 */
.filter-section {
    @apply bg-white border border-gray-200 rounded-lg p-4 mb-6;
}

.filter-controls {
    @apply flex flex-col md:flex-row gap-4;
}

.filter-group {
    @apply flex-1;
}

.filter-header {
    @apply flex justify-between items-center mb-2;
}

.filter-label {
    @apply text-sm font-medium text-gray-700;
}

.filter-actions {
    @apply flex gap-2;
}

.filter-action-btn {
    @apply px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors;
}

.filter-checkbox-container {
    @apply w-full max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50;
}

.filter-checkbox-item {
    @apply flex items-center gap-3 py-2;
}

.filter-checkbox {
    @apply w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
}

.filter-checkbox-label {
    @apply text-base text-gray-700 cursor-pointer hover:text-gray-900 flex-1;
}
</style>
