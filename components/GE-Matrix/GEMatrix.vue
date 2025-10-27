<template>
    <div class="ge-matrix-container">
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

        <!-- GE 矩陣圖表 -->
        <div v-else class="ge-matrix-content">
            <div class="matrix-layout">
                <!-- 標題區域 -->
                <div class="header-section">
                    <div class="title-area">
                        <h2 class="main-title">GE 矩陣分析</h2>
                        <p class="subtitle">3×3 九宮格多維度投資分析</p>
                    </div>
                </div>

                <!-- 軸線設定區域 -->
                <div class="axis-section">
                    <div class="axis-settings">
                        <h3 class="settings-title">軸線設定</h3>
                        <div class="axis-controls">
                            <div class="axis-control">
                                <label class="axis-label">X軸 (橫軸)</label>
                                <select
                                    class="axis-select"
                                    v-model="xAxis"
                                    @change="handleAxisChange"
                                >
                                    <option value="total_funding_usd">
                                        總募資金額 (USD)
                                    </option>
                                    <option value="post_money_valuation_usd">
                                        投後估值 (USD)
                                    </option>
                                    <option value="num_funding_rounds">
                                        投資輪次
                                    </option>
                                    <option value="employee_count">
                                        員工數量
                                    </option>
                                </select>
                            </div>
                            <div class="axis-control">
                                <label class="axis-label">Y軸 (縱軸)</label>
                                <select
                                    class="axis-select"
                                    v-model="yAxis"
                                    @change="handleAxisChange"
                                >
                                    <option value="rank">CB Rank 排名</option>
                                    <option value="founded_year">
                                        成立年份
                                    </option>
                                    <option value="funding_year">
                                        募資年份
                                    </option>
                                    <option value="num_funding_rounds">
                                        投資輪次
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

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
                                        @click="selectAllSubIndustries"
                                    >
                                        全選
                                    </button>
                                    <button
                                        type="button"
                                        class="filter-action-btn"
                                        @click="clearAllSubIndustries"
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
                                        :id="`sub-industry-${industry}`"
                                        :value="industry"
                                        v-model="selectedSubIndustries"
                                        @change="handleFilterChange"
                                        class="filter-checkbox"
                                    />
                                    <label
                                        :for="`sub-industry-${industry}`"
                                        class="filter-checkbox-label"
                                    >
                                        {{ industry }}
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="filter-group">
                            <div class="filter-header">
                                <label class="filter-label"
                                    >產品/服務類型</label
                                >
                                <div class="filter-actions">
                                    <button
                                        type="button"
                                        class="filter-action-btn"
                                        @click="selectAllProductTypes"
                                    >
                                        全選
                                    </button>
                                    <button
                                        type="button"
                                        class="filter-action-btn"
                                        @click="clearAllProductTypes"
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
                                        :id="`product-type-${type}`"
                                        :value="type"
                                        v-model="selectedProductTypes"
                                        @change="handleFilterChange"
                                        class="filter-checkbox"
                                    />
                                    <label
                                        :for="`product-type-${type}`"
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
                <div class="main-content">
                    <!-- 左側：矩陣 -->
                    <div class="left-section">
                        <!-- 矩陣區域 -->
                        <div class="matrix-section">
                            <!-- 3x3 矩陣 -->
                            <div class="matrix-grid">
                                <!-- 第一行：高-高, 高-中, 高-低 (Y軸高) -->
                                <div class="matrix-row">
                                    <div
                                        class="matrix-cell high-high"
                                        @click="handleCellClick('high-high')"
                                    >
                                        <div class="cell-label">高-高</div>
                                        <div class="cell-count">
                                            {{ matrixData.highHigh.length }}
                                        </div>
                                        <div class="cell-companies">
                                            {{ matrixData.highHigh.length }}
                                            家公司
                                        </div>
                                    </div>
                                    <div
                                        class="matrix-cell high-medium"
                                        @click="handleCellClick('high-medium')"
                                    >
                                        <div class="cell-label">高-中</div>
                                        <div class="cell-count">
                                            {{ matrixData.highMedium.length }}
                                        </div>
                                        <div class="cell-companies">
                                            {{ matrixData.highMedium.length }}
                                            家公司
                                        </div>
                                    </div>
                                    <div
                                        class="matrix-cell high-low"
                                        @click="handleCellClick('high-low')"
                                    >
                                        <div class="cell-label">高-低</div>
                                        <div class="cell-count">
                                            {{ matrixData.highLow.length }}
                                        </div>
                                        <div class="cell-companies">
                                            {{ matrixData.highLow.length }}
                                            家公司
                                        </div>
                                    </div>
                                </div>

                                <!-- 第二行：中-高, 中-中, 中-低 (Y軸中) -->
                                <div class="matrix-row">
                                    <div
                                        class="matrix-cell medium-high"
                                        @click="handleCellClick('medium-high')"
                                    >
                                        <div class="cell-label">中-高</div>
                                        <div class="cell-count">
                                            {{ matrixData.mediumHigh.length }}
                                        </div>
                                        <div class="cell-companies">
                                            {{ matrixData.mediumHigh.length }}
                                            家公司
                                        </div>
                                    </div>
                                    <div
                                        class="matrix-cell medium-medium"
                                        @click="
                                            handleCellClick('medium-medium')
                                        "
                                    >
                                        <div class="cell-label">中-中</div>
                                        <div class="cell-count">
                                            {{ matrixData.mediumMedium.length }}
                                        </div>
                                        <div class="cell-companies">
                                            {{ matrixData.mediumMedium.length }}
                                            家公司
                                        </div>
                                    </div>
                                    <div
                                        class="matrix-cell medium-low"
                                        @click="handleCellClick('medium-low')"
                                    >
                                        <div class="cell-label">中-低</div>
                                        <div class="cell-count">
                                            {{ matrixData.mediumLow.length }}
                                        </div>
                                        <div class="cell-companies">
                                            {{ matrixData.mediumLow.length }}
                                            家公司
                                        </div>
                                    </div>
                                </div>

                                <!-- 第三行：低-高, 低-中, 低-低 (Y軸低) -->
                                <div class="matrix-row">
                                    <div
                                        class="matrix-cell low-high"
                                        @click="handleCellClick('low-high')"
                                    >
                                        <div class="cell-label">低-高</div>
                                        <div class="cell-count">
                                            {{ matrixData.lowHigh.length }}
                                        </div>
                                        <div class="cell-companies">
                                            {{ matrixData.lowHigh.length }}
                                            家公司
                                        </div>
                                    </div>
                                    <div
                                        class="matrix-cell low-medium"
                                        @click="handleCellClick('low-medium')"
                                    >
                                        <div class="cell-label">低-中</div>
                                        <div class="cell-count">
                                            {{ matrixData.lowMedium.length }}
                                        </div>
                                        <div class="cell-companies">
                                            {{ matrixData.lowMedium.length }}
                                            家公司
                                        </div>
                                    </div>
                                    <div
                                        class="matrix-cell low-low"
                                        @click="handleCellClick('low-low')"
                                    >
                                        <div class="cell-label">低-低</div>
                                        <div class="cell-count">
                                            {{ matrixData.lowLow.length }}
                                        </div>
                                        <div class="cell-companies">
                                            {{ matrixData.lowLow.length }}
                                            家公司
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 篩選狀態顯示 -->
                            <div class="filter-status">
                                <div class="filter-status-title">
                                    目前篩選條件：
                                </div>
                                <div class="filter-tags">
                                    <div
                                        v-if="selectedSubIndustries.length > 0"
                                        class="filter-tag-group"
                                    >
                                        <span class="filter-tag-label"
                                            >子產業：</span
                                        >
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
                                            selectedSubIndustries.length ===
                                                0 &&
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

                    <!-- 右側：說明 -->
                    <div class="right-section">
                        <!-- 矩陣說明 -->
                        <div class="matrix-explanation">
                            <h3 class="explanation-title">矩陣說明</h3>
                            <div class="explanation-content">
                                <!-- 軸線與分類標準結合 -->
                                <div class="axis-classification-combined">
                                    <div class="classification-section">
                                        <h4 class="section-title">
                                            固定分類標準
                                        </h4>
                                        <div class="classification-display">
                                            <div class="axis-standards">
                                                <div class="axis-standard">
                                                    <h5 class="axis-title">
                                                        X軸 ({{ xAxisLabel }})
                                                    </h5>
                                                    <div
                                                        class="standard-levels"
                                                    >
                                                        <div
                                                            class="standard-item high"
                                                        >
                                                            <span
                                                                class="standard-label high-indicator"
                                                                >高</span
                                                            >
                                                            <span
                                                                class="standard-value"
                                                                >{{
                                                                    getAxisStandards(
                                                                        xAxis
                                                                    ).high
                                                                }}</span
                                                            >
                                                        </div>
                                                        <div
                                                            class="standard-item medium"
                                                        >
                                                            <span
                                                                class="standard-label medium-indicator"
                                                                >中</span
                                                            >
                                                            <span
                                                                class="standard-value"
                                                                >{{
                                                                    getAxisStandards(
                                                                        xAxis
                                                                    ).medium
                                                                }}</span
                                                            >
                                                        </div>
                                                        <div
                                                            class="standard-item low"
                                                        >
                                                            <span
                                                                class="standard-label low-indicator"
                                                                >低</span
                                                            >
                                                            <span
                                                                class="standard-value"
                                                                >{{
                                                                    getAxisStandards(
                                                                        xAxis
                                                                    ).low
                                                                }}</span
                                                            >
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="axis-standard">
                                                    <h5 class="axis-title">
                                                        Y軸 ({{ yAxisLabel }})
                                                    </h5>
                                                    <div
                                                        class="standard-levels"
                                                    >
                                                        <div
                                                            class="standard-item high"
                                                        >
                                                            <span
                                                                class="standard-label high-indicator"
                                                                >高</span
                                                            >
                                                            <span
                                                                class="standard-value"
                                                                >{{
                                                                    getAxisStandards(
                                                                        yAxis
                                                                    ).high
                                                                }}</span
                                                            >
                                                        </div>
                                                        <div
                                                            class="standard-item medium"
                                                        >
                                                            <span
                                                                class="standard-label medium-indicator"
                                                                >中</span
                                                            >
                                                            <span
                                                                class="standard-value"
                                                                >{{
                                                                    getAxisStandards(
                                                                        yAxis
                                                                    ).medium
                                                                }}</span
                                                            >
                                                        </div>
                                                        <div
                                                            class="standard-item low"
                                                        >
                                                            <span
                                                                class="standard-label low-indicator"
                                                                >低</span
                                                            >
                                                            <span
                                                                class="standard-value"
                                                                >{{
                                                                    getAxisStandards(
                                                                        yAxis
                                                                    ).low
                                                                }}</span
                                                            >
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="matrix-interpretation">
                                        <h4 class="section-title">矩陣解讀</h4>
                                        <div class="interpretation-items">
                                            <div class="interpretation-item">
                                                <div
                                                    class="legend-color high-high"
                                                ></div>
                                                <div
                                                    class="interpretation-text"
                                                >
                                                    <strong>高-高</strong
                                                    >：最具投資價值
                                                </div>
                                            </div>
                                            <div class="interpretation-item">
                                                <div
                                                    class="legend-color medium-medium"
                                                ></div>
                                                <div
                                                    class="interpretation-text"
                                                >
                                                    <strong>中-中</strong
                                                    >：穩定投資選擇
                                                </div>
                                            </div>
                                            <div class="interpretation-item">
                                                <div
                                                    class="legend-color low-low"
                                                ></div>
                                                <div
                                                    class="interpretation-text"
                                                >
                                                    <strong>低-低</strong
                                                    >：投資風險較高
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 背景遮罩 -->
        <div
            v-if="selectedCell"
            class="fixed inset-0 bg-black bg-opacity-50 z-40"
            @click="selectedCell = null"
        ></div>

        <!-- 右側邊欄 -->
        <div
            v-if="selectedCell"
            class="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
            @click.stop
        >
            <div class="h-full flex flex-col">
                <!-- 邊欄標題 -->
                <div
                    class="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50"
                >
                    <h3 class="text-lg font-bold text-gray-800">
                        {{ selectedCell.title }}
                    </h3>
                    <button
                        @click="selectedCell = null"
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
                        <p v-if="searchQuery">沒有找到符合搜尋條件的公司</p>
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
                                        <span class="font-medium"
                                            >產品類型:</span
                                        >
                                        <span>{{
                                            company.ProductServiceType || "N/A"
                                        }}</span>
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
                            <div class="border-t border-gray-300 pt-3 mt-3">
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
                                    <div class="flex justify-between">
                                        <span class="font-medium">國家:</span>
                                        <span>{{
                                            company.country_name || "N/A"
                                        }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 外部連結 -->
                            <div class="border-t border-gray-300 pt-3 mt-3">
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useDataProcessing } from "~/composables/useDataProcessing";
import { useFiltering } from "~/composables/useFiltering";
import { calculateGEMatrix } from "~/utils/dataUtils";
import { formatCurrency } from "~/utils/dataParser";
import type { EnergyStorageData, GEMatrixResult } from "~/types";

