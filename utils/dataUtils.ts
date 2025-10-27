import type { EnergyStorageData, ChartDataPoint, GEMatrixResult, RiskQuadrantResult } from '~/types'
import { calculateTertiles, calculateAxisThresholds, classifyValue, classifyValueReversed, classifyValueByAxis, calculateRiskScore, calculateReturnScore } from './dataParser'

/**
 * 將資料轉換為圖表資料點
 * @param data 原始資料
 * @param xAxis X 軸欄位
 * @param yAxis Y 軸欄位
 * @param bubbleSize 氣泡大小欄位（可選）
 * @returns 圖表資料點陣列
 */
export function convertToChartData(
  data: EnergyStorageData[],
  xAxis: keyof EnergyStorageData,
  yAxis: keyof EnergyStorageData,
  bubbleSize?: keyof EnergyStorageData
): ChartDataPoint[] {
  return data.map(item => {
    const x = Number(item[xAxis]) || 0
    const y = Number(item[yAxis]) || 0
    const size = bubbleSize ? Number(item[bubbleSize]) || 0 : 10
    
    return {
      x,
      y,
      size,
      label: item.name,
      data: item
    }
  })
}

/**
 * 計算 GE 矩陣分類
 * @param data 資料陣列
 * @param xAxis X 軸欄位
 * @param yAxis Y 軸欄位
 * @returns GE 矩陣分類結果和閾值資訊
 */
export function calculateGEMatrix(
  data: EnergyStorageData[],
  xAxis: keyof EnergyStorageData,
  yAxis: keyof EnergyStorageData
): GEMatrixResult {
  const xValues = data.map(item => Number(item[xAxis]) || 0).filter(val => val > 0)
  const yValues = data.map(item => Number(item[yAxis]) || 0).filter(val => val > 0)
  
  // 使用新的軸線特定閾值計算
  const xThresholds = calculateAxisThresholds(xValues, xAxis as string)
  const yThresholds = calculateAxisThresholds(yValues, yAxis as string)
  
  console.log('GE 矩陣計算詳情:', {
    xAxis,
    yAxis,
    dataLength: data.length,
    xValuesLength: xValues.length,
    yValuesLength: yValues.length,
    xThresholds,
    yThresholds
  })
  
  // 檢查資料範圍
  if (xValues.length > 0) {
    console.log('X 軸資料範圍:', {
      min: Math.min(...xValues),
      max: Math.max(...xValues),
      avg: xValues.reduce((a, b) => a + b, 0) / xValues.length
    })
  }
  
  if (yValues.length > 0) {
    console.log('Y 軸資料範圍:', {
      min: Math.min(...yValues),
      max: Math.max(...yValues),
      avg: yValues.reduce((a, b) => a + b, 0) / yValues.length
    })
  }
  
  const result: GEMatrixResult = {
    highHigh: [],
    highMedium: [],
    highLow: [],
    mediumHigh: [],
    mediumMedium: [],
    mediumLow: [],
    lowHigh: [],
    lowMedium: [],
    lowLow: []
  }
  
  data.forEach(item => {
    const xValue = Number(item[xAxis]) || 0
    const yValue = Number(item[yAxis]) || 0
    
    // 使用新的軸線特定分類函數
    const xClass = classifyValueByAxis(xValue, xThresholds, xAxis as string)
    const yClass = classifyValueByAxis(yValue, yThresholds, yAxis as string)
    
    const key = `${yClass}${xClass.charAt(0).toUpperCase() + xClass.slice(1)}` as keyof GEMatrixResult
    result[key].push(item)
    
    console.log(`公司 ${item.name}: x=${xValue}(${xClass}), y=${yValue}(${yClass}) -> ${key}`)
  })
  
  console.log('GE 矩陣分類結果:', {
    highHigh: result.highHigh.length,
    highMedium: result.highMedium.length,
    highLow: result.highLow.length,
    mediumHigh: result.mediumHigh.length,
    mediumMedium: result.mediumMedium.length,
    mediumLow: result.mediumLow.length,
    lowHigh: result.lowHigh.length,
    lowMedium: result.lowMedium.length,
    lowLow: result.lowLow.length
  })
  
  return {
    ...result,
    xThresholds,
    yThresholds
  }
}

/**
 * 計算風險象限分類
 * @param data 資料陣列
 * @returns 風險象限分類結果
 */
