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

  // 產品→子產業 推論規則（AI/領域知識規則）
  const inferCanonicalParent = (productType: string, fallbackSubIndustry?: string): { parent: string, type: string } => {
    const t = productType.trim()
    // 標準化名稱
    const norm = (s: string) => s.replace(/\s+/g, '')
    const p = norm(t)

    // 規則表
    const belongs = (keywords: string[]) => keywords.some(k => p.includes(norm(k)))

    if (belongs(['鋰離子電池','鋰硫電池','鈉離子電池','金屬空氣電池','固態電池','液流電池','超級電容','電化學'])) {
      return { parent: '電化學儲能', type: t }
    }
    if (belongs(['二次生命電池','電池回收','回收再利用','循環'])) {
      return { parent: '電池循環經濟', type: t }
    }
    if (belongs(['重力儲能','飛輪','抽蓄水力','空氣儲能','壓縮空氣'])) {
      return { parent: '機械儲能', type: t }
    }
    if (belongs(['熱化學儲能','顯熱','潛熱','固態熱電池','熱能'])) {
      return { parent: '熱能儲能', type: t }
    }
    if (belongs(['綠氨','電轉氫','Power-to-Hydrogen','電轉氣','合成甲烷','甲烷'])) {
      return { parent: '化學儲能', type: t }
    }
    if (belongs(['系統整合','儲能系統整合','系統集成'])) {
      return { parent: '儲能系統整合', type: t }
    }
    if (belongs(['設備供應安裝','EPC','設備安裝'])) {
      return { parent: '設備供應安裝', type: t }
    }
    if (belongs(['電磁'])) {
      return { parent: '電磁儲能', type: t }
    }
    // 其它或回退
    return { parent: fallbackSubIndustry || '其它', type: t }
  }

  // 建立階層式資料結構（以第二層為唯一鍵進行全域聚合與去重）
  const buildHierarchyData = (data: EnergyStorageData[]): SunburstAnalysisResult => {
    // 先以第二層產品/服務類型為唯一鍵做全域聚合
    const globalProductTypeMap = new Map<string, {
      name: string
      parent: string
      count: number
      totalFunding: number
      companies: Set<string>
    }>()

    const companyProductSeen = new Set<string>() // 去重：公司×產品類型

    data.forEach(company => {
      if (!company.name || !company.ProductServiceType) return
      const fallbacks = parseMultiValueField(company.SubIndustry).filter(Boolean)
      const productTypes = parseMultiValueField(company.ProductServiceType)
      const funding = company.total_funding_usd || 0

      productTypes.forEach(pt => {
        const { parent, type } = inferCanonicalParent(pt, fallbacks[0])
        const key = type // 以第二層名稱為唯一鍵
        const seenKey = `${company.name}|${key}`
        if (companyProductSeen.has(seenKey)) return
        companyProductSeen.add(seenKey)

        if (!globalProductTypeMap.has(key)) {
          globalProductTypeMap.set(key, {
            name: type,
            parent,
            count: 0,
            totalFunding: 0,
            companies: new Set<string>()
          })
        }
        const node = globalProductTypeMap.get(key)!
        node.count += 1
        node.totalFunding += funding
        node.companies.add(company.name)
      })
    })

    // 以推論的父層重組第一層 → 第二層
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
        companies: EnergyStorageData[]
      }>
    }>()

    let totalCompanies = 0
    let totalFunding = 0

    globalProductTypeMap.forEach(node => {
      const parent = node.parent
      if (!subIndustryMap.has(parent)) {
        subIndustryMap.set(parent, {
          name: parent,
          count: 0,
          totalFunding: 0,
          averageFunding: 0,
          productTypes: new Map()
        })
      }
      const parentNode = subIndustryMap.get(parent)!
      parentNode.count += node.count
      parentNode.totalFunding += node.totalFunding

      parentNode.productTypes.set(node.name, {
        name: node.name,
        count: node.count,
        totalFunding: node.totalFunding,
        averageFunding: node.count > 0 ? node.totalFunding / node.count : 0,
        companies: []
      })

      totalCompanies += node.count
      totalFunding += node.totalFunding
    })

    // 計算平均募資金額
    const result: SunburstAnalysisResult = {
      subIndustries: [],
      totalCompanies,
      totalFunding,
      averageFunding: totalCompanies > 0 ? totalFunding / totalCompanies : 0
    }

    subIndustryMap.forEach((subIndustryData, subIndustryName) => {
      subIndustryData.averageFunding = subIndustryData.count > 0 
        ? subIndustryData.totalFunding / subIndustryData.count 
        : 0

      const productTypesArray: Array<{
        name: string
        count: number
        totalFunding: number
        averageFunding: number
        companies: EnergyStorageData[]
      }> = []

      subIndustryData.productTypes.forEach((productTypeData, productTypeName) => {
        productTypeData.averageFunding = productTypeData.count > 0 
          ? productTypeData.totalFunding / productTypeData.count 
          : 0
        productTypesArray.push(productTypeData)
      })

      result.subIndustries.push({
        ...subIndustryData,
        productTypes: productTypesArray
      })
    })

    // 按公司數量排序
    result.subIndustries.sort((a, b) => b.count - a.count)
    result.subIndustries.forEach(subIndustry => {
      subIndustry.productTypes.sort((a, b) => b.count - a.count)
    })

    return result
  }

  // 轉換為 AmCharts Sunburst 格式
  const convertToSunburstFormat = (
    analysisResult: SunburstAnalysisResult,
    dataField: 'companyCount' | 'totalFunding' | 'averageFunding',
    topN: number = 12
  ): SunburstNode[] => {
    // 第一層：SubIndustry；第二層：ProductServiceType；第三層：指標值（公司數量/募資）
    const metricName = dataField === 'companyCount'
      ? '公司數量'
      : dataField === 'totalFunding'
      ? '總募資金額'
      : '平均募資金額'

    const topSubIndustries = analysisResult.subIndustries.slice(0, Math.max(1, Math.min(topN, 8)))

    return topSubIndustries.map(subIndustry => {
      const productTypeNodes: SunburstNode[] = subIndustry.productTypes.slice(0, 8).map(productType => {
        const metricValue = dataField === 'companyCount'
          ? productType.count
          : dataField === 'totalFunding'
          ? productType.totalFunding
          : productType.averageFunding

        return {
          name: productType.name,
          children: [
            {
              name: String(metricValue),
              value: metricValue
            }
          ]
        }
      })

      return {
        name: subIndustry.name,
        children: productTypeNodes
      }
    })
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
