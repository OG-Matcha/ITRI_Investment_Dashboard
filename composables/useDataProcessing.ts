import { ref, computed, watch } from 'vue'
import type { EnergyStorageData, Statistics } from '~/types'
import { loadDefaultData, dataCache } from '~/utils/dataLoader'
import { calculateStatistics, getAxisOptions } from '~/utils/statistics'
import { cleanData, validateData } from '~/utils/dataParser'

export function useDataProcessing() {
  // 響應式狀態
  const rawData = ref<EnergyStorageData[]>([])
  const processedData = ref<EnergyStorageData[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const statistics = ref<Statistics>({
    totalRecords: 0,
    totalFunding: 0,
    averageFunding: 0,
    topCountries: [],
    topIndustries: []
  })

  // 載入資料
  const loadData = async () => {
    loading.value = true
    error.value = null
    
    try {
      console.log('🔍 useDataProcessing - 開始載入資料')
      const data = await dataCache.load('energy-storage', loadDefaultData)
      console.log('🔍 useDataProcessing - 載入的資料:', data.length, '筆')
      console.log('🔍 useDataProcessing - 前3筆資料:', data.slice(0, 3))
      
      rawData.value = data
      processedData.value = data
      statistics.value = calculateStatistics(data)
      
      console.log('✅ useDataProcessing - 資料載入成功:', data.length, '筆')
      console.log('✅ useDataProcessing - 統計資料:', statistics.value)
    } catch (err) {
      console.error('❌ useDataProcessing: 資料載入錯誤:', err);
      error.value = err instanceof Error ? err.message : '載入資料失敗'
    } finally {
      loading.value = false
    }
  }

  // 自動載入資料
  loadData()

  // 重新載入資料
  const reloadData = async () => {
    dataCache.clear()
    await loadData()
  }

  // 資料處理和清理
  const processData = (data: EnergyStorageData[]) => {
    return data.map(item => {
      const cleaned = cleanData(item)
      const validation = validateData(cleaned)
      
      if (!validation.isValid) {
        // 資料驗證失敗，但繼續處理
      }
      
      return cleaned
    }).filter(item => {
      // 過濾掉無效資料
      return item.name && item.name.trim() !== ''
    })
  }

  // 更新處理後的資料
  const updateProcessedData = (newData: EnergyStorageData[]) => {
    processedData.value = processData(newData)
    statistics.value = calculateStatistics(processedData.value)
  }

  // 取得軸線選項
  const axisOptions = computed(() => getAxisOptions())

  // 取得數值軸線選項
  const numericAxisOptions = computed(() => 
    axisOptions.value.filter(option => 
      option.type === 'financial' || option.type === 'technical'
    )
  )

  // 取得可用的篩選選項
  const filterOptions = computed(() => {
    if (processedData.value.length === 0) {
      return {
        subIndustries: [],
        productServiceTypes: [],
        countries: [],
        investmentTypes: []
      }
    }

    const subIndustries = new Set<string>()
    const productServiceTypes = new Set<string>()
    const countries = new Set<string>()
    const investmentTypes = new Set<string>()

    processedData.value.forEach(item => {
      // 處理多值欄位
      item.SubIndustry.split(',').forEach(industry => {
        const trimmed = industry.trim()
        if (trimmed) subIndustries.add(trimmed)
      })
      
      item.ProductServiceType.split(',').forEach(type => {
        const trimmed = type.trim()
        if (trimmed) productServiceTypes.add(trimmed)
      })
      
      if (item.country_name) countries.add(item.country_name)
      if (item.investment_type) investmentTypes.add(item.investment_type)
    })

    return {
      subIndustries: Array.from(subIndustries).sort(),
      productServiceTypes: Array.from(productServiceTypes).sort(),
      countries: Array.from(countries).sort(),
      investmentTypes: Array.from(investmentTypes).sort()
    }
  })

  // 監聽原始資料變化，自動更新處理後的資料
  watch(rawData, (newData) => {
    updateProcessedData(newData)
  }, { immediate: true })

  return {
    // 狀態
    rawData: readonly(rawData),
    processedData: readonly(processedData),
    loading: readonly(loading),
    error: readonly(error),
    statistics: readonly(statistics),
    
    // 計算屬性
    axisOptions,
    numericAxisOptions,
    filterOptions,
    
    // 方法
    loadData,
    reloadData,
    updateProcessedData,
    processData
  }
}
