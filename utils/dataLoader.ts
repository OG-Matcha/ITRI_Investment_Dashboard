import type { EnergyStorageData } from '~/types'
import { cleanData, validateData } from './dataParser'

/**
 * 載入 CSV 資料
 * @param csvContent CSV 內容字串
 * @returns 解析後的資料陣列
 */
export function loadCSVData(csvContent: string): EnergyStorageData[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  const data: EnergyStorageData[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue
    
    const rowData: any = {}
    headers.forEach((header, index) => {
      rowData[header] = values[index] || ''
    })
    
    const cleanedData = cleanData(rowData)
    const validation = validateData(cleanedData)
    
    if (validation.isValid) {
      data.push(cleanedData)
    }
  }
  
  return data
}

/**
 * 解析 CSV 行，處理引號和逗號
 * @param line CSV 行
 * @returns 解析後的值陣列
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

/**
 * 從檔案載入資料
 * @param filePath 檔案路徑
 * @returns Promise<EnergyStorageData[]>
 */
export async function loadDataFromFile(filePath: string): Promise<EnergyStorageData[]> {
  try {
    // 確保路徑是有效的 URL
    let url: string
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      url = filePath
    } else if (filePath.startsWith('/')) {
      // 絕對路徑，需要加上基礎 URL
      let baseUrl: string
      if (typeof window !== 'undefined') {
        // 客戶端：使用當前頁面的 origin（自動適應任何端口和域名）
        baseUrl = window.location.origin
      } else {
        // 服務端：使用環境變量，如果沒有則使用默認值
        baseUrl = process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      }
      
      // 在 GitHub Pages 部署時，需要考慮 baseURL
      const config = useRuntimeConfig()
      const appBaseURL = config.app?.baseURL || '/'
      
      // 如果 baseURL 不是 '/'，需要調整路徑
      if (appBaseURL !== '/' && !filePath.startsWith(appBaseURL)) {
        // 確保路徑正確拼接
        const cleanBaseURL = appBaseURL.endsWith('/') ? appBaseURL.slice(0, -1) : appBaseURL
        const cleanFilePath = filePath.startsWith('/') ? filePath : `/${filePath}`
        filePath = `${cleanBaseURL}${cleanFilePath}`
      }
      
      url = `${baseUrl}${filePath}`
    } else {
      // 相對路徑，直接使用
      url = filePath
    }
    
    
    // 使用 $fetch 來載入檔案
    const csvContent = await $fetch<string>(url)
    
    const data = loadCSVData(csvContent)
    return data
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    throw error // 重新拋出錯誤，讓上層處理
  }
}

/**
 * 載入預設資料
 * @returns Promise<EnergyStorageData[]>
 */
export async function loadDefaultData(): Promise<EnergyStorageData[]> {
  try {
    // 在 GitHub Pages 部署時，需要考慮 baseURL
    // 先嘗試從 public 目錄載入，如果失敗則嘗試從 assets 目錄載入
    let filePath = '/Energy_Storage_standardized.csv';
    
    try {
      const data = await loadDataFromFile(filePath);
      return data;
    } catch (firstError) {
      // 嘗試從 assets 目錄載入
      filePath = '/assets/data/Energy_Storage_standardized.csv';
      const data = await loadDataFromFile(filePath);
      return data;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`預設資料載入失敗: ${errorMsg}`);
  }
}

/**
 * 快取資料載入器
 */
class DataCache {
  private cache: Map<string, EnergyStorageData[]> = new Map()
  private loading: Map<string, Promise<EnergyStorageData[]>> = new Map()
  
  async load(key: string, loader: () => Promise<EnergyStorageData[]>): Promise<EnergyStorageData[]> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!
    }
    
    if (this.loading.has(key)) {
      return await this.loading.get(key)!
    }
    
    const promise = loader().then(data => {
      this.cache.set(key, data)
      this.loading.delete(key)
      return data
    })
    
    this.loading.set(key, promise)
    return await promise
  }
  
  clear(): void {
    this.cache.clear()
    this.loading.clear()
  }
}

export const dataCache = new DataCache()
