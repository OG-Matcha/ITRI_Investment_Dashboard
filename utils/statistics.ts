import type { EnergyStorageData, Statistics, AxisOption } from '~/types'

/**
 * 計算基本統計資訊
 * @param data 資料陣列
 * @returns 統計資訊
 */
export function calculateStatistics(data: EnergyStorageData[]): Statistics {
  if (data.length === 0) {
    return {
      totalRecords: 0,
      totalFunding: 0,
      averageFunding: 0,
      topCountries: [],
      topIndustries: []
    }
  }
  
  const totalFunding = data.reduce((sum, item) => sum + item.total_funding_usd, 0)
  const averageFunding = totalFunding / data.length
  
  // 計算國家分布
  const countryCount = new Map<string, number>()
  data.forEach(item => {
    const country = item.country_name
    countryCount.set(country, (countryCount.get(country) || 0) + 1)
  })
  
  const topCountries = Array.from(countryCount.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // 計算產業分布
  const industryCount = new Map<string, number>()
  data.forEach(item => {
    const industries = item.SubIndustry.split(',').map(i => i.trim()).filter(i => i)
    industries.forEach(industry => {
      industryCount.set(industry, (industryCount.get(industry) || 0) + 1)
    })
  })
  
  const topIndustries = Array.from(industryCount.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  return {
    totalRecords: data.length,
    totalFunding,
    averageFunding,
    topCountries,
    topIndustries
  }
}

/**
 * 取得可用的軸線選項
 * @returns 軸線選項陣列
 */
export function getAxisOptions(): AxisOption[] {
  return [
    // 財務指標
    { value: 'total_funding_usd', label: '總募資金額 (USD)', type: 'financial' },
    { value: 'raised_amount_usd', label: '單次募資金額 (USD)', type: 'financial' },
    { value: 'post_money_valuation_usd', label: '投後估值 (USD)', type: 'financial' },
    { value: 'num_funding_rounds', label: '投資輪次數量', type: 'financial' },
    { value: 'rank', label: 'CB Rank 排名', type: 'financial' },
    
    // 技術指標
    { value: 'founded_year', label: '成立年份', type: 'technical' },
    { value: 'employee_count', label: '員工數量', type: 'technical' },
    { value: 'funding_year', label: '募資年份', type: 'technical' },
    
    // 地理指標
    { value: 'country_name', label: '國家', type: 'geographic' },
    { value: 'region', label: '地區', type: 'geographic' },
    { value: 'city', label: '城市', type: 'geographic' }
  ]
}

/**
 * 取得數值軸線選項
 * @returns 數值軸線選項陣列
 */
export function getNumericAxisOptions(): AxisOption[] {
  return getAxisOptions().filter(option => 
    option.type === 'financial' || option.type === 'technical'
  )
}

/**
 * 計算資料的數值範圍
 * @param data 資料陣列
 * @param field 欄位名稱
 * @returns 數值範圍
 */
export function calculateValueRange(
  data: EnergyStorageData[], 
  field: keyof EnergyStorageData
): { min: number; max: number; avg: number } {
  const values = data
    .map(item => Number(item[field]))
    .filter(val => !isNaN(val) && val > 0)
  
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0 }
  }
  
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length
  
  return { min, max, avg }
}

/**
 * 計算分位數
 * @param values 數值陣列
 * @param percentile 百分位數 (0-100)
 * @returns 分位數值
 */
export function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  
  if (Number.isInteger(index)) {
    return sorted[index]
  }
  
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * 計算相關係數
 * @param data 資料陣列
 * @param field1 欄位1
 * @param field2 欄位2
 * @returns 相關係數 (-1 到 1)
 */
export function calculateCorrelation(
  data: EnergyStorageData[],
  field1: keyof EnergyStorageData,
  field2: keyof EnergyStorageData
): number {
  const values1 = data.map(item => Number(item[field1])).filter(val => !isNaN(val))
  const values2 = data.map(item => Number(item[field2])).filter(val => !isNaN(val))
  
  if (values1.length !== values2.length || values1.length === 0) {
    return 0
  }
  
  const n = values1.length
  const sum1 = values1.reduce((sum, val) => sum + val, 0)
  const sum2 = values2.reduce((sum, val) => sum + val, 0)
  const sum1Sq = values1.reduce((sum, val) => sum + val * val, 0)
  const sum2Sq = values2.reduce((sum, val) => sum + val * val, 0)
  const sum12 = values1.reduce((sum, val, i) => sum + val * values2[i], 0)
  
  const numerator = n * sum12 - sum1 * sum2
  const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2))
  
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * 分組統計
 * @param data 資料陣列
 * @param groupField 分組欄位
 * @param valueField 數值欄位
 * @returns 分組統計結果
 */
export function groupStatistics(
  data: EnergyStorageData[],
  groupField: keyof EnergyStorageData,
  valueField: keyof EnergyStorageData
): Array<{ group: string; count: number; sum: number; avg: number; min: number; max: number }> {
  const groups = new Map<string, number[]>()
  
  data.forEach(item => {
    const groupValue = String(item[groupField])
    const value = Number(item[valueField])
    
    if (!isNaN(value)) {
      if (!groups.has(groupValue)) {
        groups.set(groupValue, [])
      }
      groups.get(groupValue)!.push(value)
    }
  })
  
  return Array.from(groups.entries()).map(([group, values]) => ({
    group,
    count: values.length,
    sum: values.reduce((sum, val) => sum + val, 0),
    avg: values.reduce((sum, val) => sum + val, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values)
  })).sort((a, b) => b.count - a.count)
}
