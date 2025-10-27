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
    } else {
      console.warn(`資料驗證失敗: ${validation.errors.join(', ')}`, cleanedData)
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
  console.log(`嘗試載入檔案: ${filePath}`)
  try {
    // 確保路徑是有效的 URL
    let url: string
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      url = filePath
    } else if (filePath.startsWith('/')) {
      // 絕對路徑，需要加上基礎 URL
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000'
      url = `${baseUrl}${filePath}`
    } else {
      // 相對路徑，直接使用
      url = filePath
    }
    
    console.log(`解析後的 URL: ${url}`)
    
    // 使用 $fetch 來載入檔案
    const csvContent = await $fetch<string>(url)
    
    console.log(`檔案載入成功 [${filePath}], 開始解析 CSV...`)
    const data = loadCSVData(csvContent)
    console.log(`CSV 解析完成 [${filePath}], 記錄數: ${data.length}`)
    return data
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`載入資料失敗 [${filePath}]:`, errorMsg)
    throw error // 重新拋出錯誤，讓上層處理
  }
}

/**
 * 載入預設資料
 * @returns Promise<EnergyStorageData[]>
 */
export async function loadDefaultData(): Promise<EnergyStorageData[]> {
  console.log('🚀 開始載入預設資料...');
  const startTime = Date.now();
  
  try {
    // 在 Nuxt 3 中，$fetch 會自動處理 public 目錄的檔案路徑
    // 直接使用相對路徑即可，$fetch 會自動解析為正確的 URL
    const filePath = '/Energy_Storage_standardized.csv';
    console.log(`📁 載入檔案: ${filePath}`);
    
    const data = await loadDataFromFile(filePath);
    
    const loadTime = Date.now() - startTime;
    console.log(`🎉 預設資料載入成功！`);
    console.log(`📊 使用路徑: ${filePath}`);
    console.log(`📈 記錄數: ${data.length}`);
    console.log(`⏱️ 載入時間: ${loadTime}ms`);
    
    return data;
  } catch (error) {
    const loadTime = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('💥 預設資料載入失敗！');
    console.error('⏱️ 失敗時間:', loadTime + 'ms');
    console.error('❌ 錯誤詳情:', errorMsg);
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