export function calculateRiskQuadrant(data: EnergyStorageData[]): RiskQuadrantResult {
  const result: RiskQuadrantResult = {
    highRiskHighReturn: [],
    highRiskLowReturn: [],
    lowRiskHighReturn: [],
    lowRiskLowReturn: []
  }
  
  data.forEach(item => {
    const riskScore = calculateRiskScore(item)
    const returnScore = calculateReturnScore(item)
    
    const isHighRisk = riskScore >= 50
    const isHighReturn = returnScore >= 50
    
    if (isHighRisk && isHighReturn) {
      result.highRiskHighReturn.push(item)
    } else if (isHighRisk && !isHighReturn) {
      result.highRiskLowReturn.push(item)
    } else if (!isHighRisk && isHighReturn) {
      result.lowRiskHighReturn.push(item)
    } else {
      result.lowRiskLowReturn.push(item)
    }
  })
  
  return result
}

/**
 * 排序資料
 * @param data 資料陣列
 * @param field 排序欄位
 * @param order 排序順序
 * @returns 排序後的資料陣列
 */
export function sortData(
  data: EnergyStorageData[],
  field: keyof EnergyStorageData,
  order: 'asc' | 'desc' = 'desc'
): EnergyStorageData[] {
  return [...data].sort((a, b) => {
    const aValue = Number(a[field]) || 0
    const bValue = Number(b[field]) || 0
    
    if (order === 'asc') {
      return aValue - bValue
    } else {
      return bValue - aValue
    }
  })
}

/**
 * 分組資料
 * @param data 資料陣列
 * @param groupField 分組欄位
 * @returns 分組後的資料
 */
export function groupData(
  data: EnergyStorageData[],
  groupField: keyof EnergyStorageData
): Record<string, EnergyStorageData[]> {
  const groups: Record<string, EnergyStorageData[]> = {}
  
  data.forEach(item => {
    const groupValue = String(item[groupField]) || '未知'
    if (!groups[groupValue]) {
      groups[groupValue] = []
    }
    groups[groupValue].push(item)
  })
  
  return groups
}

/**
 * 計算資料統計
 * @param data 資料陣列
 * @param field 統計欄位
 * @returns 統計結果
 */
export function calculateFieldStatistics(
  data: EnergyStorageData[],
  field: keyof EnergyStorageData
): {
  count: number
  sum: number
  avg: number
  min: number
  max: number
  median: number
} {
  const values = data
    .map(item => Number(item[field]) || 0)
    .filter(val => val > 0)
    .sort((a, b) => a - b)
  
  if (values.length === 0) {
    return { count: 0, sum: 0, avg: 0, min: 0, max: 0, median: 0 }
  }
  
  const sum = values.reduce((acc, val) => acc + val, 0)
  const avg = sum / values.length
  const min = values[0]
  const max = values[values.length - 1]
  const median = values.length % 2 === 0
    ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
    : values[Math.floor(values.length / 2)]
  
  return {
    count: values.length,
    sum,
    avg,
    min,
    max,
    median
  }
}

/**
 * 搜尋資料
 * @param data 資料陣列
 * @param query 搜尋查詢
 * @param fields 搜尋欄位
 * @returns 搜尋結果
 */
export function searchData(
  data: EnergyStorageData[],
  query: string,
  fields: (keyof EnergyStorageData)[] = ['name', 'org_name', 'country_name']
): EnergyStorageData[] {
  if (!query.trim()) return data
  
  const lowercaseQuery = query.toLowerCase()
  
  return data.filter(item => {
    return fields.some(field => {
      const value = String(item[field] || '').toLowerCase()
      return value.includes(lowercaseQuery)
    })
  })
}

/**
 * 取樣資料
 * @param data 資料陣列
 * @param sampleSize 取樣大小
 * @returns 取樣後的資料
 */
export function sampleData(data: EnergyStorageData[], sampleSize: number): EnergyStorageData[] {
  if (data.length <= sampleSize) return data
  
  const shuffled = [...data].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, sampleSize)
}

/**
 * 去重資料
 * @param data 資料陣列
 * @param keyField 去重鍵值欄位
 * @returns 去重後的資料
 */
export function deduplicateData(
  data: EnergyStorageData[],
  keyField: keyof EnergyStorageData = 'name'
): EnergyStorageData[] {
  const seen = new Set<string>()
  return data.filter(item => {
    const key = String(item[keyField])
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
