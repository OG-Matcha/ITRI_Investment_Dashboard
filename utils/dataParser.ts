import type { EnergyStorageData } from '~/types'

/**
 * 解析逗號分隔的多值欄位
 * @param value 原始字串值
 * @returns 解析後的字串陣列
 */
export function parseMultiValueField(value: string | undefined): string[] {
  if (!value || value.trim() === '') return []
  return value.split(',').map(item => item.trim()).filter(item => item !== '')
}

/**
 * 格式化金額顯示
 * @param amount 金額數值
 * @returns 格式化後的字串
 */
export function formatCurrency(amount: number): string {
  if (amount === 0) return '$0'
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
  return `$${amount.toFixed(0)}`
}

/**
 * 計算三分位數分類
 * @param values 數值陣列
 * @returns 高中低分類的閾值
 */
export function calculateTertiles(values: number[]): { low: number; medium: number; high: number } {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  
  if (n === 0) return { low: 0, medium: 0, high: 0 }
  
  // 計算 33% 和 67% 分位數作為閾值
  const lowIndex = Math.floor(n * 0.33)
  const mediumIndex = Math.floor(n * 0.67)
  
  return {
    low: sorted[lowIndex] || 0,
    medium: sorted[mediumIndex] || 0,
    high: sorted[n - 1] || 0
  }
}

/**
 * 根據軸線類型計算閾值
 * @param values 數值陣列
 * @param axisType 軸線類型
 * @returns 閾值物件
 */
export function calculateAxisThresholds(
  values: number[], 
  axisType: string
): { low: number; medium: number; high: number } {
  // 使用預定義的固定閾值，而不是基於資料計算
  const predefinedThresholds: Record<string, { low: number; medium: number; high: number }> = {
    total_funding_usd: {
      low: 1000000,      // $1M
      medium: 10000000,  // $10M
      high: 100000000    // $100M
    },
    post_money_valuation_usd: {
      low: 10000000,     // $10M
      medium: 100000000, // $100M
      high: 1000000000   // $1B
    },
    num_funding_rounds: {
      low: 2,            // 2 輪
      medium: 5,         // 5 輪
      high: 10           // 10 輪
    },
    employee_count: {
      low: 10,           // 10 人
      medium: 100,       // 100 人
      high: 1000         // 1000 人
    },
    rank: {
      high: 50000,       // 50K (高排名)
      medium: 500000,    // 500K (中排名)
      low: 5000000       // 5M (低排名)
    },
    founded_year: {
      low: 2020,         // 2020 年
      medium: 2020,      // 2020 年
      high: 2025         // 2025 年
    },
    funding_year: {
      low: 2020,         // 2020 年
      medium: 2020,      // 2020 年
      high: 2025         // 2025 年
    }
  }
  
  const thresholds = predefinedThresholds[axisType]
  if (thresholds) {
    return thresholds
  }
  
  // 如果沒有預定義閾值，回退到預設值
  return { low: 0, medium: 0, high: 0 }
}

/**
 * 分類數值到高中低等級
 * @param value 要分類的數值
 * @param thresholds 閾值物件
 * @returns 分類結果
 */
export function classifyValue(
  value: number, 
  thresholds: { low: number; medium: number; high: number }
): 'low' | 'medium' | 'high' {
  if (value <= thresholds.low) return 'low'
  if (value <= thresholds.medium) return 'medium'
  return 'high'
}

/**
 * 反轉分類函數（用於年份等需要反向分類的欄位）
 * @param value 數值
 * @param thresholds 閾值
 * @returns 分類結果
 */
export function classifyValueReversed(
  value: number, 
  thresholds: { low: number; medium: number; high: number }
): 'low' | 'medium' | 'high' {
  if (value >= thresholds.high) return 'high'
  if (value >= thresholds.medium) return 'medium'
  return 'low'
}

/**
 * 根據軸線類型分類數值
 * @param value 要分類的數值
 * @param thresholds 閾值物件
 * @param axisType 軸線類型
 * @returns 分類結果
 */
export function classifyValueByAxis(
  value: number, 
  thresholds: { low: number; medium: number; high: number },
  axisType: string
): 'low' | 'medium' | 'high' {
  if (axisType === 'rank') {
    // rank 欄位：數值越小表示排名越高（越好）
    if (value <= thresholds.high) return 'high'  // 小於等於最好排名
    if (value <= thresholds.medium) return 'medium'  // 小於等於中等排名
    return 'low'  // 大於中等排名
  } else if (axisType === 'founded_year' || axisType === 'funding_year') {
    // 年份欄位：數值越大（越新）表示越高
    if (value >= thresholds.high) return 'high'  // 大於等於最新年份
    if (value >= thresholds.medium) return 'medium'  // 大於等於中等年份
    return 'low'  // 小於中等年份
  } else {
    // 其他欄位：數值越大表示越高
    if (value >= thresholds.high) return 'high'  // 大於等於最高值
    if (value >= thresholds.medium) return 'medium'  // 大於等於中等值
    return 'low'  // 小於中等值
  }
}

/**
 * 計算風險評分
 * @param data 投資資料
 * @param weights 風險權重
 * @returns 風險評分 (0-100)
 */