// 響應式狀態
const xAxis = ref("total_funding_usd");
const yAxis = ref("founded_year");
const selectedCell = ref<{
    title: string;
    companies: EnergyStorageData[];
} | null>(null);

// 篩選狀態
const selectedSubIndustries = ref<string[]>([]);
const selectedProductTypes = ref<string[]>([]);

// 排序狀態
const sortField = ref("name");
const sortOrder = ref<"asc" | "desc">("asc");

// 搜尋狀態
const searchQuery = ref("");

// 使用 Composables
const {
    processedData,
    loading,
    error,
    statistics,
    numericAxisOptions,
    reloadData,
} = useDataProcessing();

const { filteredData } = useFiltering(processedData as any, "ge-matrix");

// 計算篩選選項
const subIndustryOptions = computed(() => {
    const industries = new Set<string>();

    if (processedData.value.length === 0) {
        return [];
    }

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

// 計算篩選後的資料
const filteredMatrixData = computed(() => {
    // 如果還在載入中或沒有資料，返回空陣列
    if (
        loading.value ||
        !processedData.value ||
        processedData.value.length === 0
    ) {
        return [];
    }

    // 確保 processedData.value 是陣列
    let data = Array.isArray(processedData.value) ? processedData.value : [];

    // 如果沒有選擇任何篩選條件，返回所有資料
    if (
        selectedSubIndustries.value.length === 0 &&
        selectedProductTypes.value.length === 0
    ) {
        return data;
    }

    // 應用子產業篩選
    if (selectedSubIndustries.value.length > 0) {
        const beforeCount = data.length;
        data = data.filter((item) => {
            if (!item.SubIndustry) return false;
            const industries = item.SubIndustry.split(",").map((i: string) =>
                i.trim()
            );
            const hasMatch = selectedSubIndustries.value.some((selected) =>
                industries.includes(selected)
            );
            return hasMatch;
        });
    }

    // 應用產品/服務類型篩選
    if (selectedProductTypes.value.length > 0) {
        data = data.filter((item) => {
            if (!item.ProductServiceType) return false;
            const types = item.ProductServiceType.split(",").map((t: string) =>
                t.trim()
            );
            const hasMatch = selectedProductTypes.value.some((selected) =>
                types.includes(selected)
            );
            return hasMatch;
        });
    }

    return data;
});

// 計算屬性
const matrixData = computed(() => {
    if (filteredMatrixData.value.length === 0) {
        return {
            highHigh: [],
            highMedium: [],
            highLow: [],
            mediumHigh: [],
            mediumMedium: [],
            mediumLow: [],
            lowHigh: [],
            lowMedium: [],
            lowLow: [],
            xThresholds: { lowUpper: 0, mediumUpper: 0, highUpper: 0 },
            yThresholds: { lowUpper: 0, mediumUpper: 0, highUpper: 0 },
        };
    }

    const result = calculateGEMatrix(
        filteredMatrixData.value as any,
        xAxis.value as keyof EnergyStorageData,
        yAxis.value as keyof EnergyStorageData
    );

    return result;
});

const xAxisLabel = computed(() => {
    const option = numericAxisOptions.value.find(
        (opt) => opt.value === xAxis.value
    );
    return option?.label || xAxis.value;
});

const yAxisLabel = computed(() => {
    const option = numericAxisOptions.value.find(
        (opt) => opt.value === yAxis.value
    );
    return option?.label || yAxis.value;
});

// 排序後的公司列表
const sortedCompanies = computed(() => {
    if (!selectedCell.value?.companies) return [];

    const companies = [...selectedCell.value.companies];

    return companies.sort((a, b) => {
        let aValue: any = a[sortField.value as keyof EnergyStorageData];
        let bValue: any = b[sortField.value as keyof EnergyStorageData];

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
    if (!searchQuery.value.trim()) {
        return sortedCompanies.value;
    }

    const query = searchQuery.value.toLowerCase().trim();
    return sortedCompanies.value.filter((company) => {
        const companyName = String(company.name || "").toLowerCase();
        return companyName.includes(query);
    });
});

// 方法
const handleAxisChange = () => {
    // 軸線變更時會自動觸發 matrixData 重新計算
};

const handleFilterChange = () => {
    // 觸發篩選資料重新計算
    // 這裡會自動觸發 matrixData 重新計算
};

// 全選/全取消方法
const selectAllSubIndustries = () => {
    selectedSubIndustries.value = [...subIndustryOptions.value];
    handleFilterChange();
};

const clearAllSubIndustries = () => {
    selectedSubIndustries.value = [];
    handleFilterChange();
};

const selectAllProductTypes = () => {
    selectedProductTypes.value = [...productTypeOptions.value];
    handleFilterChange();
};

const clearAllProductTypes = () => {
    selectedProductTypes.value = [];
    handleFilterChange();
};

// 格式化閾值顯示
const formatThreshold = (value: number): string => {
    if (value === 0) return "0";
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
};

// 根據軸線選擇返回客觀標準（基於實際資料分佈）
const getAxisStandards = (axis: string) => {
    const standards: Record<
        string,
        { high: string; medium: string; low: string }
    > = {
        total_funding_usd: {
            high: "> $100M (高募資)",
            medium: "$10M - $100M (中募資)",
            low: "< $10M (低募資)",
        },
        post_money_valuation_usd: {
            high: "> $1B (高估值)",
            medium: "$100M - $1B (中估值)",
            low: "< $100M (低估值)",
        },
        num_funding_rounds: {
            high: "> 10 輪 (多輪募資)",
            medium: "5-10 輪 (中輪募資)",
            low: "< 5 輪 (少輪募資)",
        },
        employee_count: {
            high: "> 1000 人 (大公司)",
            medium: "100-1000 人 (中公司)",
            low: "< 100 人 (小公司)",
        },
        rank: {
            high: "< 50K (高排名)",
            medium: "50K - 500K (中排名)",
            low: "> 500K (低排名)",
        },
        founded_year: {
            high: "> 2025 (前25%)",
            medium: "2020-2025 (25%-75%)",
            low: "< 2020 (後25%)",
        },
        funding_year: {
            high: "> 2025 (前25%)",
            medium: "2020-2025 (25%-75%)",
            low: "< 2020 (後25%)",
        },
    };

    return (
        standards[axis] || {
            high: "高標準",
            medium: "中標準",
            low: "低標準",
        }
    );
};

// 監聽軸線變化
watch(
    [xAxis, yAxis],
    () => {
        handleAxisChange();
    },
    { deep: true }
);

// 將 kebab-case 轉換為 camelCase
const convertToCamelCase = (str: string): string => {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
};

const handleCellClick = (cellType: string) => {
    // 將 cellType 從 kebab-case 轉換為 camelCase
    const camelCaseCellType = convertToCamelCase(cellType);

    // 確保從正確的資料源獲取公司資料
    const matrixResult = matrixData.value as any;
    const companies = matrixResult[camelCaseCellType] || [];

    const cellLabels: Record<string, string> = {
        highHigh: "高-高",
        highMedium: "高-中",
        highLow: "高-低",
        mediumHigh: "中-高",
        mediumMedium: "中-中",
        mediumLow: "中-低",
        lowHigh: "低-高",
        lowMedium: "低-中",
        lowLow: "低-低",
    };

    selectedCell.value = {
        title: `GE 矩陣 - ${cellLabels[camelCaseCellType]} 象限`,
        companies: companies,
    };
};

// 監聽資料變化，重新計算矩陣
watch(
    [
        filteredMatrixData,
        xAxis,
        yAxis,
        selectedSubIndustries,
        selectedProductTypes,
    ],
    () => {
        // matrixData 會自動重新計算
    },
    { deep: true, immediate: true }
);
</script>

<style scoped>
.ge-matrix-container {
    min-height: 600px;
}

.ge-matrix-content {
    animation: fadeIn 0.3s ease-in-out;
}

.matrix-layout {
    @apply flex flex-col gap-6;
}

/* 標題區域 */
.header-section {
    @apply flex justify-start items-center;
}

.title-area {
    @apply flex-1;
}

.main-title {
    @apply text-2xl font-bold text-gray-800 mb-2;
}

.subtitle {
    @apply text-gray-600;
}

/* 軸線設定區域 */
.axis-section {
    @apply bg-white border border-gray-200 rounded-lg p-4;
}

.axis-settings {
    @apply w-full;
}

.settings-title {
    @apply text-lg font-bold text-gray-800 mb-4;
}

.axis-controls {
    @apply flex flex-col md:flex-row gap-4 mb-4;
}

.axis-control {
    @apply flex flex-col;
}

.axis-label {
    @apply text-sm font-medium text-gray-700 mb-2;
}

.axis-select {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.axis-description {
    @apply flex items-start gap-2 text-sm text-gray-600;
}

.info-icon {
    @apply text-blue-500;
}

/* 篩選區域 */
.filter-section {
    @apply bg-white border border-gray-200 rounded-lg p-4;
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

/* 主要內容區域 */
.main-content {
    @apply flex gap-8 min-h-[600px];
}

/* 左側區域 */
.left-section {
    @apply flex-1;
}

.matrix-section {
    @apply flex flex-col h-full;
}

.x-axis-title {
    @apply text-center text-lg font-semibold text-gray-700 mb-4;
}

.matrix-grid {
    @apply flex flex-col gap-3 h-[80%];
}

.matrix-row {
    @apply flex gap-3 h-[33%];
}

.matrix-cell {
    @apply flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg;
    @apply flex flex-col items-center justify-center text-center;
    min-height: 100px;
}

.matrix-cell:hover {
    @apply transform scale-105;
}

.cell-label {
    @apply text-sm font-bold mb-2;
}

.cell-count {
    @apply text-2xl font-bold mb-1;
}

.cell-companies {
    @apply text-xs text-gray-600;
}

/* 篩選狀態顯示 */
.filter-status {
    @apply mt-6 p-4 bg-gray-50 rounded-lg;
}

.filter-status-title {
    @apply text-sm font-semibold text-gray-700 mb-2;
}

.filter-tags {
    @apply flex flex-wrap gap-2;
}

.filter-tag-group {
    @apply flex flex-wrap gap-1 items-center;
}

.filter-tag-label {
    @apply text-sm font-medium text-gray-600;
}

.filter-tag {
    @apply px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs;
}

/* 有意義的顏色系統 */
.high-high {
    @apply bg-green-100 border-green-500 text-green-800;
}

.high-medium {
    @apply bg-green-50 border-green-400 text-green-700;
}

.high-low {
    @apply bg-yellow-100 border-yellow-500 text-yellow-800;
}

.medium-high {
    @apply bg-green-50 border-green-400 text-green-700;
}

.medium-medium {
    @apply bg-gray-100 border-gray-400 text-gray-700;
}

.medium-low {
    @apply bg-orange-100 border-orange-400 text-orange-700;
}

.low-high {
    @apply bg-yellow-100 border-yellow-500 text-yellow-800;
}

.low-medium {
    @apply bg-orange-100 border-orange-400 text-orange-700;
}

.low-low {
    @apply bg-red-100 border-red-500 text-red-800;
}

/* 右側區域 */
.right-section {
    @apply w-1/3 flex flex-col gap-6;
}

.quick-settings {
    @apply bg-white border border-gray-200 rounded-lg p-4;
}

.settings-tabs {
    @apply flex flex-wrap gap-2;
}

.tab-button {
    @apply px-3 py-2 text-sm font-medium rounded-md transition-colors;
    @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.tab-button.active {
    @apply bg-blue-500 text-white hover:bg-blue-600;
}

.matrix-explanation {
    @apply bg-white border border-gray-200 rounded-lg p-4;
}

.explanation-title {
    @apply text-lg font-bold text-gray-800 mb-4;
}

.explanation-content {
    @apply space-y-4;
}

.axis-info h4,
.classification-info h4,
.color-legend h4 {
    @apply text-sm font-semibold text-gray-700 mb-2;
}

.axis-info p,
.classification-info p {
    @apply text-sm text-gray-600 mb-1;
}

.classification-info ul {
    @apply text-sm text-gray-600 ml-4;
}

.high-indicator {
    @apply text-green-600 font-semibold;
}

.medium-indicator {
    @apply text-gray-600 font-semibold;
}

.low-indicator {
    @apply text-red-600 font-semibold;
}

.legend-items {
    @apply space-y-2;
}

.legend-item {
    @apply flex items-center gap-2;
}

.legend-color {
    @apply w-4 h-4 rounded border;
}

.legend-color.high-high {
    @apply bg-green-100 border-green-500;
}

.legend-color.low-low {
    @apply bg-red-100 border-red-500;
}

.threshold-info {
    @apply text-xs text-gray-500 font-mono;
}

/* 新的說明區塊樣式 */
.axis-classification-combined {
    @apply space-y-6;
}

.section-title {
    @apply text-lg font-bold text-gray-800 mb-3;
}

.axis-section {
    @apply bg-blue-50 border border-blue-200 rounded-lg p-4;
}

.axis-display {
    @apply space-y-2;
}

.axis-item {
    @apply flex items-center gap-3;
}

.axis-label {
    @apply text-base font-semibold text-gray-700 w-12;
}

.axis-name {
    @apply text-base text-gray-800;
}

.classification-section {
    @apply bg-green-50 border border-green-200 rounded-lg p-4;
}

.classification-display {
    @apply space-y-3;
}

.classification-item {
    @apply flex items-center gap-3;
}

.classification-label {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white;
}

.classification-desc {
    @apply text-base text-gray-700;
}

.matrix-interpretation {
    @apply bg-gray-50 border border-gray-200 rounded-lg p-4;
}

.interpretation-items {
    @apply space-y-3;
}

.interpretation-item {
    @apply flex items-center gap-3;
}

.interpretation-text {
    @apply text-base text-gray-700;
}

/* 軸線標準樣式 */
.axis-standards {
    @apply space-y-4;
}

.axis-standard {
    @apply bg-white border border-gray-200 rounded-lg p-3;
}

.axis-title {
    @apply text-sm font-semibold text-gray-700 mb-2;
}

.standard-levels {
    @apply space-y-2;
}

.standard-item {
    @apply flex items-center justify-between;
}

.standard-label {
    @apply w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white;
}

.standard-label.high-indicator {
    @apply bg-green-600;
}

.standard-label.medium-indicator {
    @apply bg-gray-600;
}

.standard-label.low-indicator {
    @apply bg-red-600;
}

.standard-value {
    @apply text-sm text-gray-600 font-mono;
}

/* 右側邊欄樣式 */
.sidebar-company-card {
    @apply transition-all duration-200;
}

.sidebar-company-card:hover {
    @apply shadow-md transform scale-[1.02];
}

.sidebar-section-title {
    @apply text-xs font-bold text-gray-500 uppercase tracking-wide;
}

.sidebar-info-row {
    @apply flex justify-between items-center py-1;
}

.sidebar-info-label {
    @apply text-sm font-medium text-gray-600;
}

.sidebar-info-value {
    @apply text-sm text-gray-800;
}

.sidebar-funding-value {
    @apply text-sm font-semibold text-green-600;
}

/* 響應式設計 */
@media (max-width: 1024px) {
    .main-content {
        @apply flex-col;
    }

    .right-section {
        @apply w-full;
    }

    /* 移動端邊欄全螢幕 */
    .fixed.right-0 {
        @apply w-full;
    }
}

@media (max-width: 768px) {
    .matrix-cell {
        min-height: 80px;
        padding: 0.5rem;
    }

    .cell-count {
        @apply text-lg;
    }

    .settings-tabs {
        @apply flex-col;
    }

    .axis-controls {
        @apply flex-col;
    }
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
</style>
