import { ref, computed, watch, readonly, type Ref } from 'vue'
import type { EnergyStorageData, SunburstNode, SunburstData, SunburstAnalysisResult } from '~/types'

export function useSunburstData(data: Ref<EnergyStorageData[]>) {
  // 響應式狀態
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 快取機制
  let lastDataHash = ''
  let cachedResult: SunburstAnalysisResult | null = null

  // 解析多值欄位
  const parseMultiValueField = (field: string): string[] => {
    if (!field || typeof field !== 'string') return []
    return field
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
  }

  // 生成資料雜湊值用於快取
  const generateDataHash = (data: EnergyStorageData[]): string => {
    return data.map(item => `${item.name}-${item.SubIndustry}-${item.ProductServiceType}-${item.total_funding_usd}`).join('|')
  }

  // 根據 ProductServiceType 推論應該屬於哪個 SubIndustry
  const inferSubIndustryFromProductType = (productType: string, fallbackSubIndustries: string[]): string => {
    const t = productType.trim()
    const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()
    const p = norm(t)

    // 規則表：根據 ProductServiceType 的關鍵字推論 SubIndustry
    const belongs = (keywords: string[]) => keywords.some(k => p.includes(norm(k)))

    // 優先匹配更精確的關鍵字（放在前面）
    
    // 電池循環經濟相關
    if (belongs(['二次生命電池','電池回收','回收再利用','循環經濟','電池循環','電池再利用'])) {
      return '電池循環經濟'
    }
    
    // 儲能專案開發與營運相關
    if (belongs(['儲能專案開發與營運商','儲能專案開發','儲能專案營運','專案開發與營運','專案開發營運商','專案營運'])) {
      return '儲能系統整合'
    }
    
    // 系統整合相關
    if (belongs(['系統整合','儲能系統整合','系統集成','系統整合服務'])) {
      return '儲能系統整合'
    }
    
    // 設備供應安裝相關
    if (belongs(['設備供應安裝','EPC','設備安裝','工程總承包','設備供應'])) {
      return '設備供應安裝'
    }
    
    // 電化學儲能相關（放在電池循環經濟之後，避免誤判）
    if (belongs(['鋰離子電池','鋰硫電池','鈉離子電池','金屬空氣電池','固態電池','液流電池','超級電容','電化學儲能','鋰電池','鈉電池'])) {
      return '電化學儲能'
    }
    
    // 機械儲能相關
    if (belongs(['重力儲能','飛輪儲能','抽蓄水力','抽蓄水力儲能','壓縮空氣儲能','空氣儲能','飛輪','抽蓄','重力'])) {
      return '機械儲能'
    }
    
    // 化學儲能相關（必須在熱能儲能之前，避免「合成甲烷」等被誤判）
    if (belongs(['綠氨','電轉氫','Power-to-Hydrogen','電轉氣','合成甲烷','甲烷儲能','氫能儲能'])) {
      return '化學儲能'
    }
    
    // 熱能儲能相關（放在化學儲能之後，避免誤判）
    if (belongs(['熱化學儲能','顯熱儲能','潛熱儲能','固態熱電池','熱能儲能','地壓地熱儲能','地熱儲能'])) {
      return '熱能儲能'
    }
    
    // 電磁儲能相關
    if (belongs(['電磁儲能','超導磁儲能','超導儲能'])) {
      return '電磁儲能'
    }
    
    // 如果都不匹配，直接歸類到「其它」
    return '其它'
  }

  // 建立階層式資料結構：根據 ProductServiceType 推論應該屬於哪個 SubIndustry
  const buildHierarchyData = (data: EnergyStorageData[]): SunburstAnalysisResult => {
    // 第一層：SubIndustry → 第二層：ProductServiceType
    // 根據 ProductServiceType 的內容推論應該屬於哪個 SubIndustry
    const subIndustryMap = new Map<string, {
      name: string
      count: number
      totalFunding: number
      averageFunding: number
      productTypes: Map<string, {
        name: string
        count: number
        totalFunding: number
        averageFunding: number
        companies: Set<string>
      }>
    }>()

    const companyProductSeen = new Set<string>() // 去重：公司×ProductServiceType

    data.forEach(company => {
      if (!company.name || !company.ProductServiceType) return
      
      const fallbackSubIndustries = parseMultiValueField(company.SubIndustry).filter(Boolean).map(s => s.trim())
      const productTypes = parseMultiValueField(company.ProductServiceType).filter(Boolean).map(p => p.trim())
      const funding = company.total_funding_usd || 0

      productTypes.forEach(productType => {
        // 根據 ProductServiceType 推論應該屬於哪個 SubIndustry
        const inferredSubIndustry = inferSubIndustryFromProductType(productType, fallbackSubIndustries)
        
        // 去重：同一個公司的同一個 ProductServiceType 只計算一次
        const seenKey = `${company.name}|${productType}`
        if (companyProductSeen.has(seenKey)) return
        companyProductSeen.add(seenKey)

        // 確保 SubIndustry 存在
        if (!subIndustryMap.has(inferredSubIndustry)) {
          subIndustryMap.set(inferredSubIndustry, {
            name: inferredSubIndustry,
            count: 0,
            totalFunding: 0,
            averageFunding: 0,
            productTypes: new Map()
          })
        }

        const subIndustryNode = subIndustryMap.get(inferredSubIndustry)!

        // 確保 ProductServiceType 存在於該 SubIndustry 下
        if (!subIndustryNode.productTypes.has(productType)) {
          subIndustryNode.productTypes.set(productType, {
            name: productType,
            count: 0,
            totalFunding: 0,
            averageFunding: 0,
            companies: new Set<string>()
          })
        }

        const productTypeNode = subIndustryNode.productTypes.get(productType)!
        productTypeNode.count += 1
        productTypeNode.totalFunding += funding
        productTypeNode.companies.add(company.name)
      })
    })

    // 計算 SubIndustry 層級的統計
    let totalCompanies = 0
    let totalFunding = 0

    subIndustryMap.forEach((subIndustryData) => {
      // 計算該 SubIndustry 下的總公司數和總募資
      subIndustryData.count = 0
      subIndustryData.totalFunding = 0
      
      subIndustryData.productTypes.forEach((productTypeData) => {
        subIndustryData.count += productTypeData.count
        subIndustryData.totalFunding += productTypeData.totalFunding
      })

      subIndustryData.averageFunding = subIndustryData.count > 0 
        ? subIndustryData.totalFunding / subIndustryData.count 
        : 0

      totalCompanies += subIndustryData.count
      totalFunding += subIndustryData.totalFunding
    })

    // 構建結果
    const result: SunburstAnalysisResult = {
      subIndustries: [],
      totalCompanies,
      totalFunding,
      averageFunding: totalCompanies > 0 ? totalFunding / totalCompanies : 0
    }

    subIndustryMap.forEach((subIndustryData) => {
      const productTypesArray: Array<{
        name: string
        count: number
        totalFunding: number
        averageFunding: number
        companies: EnergyStorageData[]
      }> = []

      subIndustryData.productTypes.forEach((productTypeData) => {
        productTypeData.averageFunding = productTypeData.count > 0 
          ? productTypeData.totalFunding / productTypeData.count 
          : 0
        productTypesArray.push({
          name: productTypeData.name,
          count: productTypeData.count,
          totalFunding: productTypeData.totalFunding,
          averageFunding: productTypeData.averageFunding,
          companies: [] // 不保存完整公司數據，只保存統計
        })
      })

      result.subIndustries.push({
        name: subIndustryData.name,
        count: subIndustryData.count,
        totalFunding: subIndustryData.totalFunding,
        averageFunding: subIndustryData.averageFunding,
        productTypes: productTypesArray
      })
    })

    // 按公司數量排序
    result.subIndustries.sort((a, b) => b.count - a.count)
    result.subIndustries.forEach(subIndustry => {
      subIndustry.productTypes.sort((a, b) => b.count - a.count)
    })

    // 調試：輸出數據結構並檢查重複（可選，用於驗證）
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Sunburst 數據結構 ===')
      console.log('SubIndustry 總數:', result.subIndustries.length)
      result.subIndustries.forEach((sub, idx) => {
        console.log(`${idx + 1}. ${sub.name}: ${sub.productTypes.length} 個 ProductServiceType, count: ${sub.count}`)
      })
      
      // 檢查跨 SubIndustry 的重複 ProductServiceType
      const allProductTypes = new Map<string, string[]>()
      result.subIndustries.forEach(sub => {
        sub.productTypes.forEach(pt => {
          if (!allProductTypes.has(pt.name)) {
            allProductTypes.set(pt.name, [])
          }
          allProductTypes.get(pt.name)!.push(sub.name)
        })
      })
      const crossDuplicates = Array.from(allProductTypes.entries()).filter(([name, subIndustries]) => subIndustries.length > 1)
      if (crossDuplicates.length > 0) {
        console.warn('⚠️ 跨 SubIndustry 的重複 ProductServiceType（會導致圖層重疊）:')
        crossDuplicates.forEach(([name, subIndustries]) => {
          console.warn(`   ${name} 出現在: ${subIndustries.join(', ')}`)
        })
      }
    }

    return result
  }

  // 轉換為 AmCharts Sunburst 格式
  const convertToSunburstFormat = (
    analysisResult: SunburstAnalysisResult,
    dataField: 'companyCount' | 'totalFunding' | 'averageFunding',
    topN: number = 12
  ): SunburstNode[] => {
    // 第一層：所有 SubIndustry（根節點）；第二層：ProductServiceType（子節點，指標值直接作為 value）
    // 顯示所有 SubIndustry，不限制數量
    const allSubIndustries = analysisResult.subIndustries

    const filteredSubIndustries = allSubIndustries.filter(
      subIndustry => subIndustry.productTypes && subIndustry.productTypes.length > 0
    )

    // 調試：輸出轉換後的數據（可選，用於驗證）
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Sunburst 轉換後的數據 ===')
      console.log('SubIndustry 節點數:', filteredSubIndustries.length, 'dataField:', dataField)
    }

    const result: SunburstNode[] = []
    
    filteredSubIndustries.forEach(subIndustry => {
        // 轉換第二層：ProductServiceType（顯示所有對應的 ProductServiceType）
        const productTypeNodes: SunburstNode[] = subIndustry.productTypes
          .filter(productType => productType.name && productType.name.trim().length > 0) // 過濾掉空名稱
          .map(productType => {
            const metricValue = dataField === 'companyCount'
              ? productType.count
              : dataField === 'totalFunding'
              ? productType.totalFunding
              : productType.averageFunding

            // 確保 value 是有效數字
            const validValue = typeof metricValue === 'number' && !isNaN(metricValue) ? metricValue : 0

            // 第二層節點：只有 name 和 value，沒有 children
            return {
              name: productType.name.trim(),
              value: validValue
            }
          })
          // 注意：不過濾 value 為 0 的節點，因為可能是有意義的數據（例如公司數量為 0 但募資不為 0）

        // 如果完全沒有子節點，則跳過
        if (productTypeNodes.length === 0) {
          return
        }

        // 第一層的 value 為所有子節點的 value 總和
        const subIndustryValue = productTypeNodes.reduce((sum, node) => sum + (node.value || 0), 0)

        // 確保 value 至少為 1，避免 AmCharts 因為 value 為 0 而不顯示
        // 但這只是為了顯示，實際統計數據仍然正確
        const finalValue = subIndustryValue > 0 ? subIndustryValue : 1

        // 第一層節點：包含 name、value 和 children
        result.push({
          name: subIndustry.name.trim(),
          value: finalValue,
          children: productTypeNodes
        })
      })
    
    return result
  }

  // 計算屬性 - 加入快取機制
  const analysisResult = computed(() => {
    if (!data.value || data.value.length === 0) {
      return {
        subIndustries: [],
        totalCompanies: 0,
        totalFunding: 0,
        averageFunding: 0
      }
    }

    try {
      const currentHash = generateDataHash(data.value)
      
      // 檢查快取
      if (currentHash === lastDataHash && cachedResult) {
        return cachedResult
      }

      // 重新計算並快取
      const result = buildHierarchyData(data.value)
      lastDataHash = currentHash
      cachedResult = result
      
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '資料處理失敗'
      console.error('Sunburst 資料處理錯誤:', err)
      return {
        subIndustries: [],
        totalCompanies: 0,
        totalFunding: 0,
        averageFunding: 0
      }
    }
  })

  const sunburstData = computed((): SunburstData => {
    const result = analysisResult.value

    return {
      companyCount: convertToSunburstFormat(result, 'companyCount', 12),
      totalFunding: convertToSunburstFormat(result, 'totalFunding', 12),
      averageFunding: convertToSunburstFormat(result, 'averageFunding', 12)
    }
  })

  // 監聽資料變化
  watch(data, () => {
    loading.value = true
    error.value = null
    
    // 模擬處理時間
    setTimeout(() => {
      loading.value = false
    }, 100)
  }, { immediate: true })

  return {
    sunburstData: readonly(sunburstData),
    analysisResult: readonly(analysisResult),
    loading: readonly(loading),
    error: readonly(error)
  }
}