export function calculateRiskScore(
  data: EnergyStorageData, 
  weights?: { fundingRounds: number; companyAge: number; cbRank: number }
): number {
  // 預設權重
  const defaultWeights = { fundingRounds: 0.4, companyAge: 0.3, cbRank: 0.3 }
  const w = weights || defaultWeights
  
  let riskScore = 0
  
  // 投資輪次越多風險越高
  if (data.num_funding_rounds > 0) {
    const roundsScore = Math.min(data.num_funding_rounds * 10, 40)
    riskScore += roundsScore * w.fundingRounds
  }
  
  // 公司年齡越短風險越高
  const currentYear = new Date().getFullYear()
  const companyAge = currentYear - data.founded_year
  let ageScore = 0
  if (companyAge < 5) ageScore = 30
  else if (companyAge < 10) ageScore = 15
  riskScore += ageScore * w.companyAge
  
  // CB Rank 越高風險越低
  if (data.rank > 0) {
    const rankScore = Math.max(0, 30 - (data.rank / 10000))
    riskScore += rankScore * w.cbRank
  }
  
  return Math.min(Math.max(riskScore, 0), 100)
}

/**
 * 計算回報評分
 * @param data 投資資料
 * @param weights 回報權重
 * @returns 回報評分 (0-100)
 */
export function calculateReturnScore(
  data: EnergyStorageData, 
  weights?: { totalFunding: number; valuation: number }
): number {
  // 預設權重
  const defaultWeights = { totalFunding: 0.5, valuation: 0.5 }
  const w = weights || defaultWeights
  
  let returnScore = 0
  
  // 募資金額越高回報越高 - 使用標準化方法
  if (data.total_funding_usd > 0) {
    // 使用對數標準化，但調整係數以覆蓋更廣範圍
    const fundingLog = Math.log10(data.total_funding_usd)
    // 調整係數，使評分能覆蓋 0-100 範圍
    const fundingScore = Math.min(Math.max(fundingLog * 20, 0), 100)
    returnScore += fundingScore * w.totalFunding
  }
  
  // 投後估值越高回報越高 - 使用標準化方法
  if (data.post_money_valuation_usd && data.post_money_valuation_usd > 0) {
    // 使用對數標準化，但調整係數以覆蓋更廣範圍
    const valuationLog = Math.log10(data.post_money_valuation_usd)
    // 調整係數，使評分能覆蓋 0-100 範圍
    const valuationScore = Math.min(Math.max(valuationLog * 20, 0), 100)
    returnScore += valuationScore * w.valuation
  }
  
  // 如果沒有募資金額和估值資料，給予基礎評分
  if (data.total_funding_usd <= 0 && (!data.post_money_valuation_usd || data.post_money_valuation_usd <= 0)) {
    returnScore = 10 // 給予最低基礎評分
  }
  
  return Math.min(Math.max(returnScore, 0), 100)
}

/**
 * 驗證資料完整性
 * @param data 投資資料
 * @returns 驗證結果
 */
export function validateData(data: EnergyStorageData): { isValid: boolean; errors: string[] } {
  // 接受所有能成功解析的資料，不進行嚴格驗證
  // 資料本來就會有缺漏，我們針對所有資料，當他能夠被解析就算上
  return {
    isValid: true,
    errors: []
  }
}

/**
 * 清理和標準化資料
 * @param data 原始資料
 * @returns 清理後的資料
 */
export function cleanData(data: any): EnergyStorageData {
  return {
    name: data.name || '',
    org_name: data.org_name || data.name || '',
    legal_name: data.legal_name || '',
    homepage_url: data.homepage_url || '',
    cb_url: data.cb_url || '',
    Industry: data.Industry || '',
    SubIndustry: data.SubIndustry || '',
    ProductServiceType: data.ProductServiceType || '',
    category_list: data.category_list || '',
    category_groups_list: data.category_groups_list || '',
    country_code: data.country_code || '',
    country_name: data.country_name || '',
    country_name_full: data.country_name_full || '',
    region: data.region || '',
    city: data.city || '',
    investment_type: data.investment_type || '',
    total_funding_usd: parseFloat(data.total_funding_usd) || 0,
    raised_amount_usd: parseFloat(data.raised_amount_usd) || 0,
    num_funding_rounds: parseInt(data.num_funding_rounds) || 0,
    funding_year: parseInt(data.funding_year) || 0,
    announced_on: data.announced_on || '',
    last_funding_on: data.last_funding_on || '',
    rank: parseInt(data.rank) || 0,
    status: data.status || '',
    founded_on: data.founded_on || '',
    founded_year: parseInt(data.founded_year) || 0,
    employee_count: parseInt(data.employee_count) || 0,
    closed_on: data.closed_on || '',
    post_money_valuation_usd: parseFloat(data.post_money_valuation_usd) || 0,
    post_money_valuation: data.post_money_valuation || '',
    Post_Money_Value: data.Post_Money_Value || '',
    investor_name: data.investor_name || '',
    investor_type: data.investor_type || '',
    investor_types: data.investor_types || '',
    is_lead_investor: data.is_lead_investor || '',
    investor_count: parseInt(data.investor_count) || 0,
    Unicorn: data.Unicorn || '',
    went_public_on: data.went_public_on || '',
    went_public_year: parseInt(data.went_public_year) || 0,
    stock_symbol: data.stock_symbol || '',
    acquired_on: data.acquired_on || '',
    acquirer_name: data.acquirer_name || ''
  }
}
